import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendEmail, bookingConfirmedEmail, appointmentReminderEmail } from '../lib/mailer';
import { upload, resolveImageUrl } from '../lib/upload';

const router = Router();
router.use(authMiddleware);

const VIP_THRESHOLD = 20;

async function checkAndPromoteVip(clientId: string): Promise<void> {
  const client = await prisma.client.findUnique({ where: { id: clientId }, select: { visitCount: true, isVip: true } });
  if (client && !client.isVip && client.visitCount >= VIP_THRESHOLD) {
    await prisma.client.update({ where: { id: clientId }, data: { isVip: true } });
  }
}

router.get('/', async (req: AuthRequest, res: Response) => {
  const { date, week, professionalId, status } = req.query;
  let dateFilter = {};

  if (date) {
    const d = new Date(String(date));
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    dateFilter = { date: { gte: d, lt: next } };
  } else if (week) {
    const start = new Date(String(week));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    dateFilter = { date: { gte: start, lt: end } };
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      businessId: req.user!.businessId,
      ...dateFilter,
      ...(professionalId ? { professionalId: String(professionalId) } : {}),
      ...(status ? {
        status: String(status).includes(',')
          ? { in: String(status).split(',') as any[] }
          : String(status) as any,
      } : {}),
    },
    include: {
      client: { select: { id: true, name: true, phone: true, photo: true, isVip: true, visitCount: true } },
      professional: { select: { id: true, name: true, avatar: true } },
      services: { include: { service: { select: { id: true, name: true, price: true, duration: true, checklist: true } } } },
      payment: true,
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });
  res.json(appointments);
});

router.get('/booking-requests', async (req: AuthRequest, res: Response) => {
  const requests = await prisma.bookingRequest.findMany({
    where: { businessId: req.user!.businessId },
    include: { service: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(requests);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const appt = await prisma.appointment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
    include: {
      client: true,
      professional: { select: { id: true, name: true, avatar: true } },
      services: { include: { service: true } },
      payment: true,
      photos: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!appt) return res.status(404).json({ error: 'Cita no encontrada' });
  res.json(appt);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { clientId, professionalId, date, startTime, endTime, serviceIds, notes, recurrence, occurrences, packagePrice } = req.body;
  if (!clientId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  const services = serviceIds?.length
    ? await prisma.service.findMany({ where: { id: { in: serviceIds } } })
    : [];
  const totalPrice = packagePrice !== undefined
    ? Number(packagePrice)
    : services.reduce((s, sv) => s + sv.price, 0);
  const profId = professionalId || req.user!.id;

  // Build list of dates based on recurrence
  const INTERVAL_DAYS: Record<string, number> = { WEEKLY: 7, BIWEEKLY: 14, MONTHLY: 30 };
  const intervalDays = recurrence && recurrence !== 'NONE' ? (INTERVAL_DAYS[recurrence] ?? 7) : 0;
  const count = intervalDays > 0 ? Math.min(Number(occurrences) || 8, 26) : 1;
  const dates: Date[] = [];
  const baseDate = new Date(date);
  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() + i * intervalDays);
    dates.push(d);
  }

  const groupId = count > 1 ? `grp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}` : null;

  const created = [];
  for (const d of dates) {
    const conflict = await prisma.appointment.findFirst({
      where: {
        professionalId: profId,
        date: d,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } },
        ],
      },
    });
    if (conflict) continue; // skip conflicting slots silently

    const appt = await prisma.appointment.create({
      data: {
        clientId,
        professionalId: profId,
        businessId: req.user!.businessId,
        date: d,
        startTime,
        endTime,
        notes,
        totalPrice,
        recurrenceRule: count > 1 ? (recurrence ?? null) : null,
        recurrenceGroupId: groupId,
        services: { create: services.map((s) => ({ serviceId: s.id, price: s.price })) },
      },
      include: {
        client: true,
        professional: { select: { id: true, name: true } },
        services: { include: { service: true } },
      },
    });
    created.push(appt);
  }

  if (!created.length) return res.status(409).json({ error: 'Conflicto de horario en todas las fechas seleccionadas' });

  await prisma.client.update({
    where: { id: clientId },
    data: { visitCount: { increment: created.length } },
  });
  await checkAndPromoteVip(clientId);

  res.status(201).json(created.length === 1 ? created[0] : { appointments: created, count: created.length });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'Cita no encontrada' });

  const { date, startTime, endTime, status, notes } = req.body;
  const appt = await prisma.appointment.update({
    where: { id: req.params.id },
    data: {
      ...(date ? { date: new Date(date) } : {}),
      ...(startTime ? { startTime } : {}),
      ...(endTime ? { endTime } : {}),
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
    include: { client: true, professional: { select: { id: true, name: true } }, services: { include: { service: true } }, payment: true },
  });

  if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
    await checkAndPromoteVip(existing.clientId);
    // 1 loyalty point per $1,000 COP of appointment total
    const pointsEarned = Math.floor((appt.totalPrice ?? 0) / 1000);
    if (pointsEarned > 0) {
      await prisma.client.update({ where: { id: existing.clientId }, data: { points: { increment: pointsEarned } } });
    }
    const freshClient = await prisma.client.findUnique({ where: { id: existing.clientId } });
    if (freshClient) (appt as any).client = freshClient;

    // Auto-deplete inventory: for each service in this appointment, consume linked products
    const serviceIds = appt.services.map((s: any) => s.serviceId);
    if (serviceIds.length > 0) {
      const links = await prisma.serviceProduct.findMany({
        where: { serviceId: { in: serviceIds } },
      });
      for (const link of links) {
        await prisma.product.update({
          where: { id: link.productId },
          data: { stock: { decrement: link.quantity } },
        });
        await prisma.stockMovement.create({
          data: {
            productId: link.productId,
            type: 'OUT',
            quantity: Number(link.quantity),
            notes: `Auto: cita ${req.params.id.slice(-6)}`,
          },
        });
      }
    }
  }

  res.json(appt);
});

// DELETE /:id/series — cancel all future appointments in the same recurrence group
router.delete('/:id/series', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'Cita no encontrada' });
  if (!existing.recurrenceGroupId) return res.status(400).json({ error: 'No es una cita recurrente' });

  const now = existing.date;
  await prisma.appointment.updateMany({
    where: {
      recurrenceGroupId: existing.recurrenceGroupId,
      businessId: req.user!.businessId,
      date: { gte: now },
      payment: null,
    },
    data: { status: 'CANCELLED' },
  });
  res.json({ ok: true });
});

// PATCH /:id/rating — save client satisfaction rating (1–5 stars + optional note)
router.patch('/:id/rating', async (req: AuthRequest, res: Response) => {
  const { rating, reviewNote } = req.body;
  const r = Number(rating);
  if (!r || r < 1 || r > 5) return res.status(400).json({ error: 'Calificación 1–5 requerida' });

  const existing = await prisma.appointment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'Cita no encontrada' });

  const appt = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { rating: r, reviewNote: reviewNote ?? null },
  });
  res.json({ rating: appt.rating, reviewNote: appt.reviewNote });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.appointment.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Cita no encontrada' });
  await prisma.appointment.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// ── Proposal system ───────────────────────────────────────────────────

router.post('/:id/propose', async (req: AuthRequest, res: Response) => {
  const { designIds } = req.body;
  if (!Array.isArray(designIds) || designIds.length < 1 || designIds.length > 4) {
    return res.status(400).json({ error: 'Se requieren entre 1 y 4 diseños' });
  }

  const appt = await prisma.appointment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!appt) return res.status(404).json({ error: 'Cita no encontrada' });

  const shareToken = appt.shareToken
    || `${req.user!.businessId.slice(-4)}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: {
      proposedDesigns: JSON.stringify(designIds),
      shareToken,
      approvedDesignId: null,
    },
    include: {
      client: { select: { id: true, name: true, phone: true } },
      professional: { select: { id: true, name: true } },
      services: { include: { service: true } },
    },
  });

  const origin = req.headers.origin || 'http://localhost:5173';
  res.json({ ...updated, shareUrl: `${origin}/cliente/aprobar/${shareToken}` });
});

// ── Booking requests ──────────────────────────────────────────────────

router.post('/booking-requests/:id/convert', async (req: AuthRequest, res: Response) => {
  const br = await prisma.bookingRequest.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
    include: { service: true },
  });
  if (!br) return res.status(404).json({ error: 'Solicitud no encontrada' });

  // Find or create client by phone
  let client = await prisma.client.findFirst({
    where: { phone: br.clientPhone, businessId: req.user!.businessId },
  });
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: br.clientName,
        phone: br.clientPhone,
        email: br.clientEmail ?? undefined,
        businessId: req.user!.businessId,
      },
    });
  }

  // Resolve all service IDs (multi-service support)
  let allServiceIds: string[] = [];
  try { allServiceIds = JSON.parse((br as any).serviceIds || '[]'); } catch {}
  if (!allServiceIds.length && br.serviceId) allServiceIds = [br.serviceId];

  const allServices = allServiceIds.length
    ? await prisma.service.findMany({ where: { id: { in: allServiceIds } } })
    : (br.service ? [br.service] : []);

  const totalPrice = allServices.reduce((s, sv) => s + sv.price, 0);
  const totalDuration = allServices.reduce((s, sv) => s + sv.duration, 0) || 60;
  const [h, m] = br.timeSlot.split(':').map(Number);
  const endH = Math.floor((h * 60 + (m || 0) + totalDuration) / 60);
  const endM = (h * 60 + (m || 0) + totalDuration) % 60;
  const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const appt = await prisma.appointment.create({
    data: {
      clientId: client.id,
      professionalId: req.user!.id,
      businessId: req.user!.businessId,
      date: new Date(br.date),
      startTime: br.timeSlot,
      endTime,
      totalPrice,
      notes: br.notes ?? undefined,
      ...(allServices.length > 0 ? {
        services: { create: allServices.map(sv => ({ serviceId: sv.id, price: sv.price })) },
      } : {}),
    },
    include: {
      client: { select: { id: true, name: true, phone: true } },
      services: { include: { service: true } },
    },
  });

  await prisma.bookingRequest.update({
    where: { id: br.id },
    data: { status: 'CONVERTED' },
  });

  // Send confirmation email if client has email
  if (client.email) {
    const biz = await prisma.business.findUnique({ where: { id: req.user!.businessId }, select: { name: true } });
    const shareToken = appt.shareToken;
    const origin = 'https://beautyos.co';
    const email = bookingConfirmedEmail({
      clientName: client.name,
      salonName: biz?.name ?? 'El salón',
      date: appt.date.toISOString().slice(0, 10),
      startTime: appt.startTime,
      services: appt.services.map((s: any) => s.service.name),
      shareUrl: shareToken ? `${origin}/cliente/aprobar/${shareToken}` : undefined,
    });
    sendEmail({ to: client.email, ...email });
  }

  res.status(201).json({ appointment: appt, client });
});

// GET /api/appointments/:id/photos
router.get('/:id/photos', async (req: AuthRequest, res: Response) => {
  const appt = await prisma.appointment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!appt) return res.status(404).json({ error: 'Cita no encontrada' });
  const photos = await prisma.appointmentPhoto.findMany({
    where: { appointmentId: req.params.id },
    orderBy: { createdAt: 'asc' },
  });
  res.json(photos);
});

// POST /api/appointments/:id/photos
router.post('/:id/photos', upload.single('photo'), async (req: AuthRequest, res: Response) => {
  const appt = await prisma.appointment.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!appt) return res.status(404).json({ error: 'Cita no encontrada' });
  if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });

  const url = await resolveImageUrl(req.file.path);
  const { type = 'AFTER', caption } = req.body;

  const photo = await prisma.appointmentPhoto.create({
    data: { url, type, caption: caption || null, appointmentId: req.params.id },
  });
  res.status(201).json(photo);
});

// DELETE /api/appointments/:id/photos/:photoId
router.delete('/:id/photos/:photoId', async (req: AuthRequest, res: Response) => {
  const photo = await prisma.appointmentPhoto.findFirst({
    where: { id: req.params.photoId, appointmentId: req.params.id },
    include: { appointment: { select: { businessId: true } } },
  });
  if (!photo || photo.appointment.businessId !== req.user!.businessId) {
    return res.status(404).json({ error: 'Foto no encontrada' });
  }
  await prisma.appointmentPhoto.delete({ where: { id: req.params.photoId } });
  res.json({ success: true });
});

router.put('/booking-requests/:id', async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const existing = await prisma.bookingRequest.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'Solicitud no encontrada' });
  const updated = await prisma.bookingRequest.update({
    where: { id: req.params.id },
    data: { status },
  });
  res.json(updated);
});

// POST /api/appointments/send-reminders?date=YYYY-MM-DD — send email reminders for a date
router.post('/send-reminders', async (req: AuthRequest, res: Response) => {
  const bId  = req.user!.businessId;
  const dateStr = req.body.date ?? (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
  })();

  const d    = new Date(dateStr);
  const next = new Date(d); next.setDate(next.getDate() + 1);

  const appts = await prisma.appointment.findMany({
    where: {
      businessId: bId,
      date: { gte: d, lt: next },
      status: { in: ['SCHEDULED', 'CONFIRMED'] },
    },
    include: {
      client: { select: { name: true, email: true } },
      business: { select: { name: true, whatsapp: true } },
      services: { include: { service: { select: { name: true } } } },
    },
  });

  let sent = 0;
  const skipped: string[] = [];

  for (const appt of appts) {
    if (!appt.client.email) { skipped.push(appt.client.name); continue; }
    const email = appointmentReminderEmail({
      clientName: appt.client.name,
      salonName: appt.business.name,
      date: dateStr,
      startTime: appt.startTime,
      services: appt.services.map(s => s.service.name),
      whatsapp: appt.business.whatsapp,
    });
    sendEmail({ to: appt.client.email, ...email });
    sent++;
  }

  res.json({ sent, skipped: skipped.length, total: appts.length });
});

export default router;

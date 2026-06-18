import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendEmail, bookingRequestReceivedEmail } from '../lib/mailer';

const router = Router();

// Helper: resolve business by slug, businessId, or fallback to first
async function resolveBiz(slug?: string, businessId?: string) {
  if (slug) return prisma.business.findUnique({ where: { slug } });
  if (businessId) return prisma.business.findUnique({ where: { id: businessId } });
  return prisma.business.findFirst();
}

const parseDesign = (d: any) => ({
  ...d,
  tags: (() => { try { return JSON.parse(d.tags || '[]'); } catch { return []; } })(),
});

// GET /api/public/professionals — list active professionals for booking
router.get('/professionals', async (req: Request, res: Response) => {
  const biz = await resolveBiz(req.query.slug as string, req.query.businessId as string);
  if (!biz) return res.json([]);
  const users = await prisma.user.findMany({
    where: { businessId: biz.id },
    select: { id: true, name: true, avatar: true, workDays: true, weeklySchedule: true },
    orderBy: { name: 'asc' },
  });
  res.json(users.map(u => ({
    id: u.id, name: u.name, avatar: u.avatar ?? null,
    workDays: (() => { try { return JSON.parse(u.workDays || '[1,2,3,4,5,6]'); } catch { return [1,2,3,4,5,6]; } })(),
    weeklySchedule: u.weeklySchedule ?? '',
  })));
});

// GET /api/public/packages — list active packages with their services
router.get('/packages', async (req: Request, res: Response) => {
  const biz = await resolveBiz(req.query.slug as string, req.query.businessId as string);
  if (!biz) return res.json([]);
  const packages = await prisma.servicePackage.findMany({
    where: { isActive: true, businessId: biz.id },
    include: {
      services: {
        include: { service: { select: { id: true, name: true, price: true, duration: true, category: true } } },
      },
    },
    orderBy: { name: 'asc' },
  });
  res.json(packages);
});

// GET /api/public/services — list active services
router.get('/services', async (req: Request, res: Response) => {
  const biz = await resolveBiz(req.query.slug as string, req.query.businessId as string);
  const services = await prisma.service.findMany({
    where: { isActive: true, ...(biz ? { businessId: biz.id } : {}) },
    select: { id: true, name: true, category: true, price: true, duration: true, description: true, image: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  res.json(services);
});

// GET /api/public/proposal/:token — fetch appointment proposal for client
router.get('/proposal/:token', async (req: Request, res: Response) => {
  const appt = await prisma.appointment.findUnique({
    where: { shareToken: req.params.token },
    include: {
      client: { select: { name: true } },
      professional: { select: { name: true, avatar: true } },
      business: { select: { name: true, city: true, whatsapp: true } },
    },
  });
  if (!appt) return res.status(404).json({ error: 'Propuesta no encontrada o expirada' });

  let designIds: string[] = [];
  try { designIds = JSON.parse(appt.proposedDesigns); } catch {}

  const designs = designIds.length > 0
    ? await prisma.nailDesign.findMany({ where: { id: { in: designIds }, isActive: true } })
    : [];

  res.json({
    token: appt.shareToken,
    clientName: appt.client.name,
    date: appt.date,
    startTime: appt.startTime,
    endTime: appt.endTime,
    stylistName: appt.professional.name,
    stylistAvatar: appt.professional.avatar,
    salonName: appt.business.name,
    salonCity: appt.business.city,
    whatsapp: appt.business.whatsapp,
    approvedDesignId: appt.approvedDesignId,
    designs: designs.map(parseDesign),
  });
});

// PUT /api/public/proposal/:token/approve — client approves a design
router.put('/proposal/:token/approve', async (req: Request, res: Response) => {
  const { designId } = req.body;
  if (!designId) return res.status(400).json({ error: 'designId requerido' });

  const appt = await prisma.appointment.findUnique({ where: { shareToken: req.params.token } });
  if (!appt) return res.status(404).json({ error: 'Propuesta no encontrada' });

  let designIds: string[] = [];
  try { designIds = JSON.parse(appt.proposedDesigns); } catch {}

  if (!designIds.includes(designId)) {
    return res.status(400).json({ error: 'Diseño no válido para esta propuesta' });
  }

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { approvedDesignId: designId },
  });

  res.json({ success: true, designId });
});

// GET /api/public/availability?date=YYYY-MM-DD&professionalId= — booked slots + time-blocks for a date
router.get('/availability', async (req: Request, res: Response) => {
  const { date, slug, businessId, professionalId } = req.query;
  if (!date) return res.status(400).json({ error: 'date requerida' });

  const biz = await resolveBiz(slug as string, businessId as string);
  if (!biz) return res.json({ booked: [], blocked: [], isFullDayBlocked: false });

  const d = new Date(String(date));
  const next = new Date(d);
  next.setDate(next.getDate() + 1);

  const appts = await prisma.appointment.findMany({
    where: {
      businessId: biz.id,
      date: { gte: d, lt: next },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
      ...(professionalId ? { professionalId: String(professionalId) } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  const timeBlocks = professionalId
    ? await prisma.timeBlock.findMany({
        where: {
          businessId: biz.id,
          userId: String(professionalId),
          date: { gte: d, lt: next },
        },
        select: { startTime: true, endTime: true, isFullDay: true },
      })
    : [];

  const isFullDayBlocked = timeBlocks.some(b => b.isFullDay);

  // Staff schedule for the given day (overrides business hours if set)
  let staffDaySched: { open: string; close: string; closed: boolean } | null = null;
  if (professionalId) {
    const prof = await prisma.user.findUnique({
      where: { id: String(professionalId) },
      select: { weeklySchedule: true },
    });
    if (prof?.weeklySchedule) {
      try {
        const sched = JSON.parse(prof.weeklySchedule);
        const dow = d.getDay();
        if (sched[dow]) staffDaySched = sched[dow];
      } catch { /* ignore */ }
    }
  }

  res.json({
    booked: appts.map(a => ({ start: a.startTime, end: a.endTime })),
    blocked: timeBlocks.map(b => ({ start: b.startTime, end: b.endTime, isFullDay: b.isFullDay })),
    isFullDayBlocked,
    staffDaySched,
  });
});

// GET /api/public/business — business info for kiosk + booking config
router.get('/business', async (req: Request, res: Response) => {
  const biz = await resolveBiz(req.query.slug as string, req.query.businessId as string);
  if (!biz) return res.status(404).json({ error: 'Sin negocio' });
  res.json({
    id: biz.id, slug: biz.slug, name: biz.name, city: biz.city,
    phone: biz.phone, whatsapp: biz.whatsapp,
    openTime: biz.openTime, closeTime: biz.closeTime,
    slotDuration: biz.slotDuration, closedDays: biz.closedDays,
    weeklySchedule: biz.weeklySchedule ?? '',
    loyaltyCopPerPoint: biz.loyaltyCopPerPoint,
    loyaltyPointValue: biz.loyaltyPointValue,
  });
});

// GET /api/public/history?token=TOKEN — client's appointment history via their share token
router.get('/history', async (req: Request, res: Response) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'token requerido' });

  const appt = await prisma.appointment.findUnique({
    where: { shareToken: String(token) },
    include: { client: { select: { phone: true } } },
  });
  if (!appt) return res.status(404).json({ error: 'Token inválido' });

  const appointments = await prisma.appointment.findMany({
    where: { clientId: appt.clientId },
    include: {
      services: { include: { service: { select: { id: true, name: true, price: true } } } },
      payment: { select: { amount: true, method: true } },
    },
    orderBy: { date: 'desc' },
    take: 20,
  });

  const bookingRequests = await prisma.bookingRequest.findMany({
    where: { businessId: appt.businessId, clientPhone: appt.client.phone },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, date: true, timeSlot: true, status: true, createdAt: true, notes: true },
  });

  const clientData = await prisma.client.findUnique({ where: { id: appt.clientId }, select: { points: true } });

  const rawPkgs = await prisma.clientPackage.findMany({
    where: {
      clientId: appt.clientId,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: { package: { select: { name: true, description: true } } },
    orderBy: { purchasedAt: 'desc' },
  }).catch(() => []);

  const activePackages = rawPkgs
    .filter(p => p.sessionsUsed < p.sessionsTotal)
    .map(p => ({
      id: p.id,
      packageName: p.package.name,
      description: p.package.description ?? null,
      sessionsTotal: p.sessionsTotal,
      sessionsUsed: p.sessionsUsed,
      sessionsLeft: p.sessionsTotal - p.sessionsUsed,
      expiresAt: p.expiresAt?.toISOString() ?? null,
    }));

  res.json({ appointments, bookingRequests, points: clientData?.points ?? 0, activePackages });
});

// POST /api/public/book — create a booking request (unauthenticated)
router.post('/book', async (req: Request, res: Response) => {
  const { clientName, clientPhone, clientEmail, date, timeSlot, serviceId, serviceIds, notes, businessId, slug, professionalId } = req.body;
  if (!clientName || !clientPhone || !date || !timeSlot) {
    return res.status(400).json({ error: 'Nombre, teléfono, fecha y hora son requeridos' });
  }

  const biz = await resolveBiz(slug, businessId);
  if (!biz) return res.status(500).json({ error: 'No hay negocios disponibles' });
  const bId = biz.id;

  // Normalize service IDs: use serviceIds array if provided, else fall back to single serviceId
  const allIds: string[] = Array.isArray(serviceIds) && serviceIds.length > 0
    ? serviceIds
    : (serviceId ? [serviceId] : []);

  const booking = await prisma.bookingRequest.create({
    data: {
      clientName,
      clientPhone,
      clientEmail: clientEmail || null,
      date,
      timeSlot,
      notes: [
        professionalId ? `[profesional:${professionalId}]` : null,
        notes || null,
      ].filter(Boolean).join(' ') || null,
      serviceId: allIds[0] || null,
      serviceIds: JSON.stringify(allIds),
      businessId: bId,
    },
  });

  if (clientEmail) {
    const bizName = (await prisma.business.findUnique({ where: { id: bId }, select: { name: true } }))?.name ?? 'El salón';
    const email = bookingRequestReceivedEmail({ clientName, salonName: bizName, date, timeSlot });
    sendEmail({ to: clientEmail, ...email });
  }

  res.status(201).json(booking);
});

// POST /api/public/identify — find client by phone and return their latest shareToken
router.post('/identify', async (req: Request, res: Response) => {
  const { phone, slug, businessId } = req.body;
  if (!phone) return res.status(400).json({ error: 'Teléfono requerido' });

  const normalized = String(phone).replace(/\D/g, '');

  const biz = await resolveBiz(slug, businessId);
  if (!biz) return res.status(404).json({ error: 'Sin negocio' });

  const client = await prisma.client.findFirst({
    where: { businessId: biz.id, phone: { contains: normalized.slice(-7) } },
    select: { id: true, name: true },
  });
  if (!client) return res.status(404).json({ error: 'No encontramos citas con ese número' });

  const appt = await prisma.appointment.findFirst({
    where: { clientId: client.id, shareToken: { not: null } },
    orderBy: { date: 'desc' },
    select: { shareToken: true },
  });
  if (!appt?.shareToken) return res.status(404).json({ error: 'No hay citas registradas para ese número' });

  res.json({ shareToken: appt.shareToken, clientName: client.name });
});

// PUT /api/public/booking-requests/:id/cancel — client cancels own pending request
router.put('/booking-requests/:id/cancel', async (req: Request, res: Response) => {
  const booking = await prisma.bookingRequest.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: 'Solicitud no encontrada' });
  if (booking.status !== 'PENDING') return res.status(400).json({ error: 'La solicitud ya no está pendiente' });

  await prisma.bookingRequest.update({ where: { id: req.params.id }, data: { status: 'REJECTED' } });
  res.json({ success: true });
});

// PUT /api/public/appointments/:token/cancel — client cancels appointment via share token
router.put('/appointments/:token/cancel', async (req: Request, res: Response) => {
  const appt = await prisma.appointment.findUnique({ where: { shareToken: req.params.token } });
  if (!appt) return res.status(404).json({ error: 'Cita no encontrada' });
  if (!['SCHEDULED', 'CONFIRMED'].includes(appt.status)) {
    return res.status(400).json({ error: 'La cita no se puede cancelar en su estado actual' });
  }

  await prisma.appointment.update({ where: { id: appt.id }, data: { status: 'CANCELLED' } });
  res.json({ success: true });
});

// POST /api/public/appointments/:id/rate — client rates a completed appointment
router.post('/appointments/:id/rate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { token, rating, reviewNote } = req.body;
  if (!token || !rating) return res.status(400).json({ error: 'token y rating son requeridos' });
  const r = Number(rating);
  if (!Number.isInteger(r) || r < 1 || r > 5) return res.status(400).json({ error: 'rating debe ser 1–5' });

  // Verify token belongs to the same client
  const tokenAppt = await prisma.appointment.findUnique({ where: { shareToken: String(token) } });
  if (!tokenAppt) return res.status(403).json({ error: 'Token inválido' });

  const appt = await prisma.appointment.findUnique({ where: { id }, select: { id: true, clientId: true, status: true } });
  if (!appt) return res.status(404).json({ error: 'Cita no encontrada' });
  if (appt.clientId !== tokenAppt.clientId) return res.status(403).json({ error: 'No autorizado' });
  if (appt.status !== 'COMPLETED') return res.status(400).json({ error: 'Solo se pueden calificar citas completadas' });

  await prisma.appointment.update({ where: { id }, data: { rating: r, reviewNote: reviewNote?.trim() || null } });
  res.json({ success: true });
});

export default router;

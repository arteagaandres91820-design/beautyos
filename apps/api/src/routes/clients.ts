import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload, resolveImageUrl } from '../lib/upload';
import { sendEmail } from '../lib/mailer';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { search } = req.query;
  const clients = await prisma.client.findMany({
    where: {
      businessId: req.user!.businessId,
      ...(search
        ? {
            OR: [
              { name: { contains: String(search) } },
              { phone: { contains: String(search) } },
              { email: { contains: String(search) } },
            ],
          }
        : {}),
    },
    include: {
      _count: { select: {
        appointments: { where: { status: 'NO_SHOW' } },
        referrals: true,
      } },
      referredBy: { select: { id: true, name: true } },
    },
    orderBy: [{ isVip: 'desc' }, { visitCount: 'desc' }, { name: 'asc' }],
  });
  res.json(clients.map(c => ({ ...c, tags: JSON.parse(c.tags), noShowCount: c._count.appointments })));
});

// GET /api/clients/at-risk?days=30 — clients with no visit in the last N days
router.get('/at-risk', async (req: AuthRequest, res: Response) => {
  const days = Math.min(180, Math.max(14, Number(req.query.days) || 30));
  const bId = req.user!.businessId;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const rows = await prisma.$queryRaw<{ id: string; name: string; phone: string; isVip: number; lastVisit: string }[]>`
    SELECT c.id, c.name, c.phone, c.isVip,
           MAX(a.date) as lastVisit
    FROM Client c
    JOIN Appointment a ON a.clientId = c.id AND a.businessId = ${bId}
    WHERE c.businessId = ${bId}
      AND a.status = 'COMPLETED'
    GROUP BY c.id
    HAVING lastVisit < ${cutoff}
    ORDER BY lastVisit ASC
    LIMIT 8
  `;

  const safeStr = (v: unknown) => (typeof v === 'bigint' ? String(v) : v as string);
  res.json(rows.map(r => {
    const lv = r.lastVisit;
    const lvMs = typeof lv === 'bigint' ? Number(lv) : new Date(lv as string).getTime();
    return {
      id: safeStr(r.id),
      name: safeStr(r.name),
      phone: safeStr(r.phone),
      isVip: Boolean(r.isVip),
      lastVisit: safeStr(r.lastVisit),
      daysSince: Math.floor((Date.now() - lvMs) / 86400000),
    };
  }));
});

// GET /api/clients/export — full client list with lifetime spend for CSV download
router.get('/export', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const rows = await prisma.$queryRaw<{
    id: string; name: string; phone: string; email: string; birthday: string;
    tags: string; isVip: number; visitCount: number; points: number;
    noShowCount: number; createdAt: string; totalSpent: number;
  }[]>`
    SELECT c.id, c.name, COALESCE(c.phone, '') as phone, COALESCE(c.email, '') as email,
           COALESCE(c.birthday, '') as birthday, c.tags, c.isVip,
           c.visitCount, c.points, c.createdAt,
           COALESCE(SUM(p.amount + p.tipAmount), 0) as totalSpent,
           (SELECT COUNT(*) FROM Appointment ns WHERE ns.clientId = c.id AND ns.status = 'NO_SHOW' AND ns.businessId = ${bId}) as noShowCount
    FROM Client c
    LEFT JOIN Appointment a ON a.clientId = c.id AND a.businessId = ${bId} AND a.status = 'COMPLETED'
    LEFT JOIN Payment p ON p.appointmentId = a.id
    WHERE c.businessId = ${bId}
    GROUP BY c.id
    ORDER BY totalSpent DESC
  `;
  res.json(rows.map(r => ({
    ...r,
    isVip: Boolean(r.isVip),
    visitCount: Number(r.visitCount),
    points: Number(r.points),
    noShowCount: Number(r.noShowCount),
    totalSpent: Number(r.totalSpent),
    tags: JSON.parse(r.tags || '[]'),
  })));
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
    include: {
      appointments: {
        include: { services: { include: { service: true } }, payment: true, photos: true },
        orderBy: { date: 'desc' },
        take: 50,
      },
      referredBy: { select: { id: true, name: true } },
      referrals: { select: { id: true, name: true, createdAt: true } },
    },
  });
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  res.json({ ...client, tags: JSON.parse(client.tags) });
});

// POST /api/clients/import — bulk create clients from CSV rows
router.post('/import', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const { rows } = req.body as { rows: { name: string; phone: string; email?: string; birthday?: string; notes?: string; tags?: string }[] };
  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ error: 'Se requiere un arreglo de filas' });
  if (rows.length > 500)
    return res.status(400).json({ error: 'Máximo 500 clientes por importación' });

  // Fetch existing phones in this business to detect duplicates
  const existing = await prisma.client.findMany({
    where: { businessId: bId },
    select: { phone: true },
  });
  const existingPhones = new Set(existing.map(c => c.phone.replace(/\D/g, '')));

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    if (!row.name?.trim() || !row.phone?.trim()) { skipped++; continue; }
    const phone = row.phone.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    if (existingPhones.has(phoneDigits)) { skipped++; continue; }

    try {
      await prisma.client.create({
        data: {
          name: row.name.trim(),
          phone,
          email: row.email?.trim() || null,
          birthday: row.birthday ? new Date(row.birthday) : null,
          notes: row.notes?.trim() || null,
          tags: row.tags ? JSON.stringify(row.tags.split(',').map((t: string) => t.trim()).filter(Boolean)) : '[]',
          businessId: bId,
        },
      });
      existingPhones.add(phoneDigits);
      created++;
    } catch (e) {
      errors.push(row.name);
      skipped++;
    }
  }

  res.json({ created, skipped, errors });
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, email, phone, birthday, photo, notes, tags, referredById } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Nombre y teléfono requeridos' });

  const client = await prisma.client.create({
    data: {
      name, email, phone,
      birthday: birthday ? new Date(birthday) : null,
      photo, notes,
      tags: Array.isArray(tags) ? JSON.stringify(tags) : '[]',
      businessId: req.user!.businessId,
      ...(referredById ? { referredById } : {}),
    },
  });
  res.status(201).json({ ...client, tags: JSON.parse(client.tags) });
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });

  const { name, email, phone, birthday, photo, notes, isVip, tags, referredById } = req.body;
  const client = await prisma.client.update({
    where: { id: req.params.id },
    data: {
      name, email, phone,
      birthday: birthday ? new Date(birthday) : undefined,
      photo, notes, isVip,
      ...(Array.isArray(tags) ? { tags: JSON.stringify(tags) } : {}),
      ...(referredById !== undefined ? { referredById: referredById || null } : {}),
    },
  });
  res.json({ ...client, tags: JSON.parse(client.tags) });
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });
  await prisma.client.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

router.post('/:id/photo', upload.single('photo'), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });
  if (!req.file) return res.status(400).json({ error: 'Foto requerida' });
  const photo = await resolveImageUrl(req.file.path);
  const client = await prisma.client.update({ where: { id: req.params.id }, data: { photo } });
  res.json({ ...client, tags: JSON.parse(client.tags) });
});

// POST /api/clients/:id/points — adjust points balance (admin)
router.post('/:id/points', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.client.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });
  const { delta } = req.body;
  if (typeof delta !== 'number') return res.status(400).json({ error: 'Delta numérico requerido' });
  const newPoints = Math.max(0, (existing.points ?? 0) + delta);
  const client = await prisma.client.update({ where: { id: req.params.id }, data: { points: newPoints } });
  res.json({ ...client, tags: JSON.parse(client.tags) });
});

// GET /api/clients/birthdays?days=30 — clients with birthdays in the next N days
router.get('/birthdays', async (req: AuthRequest, res: Response) => {
  const days = Math.min(60, Math.max(1, Number(req.query.days) || 14));
  const bId = req.user!.businessId;

  const clients = await prisma.client.findMany({
    where: { businessId: bId, birthday: { not: null } },
    select: { id: true, name: true, phone: true, photo: true, isVip: true, visitCount: true, birthday: true },
  });

  const today = new Date();
  const todayMD = today.getMonth() * 100 + today.getDate();

  const upcoming = clients
    .map(c => {
      const bday = new Date(c.birthday!);
      const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
      const daysUntil = Math.round((thisYear.getTime() - today.getTime()) / 86400000);
      return { ...c, daysUntil };
    })
    .filter(c => c.daysUntil <= days && c.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  res.json(upcoming);
});

// POST /api/clients/bulk-email — send a marketing email to a list of clients
router.post('/bulk-email', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const { clientIds, subject, body } = req.body;
  if (!Array.isArray(clientIds) || !clientIds.length || !subject?.trim() || !body?.trim()) {
    return res.status(400).json({ error: 'clientIds, subject y body son requeridos' });
  }

  const biz = await prisma.business.findUnique({ where: { id: bId }, select: { name: true } });
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds as string[] }, businessId: bId, email: { not: null } },
    select: { id: true, name: true, email: true },
  });

  let sent = 0;
  for (const client of clients) {
    if (!client.email) continue;
    const firstName = client.name.split(' ')[0];
    const personalized = body
      .replace(/\{nombre\}/gi, firstName)
      .replace(/\{name\}/gi, firstName);
    await sendEmail({
      to: client.email,
      subject: subject.trim(),
      html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fafa;font-family:'DM Sans',Arial,sans-serif">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(13,91,99,0.08)">
    <div style="background:linear-gradient(135deg,#2DC7B3,#0D5C63);padding:28px 32px 20px;text-align:center">
      <p style="margin:0 0 6px;font-size:28px">💅</p>
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700">${biz?.name ?? 'BeautyOS'}</h1>
    </div>
    <div style="padding:28px 32px">
      ${personalized.split('\n').map((p: string) => p.trim() ? `<p style="color:#374151;font-size:15px;margin:0 0 14px;line-height:1.6">${p}</p>` : '<br>').join('')}
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:28px;border-top:1px solid #f3f4f6;padding-top:16px">
        Enviado por ${biz?.name ?? 'BeautyOS'} · Si no deseas recibir este tipo de mensajes, ignora este correo.
      </p>
    </div>
  </div>
</body></html>`,
    });
    sent++;
  }

  res.json({ sent, skipped: clientIds.length - sent, total: clientIds.length });
});

router.get('/:id/stats', async (req: AuthRequest, res: Response) => {
  const [total, spent] = await Promise.all([
    prisma.appointment.count({ where: { clientId: req.params.id, status: 'COMPLETED' } }),
    prisma.payment.aggregate({ where: { appointment: { clientId: req.params.id } }, _sum: { amount: true } }),
  ]);
  res.json({ totalVisits: total, totalSpent: spent._sum.amount ?? 0 });
});

export default router;

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Public: add to waitlist (from booking portal)
router.post('/public', async (req: Request, res: Response) => {
  const { businessId, clientName, clientPhone, date, timeSlot, notes } = req.body;
  if (!businessId || !clientName || !clientPhone || !date) {
    return res.status(400).json({ error: 'Datos incompletos' });
  }
  const biz = await prisma.business.findUnique({ where: { id: businessId } });
  if (!biz) return res.status(404).json({ error: 'Negocio no encontrado' });

  const entry = await prisma.waitlist.create({
    data: { businessId, clientName, clientPhone, date, timeSlot: timeSlot ?? null, notes: notes ?? null },
  });
  res.status(201).json(entry);
});

// Public: add by slug
router.post('/public/slug/:slug', async (req: Request, res: Response) => {
  const biz = await prisma.business.findUnique({ where: { slug: req.params.slug } });
  if (!biz) return res.status(404).json({ error: 'Negocio no encontrado' });
  const { clientName, clientPhone, date, timeSlot, notes } = req.body;
  if (!clientName || !clientPhone || !date) {
    return res.status(400).json({ error: 'Nombre, teléfono y fecha requeridos' });
  }
  const entry = await prisma.waitlist.create({
    data: { businessId: biz.id, clientName, clientPhone, date, timeSlot: timeSlot ?? null, notes: notes ?? null },
  });
  res.status(201).json(entry);
});

// All routes below require auth
router.use(authMiddleware);

// GET /api/waitlist?date=YYYY-MM-DD — list for a date (or all pending)
router.get('/', async (req: AuthRequest, res: Response) => {
  const { date, status } = req.query;
  const entries = await prisma.waitlist.findMany({
    where: {
      businessId: req.user!.businessId,
      ...(date ? { date: String(date) } : {}),
      ...(status ? { status: String(status) } : { status: { not: 'CANCELLED' } }),
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(entries);
});

// GET /api/waitlist/counts?from=YYYY-MM-DD&to=YYYY-MM-DD — per-day counts
router.get('/counts', async (req: AuthRequest, res: Response) => {
  const { from, to } = req.query;
  const entries = await prisma.waitlist.findMany({
    where: {
      businessId: req.user!.businessId,
      status: 'WAITING',
      ...(from || to ? { date: { ...(from ? { gte: String(from) } : {}), ...(to ? { lte: String(to) } : {}) } } : {}),
    },
    select: { date: true },
  });
  const counts: Record<string, number> = {};
  for (const e of entries) {
    counts[e.date] = (counts[e.date] ?? 0) + 1;
  }
  res.json(counts);
});

// PATCH /api/waitlist/:id — update status
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.waitlist.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'No encontrado' });
  const { status } = req.body;
  const entry = await prisma.waitlist.update({
    where: { id: req.params.id },
    data: { ...(status ? { status } : {}) },
  });
  res.json(entry);
});

// DELETE /api/waitlist/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.waitlist.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'No encontrado' });
  await prisma.waitlist.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;

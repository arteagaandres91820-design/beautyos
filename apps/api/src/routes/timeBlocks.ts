import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router = Router();

// GET /api/time-blocks?date=YYYY-MM-DD&week=YYYY-MM-DD&staffId=
router.get('/', async (req: Request, res: Response) => {
  const { date, week, staffId } = req.query;
  const bizId = (req as any).businessId;

  let dateFilter: object;
  if (week) {
    const start = new Date(String(week));
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    dateFilter = { gte: start, lt: end };
  } else if (date) {
    const d = new Date(String(date));
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    dateFilter = { gte: d, lt: next };
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    dateFilter = { gte: today, lt: end };
  }

  const blocks = await prisma.timeBlock.findMany({
    where: {
      businessId: bizId,
      date: dateFilter,
      ...(staffId ? { userId: String(staffId) } : {}),
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  res.json(blocks);
});

// POST /api/time-blocks
router.post('/', async (req: Request, res: Response) => {
  const { staffId, date, startTime, endTime, reason, isFullDay } = req.body;
  const bizId = (req as any).businessId;

  if (!staffId || !date) {
    return res.status(400).json({ error: 'staffId y date son requeridos' });
  }

  const staff = await prisma.user.findFirst({ where: { id: staffId, businessId: bizId } });
  if (!staff) return res.status(404).json({ error: 'Profesional no encontrado' });

  const fullDay = isFullDay === true || isFullDay === 'true';
  const block = await prisma.timeBlock.create({
    data: {
      date: new Date(date),
      startTime: fullDay ? '00:00' : (startTime || '09:00'),
      endTime: fullDay ? '23:59' : (endTime || '18:00'),
      reason: reason || null,
      isFullDay: fullDay,
      userId: staffId,
      businessId: bizId,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  res.status(201).json(block);
});

// PUT /api/time-blocks/:id
router.put('/:id', async (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const block = await prisma.timeBlock.findFirst({ where: { id: req.params.id, businessId: bizId } });
  if (!block) return res.status(404).json({ error: 'Bloqueo no encontrado' });

  const { startTime, endTime, reason, isFullDay } = req.body;
  const fullDay = isFullDay === true || isFullDay === 'true';

  const updated = await prisma.timeBlock.update({
    where: { id: req.params.id },
    data: {
      startTime: fullDay ? '00:00' : (startTime ?? block.startTime),
      endTime: fullDay ? '23:59' : (endTime ?? block.endTime),
      reason: reason !== undefined ? reason || null : block.reason,
      isFullDay: fullDay,
    },
    include: { user: { select: { id: true, name: true, avatar: true } } },
  });

  res.json(updated);
});

// DELETE /api/time-blocks/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const bizId = (req as any).businessId;
  const block = await prisma.timeBlock.findFirst({ where: { id: req.params.id, businessId: bizId } });
  if (!block) return res.status(404).json({ error: 'Bloqueo no encontrado' });

  await prisma.timeBlock.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;

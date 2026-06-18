import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/commissions/summary?from=&to= — earned commissions per staff for period
router.get('/summary', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const { from, to } = req.query;
  const start = from ? new Date(String(from)) : new Date(Date.now() - 30 * 86400000);
  const end   = to   ? new Date(String(to))   : new Date();

  const rows = await prisma.$queryRaw<{
    userId: string; name: string; avatar: string | null; commissionPct: number;
    monthlyGoal: number; appts: number; revenue: number;
  }[]>`
    SELECT u.id as userId, u.name, u.avatar, u.commissionPct, u.monthlyGoal,
           COUNT(a.id) as appts,
           COALESCE(SUM(p.amount), 0) as revenue
    FROM User u
    LEFT JOIN Appointment a ON a.professionalId = u.id
      AND a.businessId = ${bId}
      AND a.status = 'COMPLETED'
      AND a.date >= ${start.toISOString()}
      AND a.date <= ${end.toISOString()}
    LEFT JOIN Payment p ON p.appointmentId = a.id
    WHERE u.businessId = ${bId}
    GROUP BY u.id
    ORDER BY revenue DESC
  `;

  // Sum already-paid commissions for this period per user
  const payments = await prisma.commissionPayment.findMany({
    where: { businessId: bId, periodFrom: { gte: start }, periodTo: { lte: end } },
    select: { userId: true, amount: true },
  });
  const paidByUser: Record<string, number> = {};
  payments.forEach(p => { paidByUser[p.userId] = (paidByUser[p.userId] ?? 0) + p.amount; });

  res.json(rows.map(r => {
    const revenue = Number(r.revenue);
    const earned  = Math.round(revenue * (Number(r.commissionPct) / 100));
    const paid    = paidByUser[r.userId] ?? 0;
    return {
      userId: r.userId,
      name: r.name,
      avatar: r.avatar,
      commissionPct: Number(r.commissionPct),
      monthlyGoal: Number(r.monthlyGoal ?? 0),
      appts: Number(r.appts),
      revenue,
      earned,
      paid,
      pending: Math.max(0, earned - paid),
    };
  }));
});

// GET /api/commissions/payments?userId= — payment history for a staff member
router.get('/payments', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const { userId } = req.query;
  const payments = await prisma.commissionPayment.findMany({
    where: { businessId: bId, ...(userId ? { userId: String(userId) } : {}) },
    include: { user: { select: { name: true, avatar: true } } },
    orderBy: { paidAt: 'desc' },
    take: 50,
  });
  res.json(payments);
});

// POST /api/commissions/payments — record a payment
router.post('/payments', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const { userId, amount, notes, periodFrom, periodTo } = req.body;
  if (!userId || !amount || !periodFrom || !periodTo)
    return res.status(400).json({ error: 'userId, amount, periodFrom, periodTo son requeridos' });

  const staff = await prisma.user.findFirst({ where: { id: userId, businessId: bId } });
  if (!staff) return res.status(404).json({ error: 'Miembro no encontrado' });

  const payment = await prisma.commissionPayment.create({
    data: {
      amount: Number(amount),
      notes,
      periodFrom: new Date(periodFrom),
      periodTo: new Date(periodTo),
      userId,
      businessId: bId,
    },
    include: { user: { select: { name: true, avatar: true } } },
  });
  res.status(201).json(payment);
});

// DELETE /api/commissions/payments/:id — undo a payment
router.delete('/payments/:id', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const existing = await prisma.commissionPayment.findFirst({
    where: { id: req.params.id, businessId: bId },
  });
  if (!existing) return res.status(404).json({ error: 'Pago no encontrado' });
  await prisma.commissionPayment.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/summary', async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  const d = date ? new Date(String(date)) : new Date();
  const start = new Date(d.setHours(0, 0, 0, 0));
  const end = new Date(d.setHours(23, 59, 59, 999));

  const [payments, totalAgg, byMethod, tipAgg] = await Promise.all([
    prisma.payment.findMany({
      where: { businessId: req.user!.businessId, createdAt: { gte: start, lte: end } },
      include: { appointment: { include: { client: { select: { name: true } }, services: { include: { service: { select: { name: true } } } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.aggregate({
      where: { businessId: req.user!.businessId, createdAt: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.groupBy({
      by: ['method'],
      where: { businessId: req.user!.businessId, createdAt: { gte: start, lte: end } },
      _sum: { amount: true, tipAmount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { businessId: req.user!.businessId, createdAt: { gte: start, lte: end } },
      _sum: { tipAmount: true },
    }),
  ]);

  res.json({
    payments,
    total: totalAgg._sum.amount ?? 0,
    totalTips: tipAgg._sum.tipAmount ?? 0,
    count: totalAgg._count,
    byMethod,
  });
});

router.get('/monthly', async (req: AuthRequest, res: Response) => {
  const { year, month } = req.query;
  const y = year ? Number(year) : new Date().getFullYear();
  const m = month ? Number(month) : new Date().getMonth() + 1;
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59);

  const agg = await prisma.payment.aggregate({
    where: { businessId: req.user!.businessId, createdAt: { gte: start, lte: end } },
    _sum: { amount: true },
    _count: true,
  });
  res.json({ total: agg._sum.amount ?? 0, count: agg._count });
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { appointmentId, amount, method, notes, pointsRedeemed, tipAmount } = req.body;
  if (!appointmentId || !amount || !method) {
    return res.status(400).json({ error: 'Cita, monto y método son requeridos' });
  }
  const existing = await prisma.payment.findUnique({ where: { appointmentId } });
  if (existing) return res.status(409).json({ error: 'Esta cita ya tiene un pago registrado' });

  const [apptRec, business] = await Promise.all([
    prisma.appointment.findFirst({
      where: { id: appointmentId, businessId: req.user!.businessId },
      select: { clientId: true, status: true },
    }),
    prisma.business.findUnique({
      where: { id: req.user!.businessId },
      select: { loyaltyCopPerPoint: true, loyaltyPointValue: true },
    }),
  ]);
  if (!apptRec) return res.status(404).json({ error: 'Cita no encontrada' });
  const alreadyCompleted = apptRec.status === 'COMPLETED';

  const copPerPoint = Math.max(1, business?.loyaltyCopPerPoint ?? 1000);

  const pts = Math.max(0, Math.floor(Number(pointsRedeemed) || 0));

  if (pts > 0) {
    const client = await prisma.client.findUnique({ where: { id: apptRec.clientId }, select: { points: true } });
    if (!client || client.points < pts) {
      return res.status(400).json({ error: 'Puntos insuficientes' });
    }
  }

  const finalAmount = Math.max(0, Number(amount));
  const finalTip    = Math.max(0, Number(tipAmount) || 0);
  const pointsEarned = Math.floor(finalAmount / copPerPoint);
  const pointsDelta = pointsEarned - pts;

  // Only deduct inventory if the appointment wasn't already marked COMPLETED via the status dropdown
  // (which has its own deduction logic in appointments.ts)
  const serviceProducts = alreadyCompleted ? [] : await prisma.serviceProduct.findMany({
    where: {
      serviceId: { in: (await prisma.appointmentService.findMany({ where: { appointmentId } })).map(s => s.serviceId) },
    },
  });

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: { appointmentId, amount: finalAmount, tipAmount: finalTip, method, notes, businessId: req.user!.businessId },
    }),
    prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'COMPLETED' } }),
    ...(pointsDelta !== 0
      ? [prisma.client.update({ where: { id: apptRec.clientId }, data: { points: { increment: pointsDelta } } })]
      : []),
    ...serviceProducts.map(sp =>
      prisma.product.update({
        where: { id: sp.productId },
        data: { stock: { decrement: sp.quantity } },
      })
    ),
    ...serviceProducts.map(sp =>
      prisma.stockMovement.create({
        data: {
          productId: sp.productId,
          type: 'OUT',
          quantity: sp.quantity,
          notes: `Auto: cita ${appointmentId.slice(-8)}`,
          userId: req.user!.id,
        },
      })
    ),
  ]);

  res.status(201).json({ payment, pointsEarned, pointsRedeemed: pts });
});

export default router;

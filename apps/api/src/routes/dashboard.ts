import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/stats', async (req: AuthRequest, res: Response) => {
  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0));
  const end = new Date(today.setHours(23, 59, 59, 999));
  const bId = req.user!.businessId;

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const prevMonthStart = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  const prevMonthEnd = new Date(monthStart.getTime() - 1);

  const todayMM   = String(new Date().getMonth() + 1).padStart(2, '0');
  const todayDD   = String(new Date().getDate()).padStart(2, '0');
  const next30End = new Date(Date.now() + 30 * 86400000);

  const [
    todayAppointments,
    todayRevenue,
    totalClients,
    vipClients,
    monthRevenue,
    prevMonthRevenue,
    activeClientsMonth,
    upcomingAppointments,
    pendingBookingRequests,
    pendingProposals,
    lowStockCount,
    birthdayClients,
    projectedRevenue,
    overdueCount,
  ] = await Promise.all([
    prisma.appointment.count({ where: { businessId: bId, date: { gte: start, lte: end } } }),
    prisma.payment.aggregate({ where: { businessId: bId, createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.client.count({ where: { businessId: bId } }),
    prisma.client.count({ where: { businessId: bId, isVip: true } }),
    prisma.payment.aggregate({ where: { businessId: bId, createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { businessId: bId, createdAt: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { amount: true } }),
    prisma.appointment.groupBy({ by: ['clientId'], where: { businessId: bId, date: { gte: monthStart }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } } }).then(r => r.length),
    prisma.appointment.findMany({
      where: { businessId: bId, date: { gte: new Date() }, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
      include: {
        client: { select: { name: true, photo: true, isVip: true } },
        services: { include: { service: { select: { name: true } } } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 5,
    }),
    prisma.bookingRequest.count({ where: { businessId: bId, status: 'PENDING' } }),
    prisma.appointment.count({
      where: {
        businessId: bId,
        NOT: { proposedDesigns: '[]' },
        approvedDesignId: null,
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] },
      },
    }),
    prisma.$queryRaw<{ cnt: number }[]>`
      SELECT COUNT(*) as cnt FROM Product WHERE businessId = ${bId} AND isActive = 1 AND stock <= minStock
    `.then(r => Number(r[0]?.cnt ?? 0)).catch(() => 0),
    // Today's birthdays
    prisma.client.findMany({
      where: { businessId: bId, birthday: { not: null } },
      select: { id: true, name: true, phone: true, birthday: true, isVip: true },
    }).then(clients => clients.filter(c => {
      if (!c.birthday) return false;
      const d = new Date(c.birthday);
      return String(d.getMonth() + 1).padStart(2, '0') === todayMM &&
             String(d.getDate()).padStart(2, '0') === todayDD;
    })),
    // Projected revenue: sum totalPrice of future scheduled/confirmed appointments (next 30 days)
    prisma.appointment.aggregate({
      where: { businessId: bId, date: { gte: end, lte: next30End }, status: { in: ['SCHEDULED', 'CONFIRMED'] } },
      _sum: { totalPrice: true },
    }).then(r => r._sum.totalPrice ?? 0),
    // Overdue count: past appointments still pending (no payment, no resolution)
    prisma.$queryRaw<{ cnt: number }[]>`
      SELECT COUNT(*) as cnt FROM Appointment
      WHERE businessId = ${bId}
        AND status IN ('SCHEDULED','CONFIRMED')
        AND date < ${start.toISOString()}
    `.then(r => Number(r[0]?.cnt ?? 0)).catch(() => 0),
  ]);

  // At-risk clients: no completed visit in 45 days (top 6)
  const cutoff45 = new Date(Date.now() - 45 * 86400000).toISOString();
  const atRiskClients = await prisma.$queryRaw<{ id: string; name: string; phone: string; isVip: number; lastVisit: string }[]>`
    SELECT c.id, c.name, c.phone, c.isVip, MAX(a.date) as lastVisit
    FROM Client c
    JOIN Appointment a ON a.clientId = c.id AND a.businessId = ${bId}
    WHERE c.businessId = ${bId} AND a.status = 'COMPLETED'
    GROUP BY c.id
    HAVING lastVisit < ${cutoff45}
    ORDER BY lastVisit ASC
    LIMIT 6
  `.then(rows => rows.map(r => ({
    id: r.id, name: r.name, phone: r.phone,
    isVip: Boolean(r.isVip),
    daysSince: Math.floor((Date.now() - (typeof r.lastVisit === 'bigint' ? Number(r.lastVisit) : new Date(r.lastVisit as string).getTime())) / 86400000),
  }))).catch(() => []);

  // Expiring packages: active client packages expiring in next 30 days with remaining sessions
  const expiryWindow = new Date(Date.now() + 30 * 86400000).toISOString();
  const expiringPackages = await prisma.clientPackage.findMany({
    where: {
      businessId: bId,
      expiresAt: { gte: new Date(), lte: new Date(expiryWindow) },
    },
    include: {
      client: { select: { id: true, name: true, phone: true } },
      package: { select: { name: true } },
    },
    orderBy: { expiresAt: 'asc' },
    take: 6,
  }).then(pkgs => pkgs
    .filter(p => p.sessionsUsed < p.sessionsTotal)
    .map(p => ({
      id: p.id,
      clientId: p.clientId,
      clientName: p.client.name,
      clientPhone: p.client.phone,
      packageName: p.package.name,
      sessionsLeft: p.sessionsTotal - p.sessionsUsed,
      expiresAt: p.expiresAt?.toISOString() ?? null,
    }))
  ).catch(() => []);

  const prevRev = prevMonthRevenue._sum.amount ?? 0;
  const currRev = monthRevenue._sum.amount ?? 0;
  const revenueGrowth = prevRev === 0 ? null : Math.round(((currRev - prevRev) / prevRev) * 100);

  res.json({
    todayAppointments,
    todayRevenue: todayRevenue._sum.amount ?? 0,
    totalClients,
    vipClients,
    monthRevenue: currRev,
    prevMonthRevenue: prevRev,
    revenueGrowth,
    activeClientsMonth,
    upcomingAppointments,
    pendingBookingRequests,
    pendingProposals,
    lowStockCount,
    birthdayClients,
    projectedRevenue,
    overdueCount,
    atRiskClients,
    expiringPackages,
  });
});

export default router;

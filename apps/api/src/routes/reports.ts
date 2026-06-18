import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/reports/overview?days=30
router.get('/overview', async (req: AuthRequest, res: Response) => {
  const days   = Math.min(365, Math.max(7, Number(req.query.days) || 30));
  const bId    = req.user!.businessId;
  const since  = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Revenue by day — raw query for grouping by date
  const revenueRows = await prisma.$queryRaw<{ day: string; amount: number }[]>`
    SELECT strftime('%Y-%m-%d', createdAt) as day, SUM(amount) as amount
    FROM Payment
    WHERE businessId = ${bId} AND createdAt >= ${since.toISOString()}
    GROUP BY strftime('%Y-%m-%d', createdAt)
    ORDER BY day ASC
  `;

  // Top services by booking count
  const topServices = await prisma.$queryRaw<{ name: string; count: number; revenue: number }[]>`
    SELECT s.name, COUNT(aps.serviceId) as count, SUM(aps.price) as revenue
    FROM AppointmentService aps
    JOIN Service s ON s.id = aps.serviceId
    JOIN Appointment a ON a.id = aps.appointmentId
    WHERE a.businessId = ${bId} AND a.status = 'COMPLETED'
    GROUP BY aps.serviceId
    ORDER BY count DESC
    LIMIT 6
  `;

  // Top clients by spend
  const topClients = await prisma.$queryRaw<{ name: string; visits: number; spent: number }[]>`
    SELECT c.name, c.visitCount as visits, COALESCE(SUM(p.amount), 0) as spent
    FROM Client c
    LEFT JOIN Appointment a ON a.clientId = c.id AND a.businessId = ${bId}
    LEFT JOIN Payment p ON p.appointmentId = a.id
    WHERE c.businessId = ${bId}
    GROUP BY c.id
    ORDER BY spent DESC
    LIMIT 6
  `;

  // Appointments by status (all time)
  const byStatus = await prisma.appointment.groupBy({
    by: ['status'],
    where: { businessId: bId },
    _count: true,
  });

  // Staff performance (with commissionPct and avg satisfaction rating)
  const staffPerf = await prisma.$queryRaw<{ name: string; appts: number; revenue: number; commissionPct: number; avgRating: number | null }[]>`
    SELECT u.name, u.commissionPct, COUNT(a.id) as appts,
           COALESCE(SUM(p.amount), 0) as revenue,
           AVG(CASE WHEN a.rating IS NOT NULL THEN a.rating ELSE NULL END) as avgRating
    FROM User u
    LEFT JOIN Appointment a ON a.professionalId = u.id AND a.businessId = ${bId} AND a.status = 'COMPLETED' AND a.date >= ${since.toISOString()}
    LEFT JOIN Payment p ON p.appointmentId = a.id
    WHERE u.businessId = ${bId}
    GROUP BY u.id
    ORDER BY revenue DESC
  `;

  // Heatmap: appointments by day-of-week + hour
  const heatmapRows = await prisma.$queryRaw<{ dow: string; hour: number; count: number }[]>`
    SELECT strftime('%w', date) as dow,
           CAST(substr(startTime, 1, 2) AS INTEGER) as hour,
           COUNT(*) as count
    FROM Appointment
    WHERE businessId = ${bId} AND status = 'COMPLETED' AND date >= ${since.toISOString()}
    GROUP BY dow, hour
    ORDER BY dow, hour
  `;

  // Expenses by day
  const expByDay = await prisma.$queryRaw<{ day: string; amount: number }[]>`
    SELECT strftime('%Y-%m-%d', date) as day, SUM(amount) as amount
    FROM Expense
    WHERE businessId = ${bId} AND date >= ${since.toISOString()}
    GROUP BY strftime('%Y-%m-%d', date)
    ORDER BY day ASC
  `;

  // Expenses by category
  const expCatRows = await prisma.$queryRaw<{ category: string; amount: number }[]>`
    SELECT category, SUM(amount) as amount
    FROM Expense
    WHERE businessId = ${bId} AND date >= ${since.toISOString()}
    GROUP BY category
    ORDER BY amount DESC
  `;

  // Package sales
  const packageSales = await prisma.$queryRaw<{ name: string; count: number; revenue: number }[]>`
    SELECT sp.name, COUNT(a.id) as count, COALESCE(SUM(p.amount), 0) as revenue
    FROM ServicePackage sp
    JOIN Appointment a ON a.businessId = ${bId} AND a.status = 'COMPLETED' AND a.date >= ${since.toISOString()}
    JOIN Payment p ON p.appointmentId = a.id
    JOIN AppointmentService aps ON aps.appointmentId = a.id
    JOIN PackageService ps ON ps.serviceId = aps.serviceId AND ps.packageId = sp.id
    WHERE sp.businessId = ${bId}
    GROUP BY sp.id
    ORDER BY count DESC
    LIMIT 5
  `;

  // Payment method breakdown
  const paymentMethods = await prisma.$queryRaw<{ method: string; count: number; amount: number }[]>`
    SELECT method, COUNT(*) as count, SUM(amount) as amount
    FROM Payment
    WHERE businessId = ${bId} AND createdAt >= ${since.toISOString()}
    GROUP BY method
    ORDER BY amount DESC
  `;

  // Totals for the period
  const [periodRevenue, periodAppointments, periodExpenses, completedCount, noShowCount] = await Promise.all([
    prisma.payment.aggregate({
      where: { businessId: bId, createdAt: { gte: since } },
      _sum: { amount: true },
    }),
    prisma.appointment.count({
      where: { businessId: bId, date: { gte: since } },
    }),
    prisma.expense.aggregate({
      where: { businessId: bId, date: { gte: since } },
      _sum: { amount: true },
    }),
    prisma.appointment.count({
      where: { businessId: bId, date: { gte: since }, status: 'COMPLETED' },
    }),
    prisma.appointment.count({
      where: { businessId: bId, date: { gte: since }, status: 'NO_SHOW' },
    }),
  ]);

  const rev = periodRevenue._sum.amount ?? 0;
  const avgTicket = completedCount > 0 ? Math.round(rev / completedCount) : 0;
  const scheduledOrCompleted = completedCount + noShowCount;
  const noShowRate = scheduledOrCompleted > 0 ? Math.round((noShowCount / scheduledOrCompleted) * 100) : 0;

  res.json({
    days,
    periodRevenue: rev,
    periodAppointments,
    revenueByDay: revenueRows.map(r => ({ day: r.day, amount: Number(r.amount) })),
    expensesByDay: expByDay.map(e => ({ day: e.day, amount: Number(e.amount) })),
    topServices: topServices.map(s => ({ name: s.name, count: Number(s.count), revenue: Number(s.revenue) })),
    topClients: topClients.map(c => ({ name: c.name, visits: Number(c.visits), spent: Number(c.spent) })),
    byStatus: byStatus.map(b => ({ status: b.status, count: b._count })),
    staffPerformance: staffPerf.map(s => ({
      name: s.name,
      appts: Number(s.appts),
      revenue: Number(s.revenue),
      commissionPct: Number(s.commissionPct ?? 0),
      commission: Number(s.revenue) * (Number(s.commissionPct ?? 0) / 100),
      avgRating: s.avgRating != null ? Math.round(Number(s.avgRating) * 10) / 10 : null,
    })),
    heatmap: heatmapRows.map(r => ({ dow: Number(r.dow), hour: Number(r.hour), count: Number(r.count) })),
    periodExpenses: periodExpenses._sum.amount ?? 0,
    periodProfit: rev - (periodExpenses._sum.amount ?? 0),
    expensesByCategory: expCatRows.map(e => ({ category: e.category, amount: Number(e.amount) })),
    avgTicket,
    noShowRate,
    packageSales: packageSales.map(p => ({ name: p.name, count: Number(p.count), revenue: Number(p.revenue) })),
    paymentMethods: paymentMethods.map(m => ({ method: m.method, count: Number(m.count), amount: Number(m.amount) })),
  });
});

// GET /api/reports/reviews?limit=20 — recent client reviews with rating >= 1
router.get('/reviews', async (req: AuthRequest, res: Response) => {
  const bId   = req.user!.businessId;
  const limit = Math.min(50, Math.max(5, Number(req.query.limit) || 20));

  const reviews = await prisma.appointment.findMany({
    where: { businessId: bId, rating: { gte: 1 } },
    include: {
      client: { select: { name: true, phone: true } },
      professional: { select: { name: true } },
      services: { include: { service: { select: { name: true } } }, take: 2 },
    },
    orderBy: [{ date: 'desc' }, { updatedAt: 'desc' }],
    take: limit,
  });

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length) * 10) / 10
    : null;

  const dist = [1, 2, 3, 4, 5].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }));

  res.json({
    avgRating,
    total: reviews.length,
    dist,
    reviews: reviews.map(r => ({
      id: r.id,
      date: typeof r.date === 'string' ? r.date : (r.date as Date).toISOString().slice(0, 10),
      clientName: r.client.name,
      staffName: r.professional.name,
      services: r.services.map(s => s.service.name),
      rating: r.rating!,
      reviewNote: r.reviewNote ?? null,
    })),
  });
});

export default router;

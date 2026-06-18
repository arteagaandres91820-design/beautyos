import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { date, month, year } = req.query;
  const bId = req.user!.businessId;

  let dateFilter: object = {};
  if (date) {
    const d = new Date(String(date));
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    dateFilter = { date: { gte: d, lt: next } };
  } else if (month && year) {
    const start = new Date(Number(year), Number(month) - 1, 1);
    const end = new Date(Number(year), Number(month), 1);
    dateFilter = { date: { gte: start, lt: end } };
  }

  const expenses = await prisma.expense.findMany({
    where: { businessId: bId, ...dateFilter },
    orderBy: { date: 'desc' },
  });
  res.json(expenses);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { amount, category, description, date } = req.body;
  if (!amount || !description) return res.status(400).json({ error: 'Monto y descripción son requeridos' });

  const expense = await prisma.expense.create({
    data: {
      amount: Number(amount),
      category: category || 'SUPPLIES',
      description,
      date: date ? new Date(date) : new Date(),
      businessId: req.user!.businessId,
    },
  });
  res.status(201).json(expense);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.expense.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Gasto no encontrado' });

  const { amount, category, description, date } = req.body;
  const updated = await prisma.expense.update({
    where: { id: req.params.id },
    data: {
      ...(amount !== undefined ? { amount: Number(amount) } : {}),
      ...(category ? { category } : {}),
      ...(description ? { description } : {}),
      ...(date ? { date: new Date(date) } : {}),
    },
  });
  res.json(updated);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.expense.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Gasto no encontrado' });
  await prisma.expense.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const fmt = (p: any) => ({
  ...p,
  stock: Number(p.stock),
  minStock: Number(p.minStock),
  costPrice: Number(p.costPrice),
  isLow: Number(p.minStock) > 0 && Number(p.stock) <= Number(p.minStock),
});

// GET /api/inventory
router.get('/', async (req: AuthRequest, res: Response) => {
  const { category, lowStock } = req.query;
  const products = await prisma.product.findMany({
    where: {
      businessId: req.user!.businessId,
      isActive: true,
      ...(category ? { category: String(category) } : {}),
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: { movements: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });

  const mapped = products.map(fmt);
  res.json(lowStock === '1' ? mapped.filter(p => p.isLow) : mapped);
});

// POST /api/inventory
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, brand, category, unit, stock, minStock, costPrice, notes } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });

  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      brand: brand?.trim() || null,
      category: category || 'OTHER',
      unit: unit || 'un',
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      costPrice: Number(costPrice) || 0,
      notes: notes?.trim() || null,
      businessId: req.user!.businessId,
    },
    include: { movements: true },
  });

  if ((Number(stock) || 0) > 0) {
    await prisma.stockMovement.create({
      data: { productId: product.id, type: 'IN', quantity: Number(stock) || 0, notes: 'Stock inicial', userId: req.user!.id },
    });
  }

  res.status(201).json(fmt(product));
});

// PUT /api/inventory/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const { name, brand, category, unit, minStock, costPrice, notes, isActive } = req.body;
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      brand: brand !== undefined ? (brand?.trim() || null) : undefined,
      ...(category ? { category } : {}),
      ...(unit ? { unit } : {}),
      ...(minStock !== undefined ? { minStock: Number(minStock) || 0 } : {}),
      ...(costPrice !== undefined ? { costPrice: Number(costPrice) || 0 } : {}),
      notes: notes !== undefined ? (notes?.trim() || null) : undefined,
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    },
    include: { movements: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });
  res.json(fmt(product));
});

// DELETE /api/inventory/:id — soft delete
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ success: true });
});

// POST /api/inventory/:id/movement — log stock in/out/adjust
router.post('/:id/movement', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.product.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'Producto no encontrado' });

  const { type, quantity, notes } = req.body;
  if (!['IN', 'OUT', 'ADJUST'].includes(type)) return res.status(400).json({ error: 'Tipo inválido: IN | OUT | ADJUST' });
  const qty = Number(quantity);
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Cantidad debe ser > 0' });

  let newStock = Number(existing.stock);
  if (type === 'IN') newStock += qty;
  else if (type === 'OUT') newStock = Math.max(0, newStock - qty);
  else newStock = qty; // ADJUST: set absolute

  await prisma.$transaction([
    prisma.stockMovement.create({
      data: { productId: existing.id, type, quantity: qty, notes: notes?.trim() || null, userId: req.user!.id },
    }),
    prisma.product.update({ where: { id: existing.id }, data: { stock: newStock } }),
  ]);

  const updated = await prisma.product.findUnique({
    where: { id: existing.id },
    include: { movements: { orderBy: { createdAt: 'desc' }, take: 5 } },
  });
  res.json(fmt(updated));
});

export default router;

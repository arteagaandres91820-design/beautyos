import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/promo-codes — list all for business
router.get('/', async (req: AuthRequest, res: Response) => {
  const codes = await prisma.promoCode.findMany({
    where: { businessId: req.user!.businessId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(codes);
});

// POST /api/promo-codes/lookup — validate a code and return discount amount
router.post('/lookup', async (req: AuthRequest, res: Response) => {
  const { code, total } = req.body;
  if (!code || !total) return res.status(400).json({ error: 'Código y total requeridos' });

  const promo = await prisma.promoCode.findFirst({
    where: { businessId: req.user!.businessId, code: String(code).toUpperCase(), isActive: true },
  });
  if (!promo) return res.status(404).json({ error: 'Código no encontrado o inactivo' });
  if (promo.expiresAt && promo.expiresAt < new Date()) return res.status(400).json({ error: 'Código expirado' });
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses) return res.status(400).json({ error: 'Código agotado' });

  const discount = promo.type === 'PERCENT'
    ? Math.round((Number(total) * promo.value) / 100)
    : Math.min(promo.value, Number(total));

  res.json({ id: promo.id, code: promo.code, description: promo.description, type: promo.type, value: promo.value, discount });
});

// POST /api/promo-codes/apply — mark a code as used (called after successful payment)
router.post('/apply', async (req: AuthRequest, res: Response) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID requerido' });

  const promo = await prisma.promoCode.findFirst({
    where: { id, businessId: req.user!.businessId },
  });
  if (!promo) return res.status(404).json({ error: 'Código no encontrado' });

  await prisma.promoCode.update({ where: { id }, data: { usedCount: { increment: 1 } } });
  res.json({ ok: true });
});

// POST /api/promo-codes — create
router.post('/', async (req: AuthRequest, res: Response) => {
  const { code, description, type, value, maxUses, expiresAt } = req.body;
  if (!code || !type || value == null) return res.status(400).json({ error: 'Código, tipo y valor son requeridos' });
  if (!['PERCENT', 'FIXED'].includes(type)) return res.status(400).json({ error: 'Tipo debe ser PERCENT o FIXED' });
  if (type === 'PERCENT' && (value <= 0 || value > 100)) return res.status(400).json({ error: 'Porcentaje debe ser entre 1 y 100' });

  const promo = await prisma.promoCode.create({
    data: {
      code: String(code).toUpperCase().trim(),
      description: description || null,
      type,
      value: Number(value),
      maxUses: maxUses ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      businessId: req.user!.businessId,
    },
  });
  res.status(201).json(promo);
});

// PUT /api/promo-codes/:id — update (toggle active, change limits, etc.)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.promoCode.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Código no encontrado' });

  const { isActive, maxUses, expiresAt } = req.body;
  const promo = await prisma.promoCode.update({
    where: { id: req.params.id },
    data: {
      ...(isActive !== undefined ? { isActive } : {}),
      ...(maxUses !== undefined ? { maxUses: maxUses ? Number(maxUses) : null } : {}),
      ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
    },
  });
  res.json(promo);
});

// DELETE /api/promo-codes/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.promoCode.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Código no encontrado' });
  await prisma.promoCode.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;

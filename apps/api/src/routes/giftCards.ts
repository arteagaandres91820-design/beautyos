import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

function genCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const fmt = (g: any) => ({
  id: g.id,
  code: g.code,
  amount: Number(g.amount),
  balance: Number(g.balance),
  recipientName: g.recipientName,
  notes: g.notes,
  isActive: g.isActive,
  createdAt: g.createdAt,
  updatedAt: g.updatedAt,
  usedAt: g.usedAt,
});

// GET /api/gift-cards?showInactive=1
router.get('/', async (req: AuthRequest, res: Response) => {
  const showInactive = req.query.showInactive === '1';
  const cards = await prisma.giftCard.findMany({
    where: {
      businessId: req.user!.businessId,
      ...(showInactive ? {} : { isActive: true }),
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(cards.map(fmt));
});

// GET /api/gift-cards/lookup?code=XXXX-XXXX-XXXX (public-ish, still requires auth for admin)
router.get('/lookup', async (req: AuthRequest, res: Response) => {
  const code = String(req.query.code ?? '').toUpperCase().trim();
  if (!code) return res.status(400).json({ error: 'Código requerido' });
  const card = await prisma.giftCard.findFirst({
    where: { code, businessId: req.user!.businessId },
  });
  if (!card) return res.status(404).json({ error: 'Tarjeta no encontrada' });
  res.json(fmt(card));
});

// POST /api/gift-cards — create a new gift card
router.post('/', async (req: AuthRequest, res: Response) => {
  const { amount, recipientName, notes } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Monto inválido' });

  let code = genCode();
  let tries = 0;
  while (tries < 5) {
    const exists = await prisma.giftCard.findUnique({ where: { code } });
    if (!exists) break;
    code = genCode();
    tries++;
  }

  const card = await prisma.giftCard.create({
    data: {
      code,
      amount: Number(amount),
      balance: Number(amount),
      recipientName: recipientName?.trim() || null,
      notes: notes?.trim() || null,
      businessId: req.user!.businessId,
    },
  });
  res.status(201).json(fmt(card));
});

// PUT /api/gift-cards/:id — edit metadata or deactivate
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.giftCard.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'No encontrada' });

  const { recipientName, notes, isActive } = req.body;
  const card = await prisma.giftCard.update({
    where: { id: req.params.id },
    data: {
      ...(recipientName !== undefined ? { recipientName: recipientName?.trim() || null } : {}),
      ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    },
  });
  res.json(fmt(card));
});

// POST /api/gift-cards/:id/redeem — redeem an amount from a gift card
router.post('/:id/redeem', async (req: AuthRequest, res: Response) => {
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'Monto inválido' });

  const card = await prisma.giftCard.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!card) return res.status(404).json({ error: 'No encontrada' });
  if (!card.isActive) return res.status(400).json({ error: 'Tarjeta inactiva' });
  if (Number(card.balance) <= 0) return res.status(400).json({ error: 'Sin saldo disponible' });

  const redeem = Math.min(Number(amount), Number(card.balance));
  const newBalance = Number(card.balance) - redeem;

  const updated = await prisma.giftCard.update({
    where: { id: card.id },
    data: {
      balance: newBalance,
      usedAt: new Date(),
      ...(newBalance === 0 ? { isActive: false } : {}),
    },
  });
  res.json({ redeemed: redeem, remaining: newBalance, card: fmt(updated) });
});

// DELETE /api/gift-cards/:id — deactivate (soft)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.giftCard.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'No encontrada' });
  await prisma.giftCard.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ ok: true });
});

export default router;

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload, resolveImageUrl } from '../lib/upload';

const router = Router();

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

const formatBusiness = (b: { id: string; name: string; slug: string; city: string; whatsapp: string | null; openTime?: string; closeTime?: string; slotDuration?: number; closedDays?: string; weeklySchedule?: string; messageTemplates?: string; monthlyRevenueGoal?: number; expenseBudgets?: string; loyaltyCopPerPoint?: number | null; loyaltyPointValue?: number | null }) => ({
  id: b.id, name: b.name, slug: b.slug, city: b.city, whatsapp: b.whatsapp ?? undefined,
  openTime: b.openTime ?? '09:00',
  closeTime: b.closeTime ?? '18:00',
  slotDuration: b.slotDuration ?? 30,
  closedDays: b.closedDays ?? '[0]',
  weeklySchedule: b.weeklySchedule ?? '',
  messageTemplates: b.messageTemplates ?? '[]',
  monthlyRevenueGoal: b.monthlyRevenueGoal ?? 0,
  expenseBudgets: b.expenseBudgets ?? '{}',
  loyaltyCopPerPoint: b.loyaltyCopPerPoint ?? 1000,
  loyaltyPointValue: b.loyaltyPointValue ?? 100,
});

// POST /api/auth/register — create new business + admin account
router.post('/register', async (req: Request, res: Response) => {
  const { businessName, city, name, email, password } = req.body;
  if (!businessName?.trim() || !name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const exists = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (exists) return res.status(400).json({ error: 'Ya existe una cuenta con este correo' });

  const baseSlug = generateSlug(businessName.trim());
  // ensure uniqueness by appending random suffix if needed
  let slug = baseSlug;
  const existing = await prisma.business.findUnique({ where: { slug } });
  if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  const business = await prisma.business.create({
    data: { name: businessName.trim(), slug, city: city?.trim() ?? '', email: email.trim().toLowerCase() },
  });

  const hashed = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      password: hashed,
      name: name.trim(),
      role: 'ADMIN',
      businessId: business.id,
    },
    include: { business: true },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, businessId: user.businessId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      id: user.id, email: user.email, name: user.name,
      role: user.role, avatar: user.avatar,
      business: formatBusiness(user.business),
    },
  });
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  const user = await prisma.user.findUnique({ where: { email }, include: { business: true } });
  if (!user) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, businessId: user.businessId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id, email: user.email, name: user.name,
      role: user.role, avatar: user.avatar,
      business: formatBusiness(user.business),
    },
  });
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { business: true },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({
    id: user.id, email: user.email, name: user.name,
    role: user.role, avatar: user.avatar,
    business: formatBusiness(user.business),
  });
});

router.put('/business', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, city, whatsapp, openTime, closeTime, slotDuration, closedDays, slug, weeklySchedule, messageTemplates, monthlyRevenueGoal, expenseBudgets, loyaltyCopPerPoint, loyaltyPointValue } = req.body;

  // Validate slug uniqueness if being changed
  if (slug) {
    const cleaned = generateSlug(slug);
    const taken = await prisma.business.findFirst({
      where: { slug: cleaned, NOT: { id: req.user!.businessId } },
    });
    if (taken) return res.status(409).json({ error: 'Ese URL ya está en uso, elige otro' });
  }

  const business = await prisma.business.update({
    where: { id: req.user!.businessId },
    data: {
      ...(name ? { name } : {}),
      ...(slug ? { slug: generateSlug(slug) } : {}),
      ...(city ? { city } : {}),
      whatsapp: whatsapp !== undefined ? (whatsapp || null) : undefined,
      ...(openTime ? { openTime } : {}),
      ...(closeTime ? { closeTime } : {}),
      ...(slotDuration ? { slotDuration: Number(slotDuration) } : {}),
      ...(closedDays !== undefined ? { closedDays } : {}),
      ...(weeklySchedule !== undefined ? { weeklySchedule } : {}),
      ...(messageTemplates !== undefined ? { messageTemplates } : {}),
      ...(monthlyRevenueGoal !== undefined ? { monthlyRevenueGoal: Math.max(0, Number(monthlyRevenueGoal) || 0) } : {}),
      ...(expenseBudgets !== undefined ? { expenseBudgets: typeof expenseBudgets === 'string' ? expenseBudgets : JSON.stringify(expenseBudgets) } : {}),
      ...(loyaltyCopPerPoint !== undefined ? { loyaltyCopPerPoint: Math.max(1, Number(loyaltyCopPerPoint) || 1000) } : {}),
      ...(loyaltyPointValue !== undefined ? { loyaltyPointValue: Math.max(1, Number(loyaltyPointValue) || 100) } : {}),
    },
  });
  res.json(formatBusiness(business));
});

router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Nombre requerido' });
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { name: name.trim() },
    include: { business: true },
  });
  res.json({
    id: user.id, email: user.email, name: user.name,
    role: user.role, avatar: user.avatar,
    business: formatBusiness(user.business),
  });
});

router.post('/avatar', authMiddleware, upload.single('avatar'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });
  const avatarUrl = await resolveImageUrl(req.file.path);
  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data: { avatar: avatarUrl },
    include: { business: true },
  });
  res.json({
    id: user.id, email: user.email, name: user.name,
    role: user.role, avatar: user.avatar,
    business: formatBusiness(user.business),
  });
});

router.put('/password', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  const valid = await bcrypt.compare(String(currentPassword), user.password);
  if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

  const hashed = await bcrypt.hash(String(newPassword), 10);
  await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashed } });
  res.json({ success: true });
});

export default router;

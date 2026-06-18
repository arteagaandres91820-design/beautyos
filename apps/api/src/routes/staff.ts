import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const formatUser = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  phone: u.phone ?? undefined,
  avatar: u.avatar ?? undefined,
  workDays: (() => { try { return JSON.parse(u.workDays || '[1,2,3,4,5,6]'); } catch { return [1,2,3,4,5,6]; } })(),
  weeklySchedule: u.weeklySchedule ?? '',
  commissionPct: u.commissionPct ?? 0,
  monthlyGoal: u.monthlyGoal ?? 0,
  createdAt: u.createdAt,
  _count: u._count,
});

// GET /api/staff — list all team members
router.get('/', async (req: AuthRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { businessId: req.user!.businessId },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, avatar: true, workDays: true, weeklySchedule: true, commissionPct: true, monthlyGoal: true, createdAt: true,
      _count: { select: { appointments: true } },
    },
  });
  res.json(users.map(formatUser));
});

// POST /api/staff — add a new team member
router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, email, password, role, phone } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existing) return res.status(409).json({ error: 'Ya existe un usuario con ese correo' });

  const hashed = await bcrypt.hash(String(password), 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashed,
      role: role === 'ADMIN' ? 'ADMIN' : 'PROFESSIONAL',
      phone: phone?.trim() || null,
      businessId: req.user!.businessId,
    },
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, avatar: true, workDays: true, weeklySchedule: true, commissionPct: true, monthlyGoal: true, createdAt: true,
      _count: { select: { appointments: true } },
    },
  });
  res.status(201).json(formatUser(user));
});

// PUT /api/staff/:id — update team member
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { name, role, phone, workDays, weeklySchedule, commissionPct, monthlyGoal } = req.body;

  const target = await prisma.user.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

  // Prevent removing last admin
  if (target.role === 'ADMIN' && role === 'PROFESSIONAL') {
    const adminCount = await prisma.user.count({
      where: { businessId: req.user!.businessId, role: 'ADMIN' },
    });
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Debe haber al menos un administrador' });
    }
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      ...(name?.trim() ? { name: name.trim() } : {}),
      ...(role ? { role: role === 'ADMIN' ? 'ADMIN' : 'PROFESSIONAL' } : {}),
      phone: phone !== undefined ? (phone?.trim() || null) : undefined,
      ...(workDays !== undefined ? { workDays: JSON.stringify(Array.isArray(workDays) ? workDays : [1,2,3,4,5,6]) } : {}),
      ...(weeklySchedule !== undefined ? { weeklySchedule: typeof weeklySchedule === 'string' ? weeklySchedule : JSON.stringify(weeklySchedule) } : {}),
      ...(commissionPct !== undefined ? { commissionPct: Math.min(100, Math.max(0, Number(commissionPct) || 0)) } : {}),
      ...(monthlyGoal !== undefined ? { monthlyGoal: Math.max(0, Number(monthlyGoal) || 0) } : {}),
    },
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, avatar: true, workDays: true, weeklySchedule: true, commissionPct: true, monthlyGoal: true, createdAt: true,
      _count: { select: { appointments: true } },
    },
  });
  res.json(formatUser(user));
});

// GET /api/staff/commissions?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/commissions', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to   = req.query.to   ? new Date(String(req.query.to) + 'T23:59:59') : new Date();

  const staff = await prisma.user.findMany({
    where: { businessId: bId },
    select: { id: true, name: true, avatar: true, role: true, commissionPct: true },
    orderBy: { name: 'asc' },
  });

  const rows = await Promise.all(staff.map(async s => {
    const payments = await prisma.payment.findMany({
      where: {
        businessId: bId,
        appointment: {
          professionalId: s.id,
          status: 'COMPLETED',
          date: { gte: from, lte: to },
        },
      },
      select: { amount: true },
    });
    const revenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const commission = revenue * (s.commissionPct / 100);
    const apptCount = await prisma.appointment.count({
      where: {
        professionalId: s.id,
        businessId: bId,
        status: 'COMPLETED',
        date: { gte: from, lte: to },
      },
    });
    return { id: s.id, name: s.name, avatar: s.avatar, role: s.role, commissionPct: s.commissionPct, revenue, commission, apptCount };
  }));

  res.json(rows);
});

// DELETE /api/staff/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  }

  const target = await prisma.user.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

  const futureAppts = await prisma.appointment.count({
    where: {
      professionalId: req.params.id,
      date: { gte: new Date() },
      status: { notIn: ['CANCELLED', 'COMPLETED', 'NO_SHOW'] },
    },
  });
  if (futureAppts > 0) {
    return res.status(400).json({
      error: `Este profesional tiene ${futureAppts} cita(s) pendiente(s). Reasígnalas antes de eliminarlo.`,
    });
  }

  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;

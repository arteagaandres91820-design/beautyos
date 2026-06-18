import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/clients/:clientId/packages
router.get('/:clientId/packages', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const client = await prisma.client.findFirst({
    where: { id: req.params.clientId, businessId: bId },
  });
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

  const pkgs = await prisma.clientPackage.findMany({
    where: { clientId: req.params.clientId, businessId: bId },
    include: {
      package: {
        select: { id: true, name: true, description: true, price: true, image: true,
          services: { include: { service: { select: { name: true } } } } },
      },
    },
    orderBy: { purchasedAt: 'desc' },
  });
  res.json(pkgs);
});

// POST /api/clients/:clientId/packages — sell a package to a client
router.post('/:clientId/packages', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const { packageId, sessionsTotal, notes, expiresAt } = req.body;
  if (!packageId || !sessionsTotal)
    return res.status(400).json({ error: 'packageId y sessionsTotal son requeridos' });

  const [client, pkg] = await Promise.all([
    prisma.client.findFirst({ where: { id: req.params.clientId, businessId: bId } }),
    prisma.servicePackage.findFirst({ where: { id: packageId, businessId: bId } }),
  ]);
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
  if (!pkg) return res.status(404).json({ error: 'Paquete no encontrado' });

  const cp = await prisma.clientPackage.create({
    data: {
      clientId: req.params.clientId,
      packageId,
      sessionsTotal: Number(sessionsTotal),
      notes,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      businessId: bId,
    },
    include: {
      package: {
        select: { id: true, name: true, description: true, price: true, image: true,
          services: { include: { service: { select: { name: true } } } } },
      },
    },
  });
  res.status(201).json(cp);
});

// PATCH /api/clients/:clientId/packages/:pkgId/use — deduct one session
router.patch('/:clientId/packages/:pkgId/use', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const cp = await prisma.clientPackage.findFirst({
    where: { id: req.params.pkgId, clientId: req.params.clientId, businessId: bId },
  });
  if (!cp) return res.status(404).json({ error: 'Paquete no encontrado' });
  if (cp.sessionsUsed >= cp.sessionsTotal)
    return res.status(400).json({ error: 'No quedan sesiones disponibles' });

  const updated = await prisma.clientPackage.update({
    where: { id: cp.id },
    data: { sessionsUsed: cp.sessionsUsed + 1 },
    include: {
      package: { select: { id: true, name: true } },
    },
  });
  res.json(updated);
});

// PATCH /api/clients/:clientId/packages/:pkgId/undo — undo a session deduction
router.patch('/:clientId/packages/:pkgId/undo', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const cp = await prisma.clientPackage.findFirst({
    where: { id: req.params.pkgId, clientId: req.params.clientId, businessId: bId },
  });
  if (!cp) return res.status(404).json({ error: 'Paquete no encontrado' });
  if (cp.sessionsUsed <= 0) return res.status(400).json({ error: 'No hay sesiones para deshacer' });

  const updated = await prisma.clientPackage.update({
    where: { id: cp.id },
    data: { sessionsUsed: cp.sessionsUsed - 1 },
    include: { package: { select: { id: true, name: true } } },
  });
  res.json(updated);
});

// DELETE /api/clients/:clientId/packages/:pkgId
router.delete('/:clientId/packages/:pkgId', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const cp = await prisma.clientPackage.findFirst({
    where: { id: req.params.pkgId, clientId: req.params.clientId, businessId: bId },
  });
  if (!cp) return res.status(404).json({ error: 'Paquete no encontrado' });
  await prisma.clientPackage.delete({ where: { id: cp.id } });
  res.status(204).send();
});

export default router;

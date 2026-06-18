import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const include = {
  services: {
    include: { service: { select: { id: true, name: true, category: true, price: true, duration: true } } },
  },
};

router.get('/', async (req: AuthRequest, res: Response) => {
  const showInactive = req.query.showInactive === '1';
  const pkgs = await prisma.servicePackage.findMany({
    where: { businessId: req.user!.businessId, ...(showInactive ? {} : { isActive: true }) },
    include,
    orderBy: { name: 'asc' },
  });
  res.json(pkgs);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, description, price, duration, serviceIds, image } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Nombre y precio son requeridos' });

  const ids: string[] = Array.isArray(serviceIds) ? serviceIds : [];

  const pkg = await prisma.servicePackage.create({
    data: {
      name, description: description || null, price: Number(price),
      duration: Number(duration) || 60,
      image: image || null,
      businessId: req.user!.businessId,
      services: { create: ids.map(id => ({ serviceId: id })) },
    },
    include,
  });
  res.status(201).json(pkg);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.servicePackage.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'Paquete no encontrado' });

  const { name, description, price, duration, serviceIds, image, isActive } = req.body;
  const ids: string[] | undefined = Array.isArray(serviceIds) ? serviceIds : undefined;

  const pkg = await prisma.servicePackage.update({
    where: { id: req.params.id },
    data: {
      name: name ?? existing.name,
      description: description !== undefined ? description || null : existing.description,
      price: price !== undefined ? Number(price) : existing.price,
      duration: duration !== undefined ? Number(duration) : existing.duration,
      image: image !== undefined ? image || null : existing.image,
      isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      ...(ids !== undefined ? {
        services: {
          deleteMany: {},
          create: ids.map(id => ({ serviceId: id })),
        },
      } : {}),
    },
    include,
  });
  res.json(pkg);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.servicePackage.findFirst({
    where: { id: req.params.id, businessId: req.user!.businessId },
  });
  if (!existing) return res.status(404).json({ error: 'Paquete no encontrado' });
  await prisma.servicePackage.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;

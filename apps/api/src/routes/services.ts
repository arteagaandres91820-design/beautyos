import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload, resolveImageUrl } from '../lib/upload';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { category, showInactive } = req.query;
  const services = await prisma.service.findMany({
    where: {
      businessId: req.user!.businessId,
      ...(showInactive === '1' ? {} : { isActive: true }),
      ...(category ? { category: String(category) as any } : {}),
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: {
      serviceProducts: {
        include: { product: { select: { id: true, name: true, unit: true, stock: true } } },
      },
    },
  });
  res.json(services);
});

// GET /api/services/stats — per-service all-time booking count and revenue
router.get('/stats', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const rows = await prisma.$queryRaw<{ serviceId: string; count: number; revenue: number }[]>`
    SELECT aps.serviceId, COUNT(*) as count, COALESCE(SUM(aps.price), 0) as revenue
    FROM AppointmentService aps
    JOIN Appointment a ON a.id = aps.appointmentId
    WHERE a.businessId = ${bId}
      AND a.status = 'COMPLETED'
    GROUP BY aps.serviceId
  `;
  res.json(rows.map(r => ({ serviceId: r.serviceId, count: Number(r.count), revenue: Number(r.revenue) })));
});

// GET /api/services/:id/products — list linked inventory products
router.get('/:id/products', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });
  const links = await prisma.serviceProduct.findMany({
    where: { serviceId: req.params.id },
    include: { product: { select: { id: true, name: true, unit: true, stock: true, category: true } } },
  });
  res.json(links.map(l => ({ productId: l.productId, quantity: Number(l.quantity), product: l.product })));
});

// PUT /api/services/:id/products — replace the product list
router.put('/:id/products', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });

  const links: { productId: string; quantity: number }[] = req.body.products ?? [];

  await prisma.$transaction([
    prisma.serviceProduct.deleteMany({ where: { serviceId: req.params.id } }),
    ...links.map(l => prisma.serviceProduct.create({
      data: { serviceId: req.params.id, productId: l.productId, quantity: Number(l.quantity) || 1 },
    })),
  ]);

  res.json({ ok: true });
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, category, price, duration, description, image } = req.body;
  if (!name || !category || !price || !duration) {
    return res.status(400).json({ error: 'Nombre, categoría, precio y duración son requeridos' });
  }
  const service = await prisma.service.create({
    data: { name, category, price: Number(price), duration: Number(duration), description, image, businessId: req.user!.businessId },
  });
  res.status(201).json(service);
});

// PUT /api/services/:id/checklist — replace checklist steps
router.put('/:id/checklist', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });
  const steps: string[] = Array.isArray(req.body.steps) ? req.body.steps.map(String) : [];
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: { checklist: JSON.stringify(steps) },
  });
  res.json(service);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });
  const { name, category, price, duration, description, image, isActive } = req.body;
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: { name, category, price: price ? Number(price) : undefined, duration: duration ? Number(duration) : undefined, description, image, isActive },
  });
  res.json(service);
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });
  await prisma.service.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
});

router.post('/:id/image', upload.single('image'), async (req: AuthRequest, res: Response) => {
  const existing = await prisma.service.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Servicio no encontrado' });
  if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });
  const image = await resolveImageUrl(req.file.path);
  const service = await prisma.service.update({ where: { id: req.params.id }, data: { image } });
  res.json(service);
});

export default router;

import { Router, Response, Request } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload, resolveImageUrl } from '../lib/upload';

const router = Router();

const parseDesign = (d: any) => ({
  ...d,
  tags: (() => { try { return JSON.parse(d.tags || '[]'); } catch { return []; } })(),
});

// ── Rutas públicas (sin auth) ─────────────────────────────────────────

router.get('/public', async (req: Request, res: Response) => {
  const { category, search, limit } = req.query;
  const designs = await prisma.nailDesign.findMany({
    where: {
      isActive: true,
      ...(category ? { category: String(category) } : {}),
      ...(search ? { OR: [
        { name: { contains: String(search) } },
        { tags: { contains: String(search).toLowerCase() } },
      ]} : {}),
    },
    orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
    take: limit ? Number(limit) : 100,
  });
  res.json(designs.map(parseDesign));
});

router.get('/public/business/:id', async (req: Request, res: Response) => {
  const business = await prisma.business.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, city: true, phone: true, logo: true },
  });
  if (!business) return res.status(404).json({ error: 'Negocio no encontrado' });
  res.json(business);
});

router.get('/trending', async (_req: Request, res: Response) => {
  const designs = await prisma.nailDesign.findMany({
    where: { isActive: true },
    orderBy: { saveCount: 'desc' },
    take: 12,
  });
  res.json(designs.map(parseDesign));
});

// ── Rutas protegidas ──────────────────────────────────────────────────
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  const { category, search, mine } = req.query;
  const designs = await prisma.nailDesign.findMany({
    where: {
      isActive: true,
      ...(mine === 'true'
        ? { businessId: req.user!.businessId }
        : { OR: [{ businessId: req.user!.businessId }, { businessId: null }] }),
      ...(category ? { category: String(category) } : {}),
      ...(search ? { OR: [
        { name: { contains: String(search) } },
        { description: { contains: String(search) } },
        { tags: { contains: String(search).toLowerCase() } },
      ]} : {}),
    },
    orderBy: [{ saveCount: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(designs.map(parseDesign));
});

router.get('/stats', async (req: AuthRequest, res: Response) => {
  const [total, mine, totalSaves] = await Promise.all([
    prisma.nailDesign.count({ where: { isActive: true } }),
    prisma.nailDesign.count({ where: { businessId: req.user!.businessId, isActive: true } }),
    prisma.nailDesign.aggregate({ where: { businessId: req.user!.businessId }, _sum: { saveCount: true } }),
  ]);
  const byCategory = await prisma.nailDesign.groupBy({
    by: ['category'],
    where: { isActive: true, OR: [{ businessId: req.user!.businessId }, { businessId: null }] },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
  });
  res.json({ total, mine, totalSaves: totalSaves._sum.saveCount ?? 0, byCategory });
});

router.post('/upload', upload.single('image'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'Imagen requerida' });
  const { name, category, price, duration, description, tags } = req.body;
  if (!name || !category || !price || !duration) {
    return res.status(400).json({ error: 'Nombre, categoría, precio y duración son requeridos' });
  }
  try {
    const imageUrl = await resolveImageUrl(req.file.path);
    const rawTags = tags
      ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t: string) => t.trim().toLowerCase()))
      : [];
    const design = await prisma.nailDesign.create({
      data: {
        name, category, price: Number(price), duration: Number(duration),
        imageUrl, description: description || null,
        tags: JSON.stringify(rawTags),
        businessId: req.user!.businessId,
      },
    });
    res.status(201).json(parseDesign(design));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al procesar la imagen' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { name, category, price, duration, imageUrl, description, tags } = req.body;
  if (!name || !category || !price || !duration || !imageUrl) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  const rawTags = tags
    ? (Array.isArray(tags) ? tags : String(tags).split(',').map((t: string) => t.trim()))
    : [];
  const design = await prisma.nailDesign.create({
    data: {
      name, category, price: Number(price), duration: Number(duration),
      imageUrl, description,
      tags: JSON.stringify(rawTags),
      businessId: req.user!.businessId,
    },
  });
  res.status(201).json(parseDesign(design));
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.nailDesign.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Diseño no encontrado' });
  const { name, category, price, duration, description, tags, isActive } = req.body;
  const design = await prisma.nailDesign.update({
    where: { id: req.params.id },
    data: {
      name, category,
      price: price ? Number(price) : undefined,
      duration: duration ? Number(duration) : undefined,
      description, isActive,
      tags: tags !== undefined ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : undefined,
    },
  });
  res.json(parseDesign(design));
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const existing = await prisma.nailDesign.findFirst({ where: { id: req.params.id, businessId: req.user!.businessId } });
  if (!existing) return res.status(404).json({ error: 'Diseño no encontrado' });
  await prisma.nailDesign.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
});

router.post('/try-on', async (req: AuthRequest, res: Response) => {
  const { designId, handImageBase64 } = req.body;
  if (!designId || !handImageBase64) return res.status(400).json({ error: 'designId e imagen requeridos' });
  const design = await prisma.nailDesign.findUnique({ where: { id: designId } });
  if (!design) return res.status(404).json({ error: 'Diseño no encontrado' });

  if (!process.env.REPLICATE_API_TOKEN) {
    return res.json({ resultImageUrl: design.imageUrl, fallback: true, message: 'Modo demo — configura REPLICATE_API_TOKEN para IA real' });
  }
  try {
    const Replicate = (await import('replicate')).default;
    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
    const output = await replicate.run(
      'stability-ai/stable-diffusion-img2img:15a3689ee13b0d2616e98820eca31d4af4a36f5e',
      { input: { image: handImageBase64, prompt: `professional nail art salon, ${design.name}, ${design.category.toLowerCase()} nails, beautiful manicure, high quality`, prompt_strength: 0.5, num_inference_steps: 30, guidance_scale: 7.5 } }
    );
    res.json({ resultImageUrl: Array.isArray(output) ? output[0] : String(output), fallback: false });
  } catch (err) {
    console.error('Replicate error:', err);
    res.json({ resultImageUrl: design.imageUrl, fallback: true, message: 'IA no disponible, mostrando diseño de referencia' });
  }
});

export default router;

import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// GET /api/clients/:clientId/notes
router.get('/:clientId/notes', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const client = await prisma.client.findFirst({
    where: { id: req.params.clientId, businessId: bId },
  });
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

  const notes = await prisma.clientNote.findMany({
    where: { clientId: req.params.clientId, businessId: bId },
    include: { author: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notes);
});

// POST /api/clients/:clientId/notes
router.post('/:clientId/notes', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const { body, type } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'El cuerpo de la nota es requerido' });

  const client = await prisma.client.findFirst({
    where: { id: req.params.clientId, businessId: bId },
  });
  if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

  const note = await prisma.clientNote.create({
    data: {
      body: body.trim(),
      type: type ?? 'NOTE',
      clientId: req.params.clientId,
      authorId: req.user!.id,
      businessId: bId,
    },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  });
  res.status(201).json(note);
});

// DELETE /api/clients/:clientId/notes/:noteId
router.delete('/:clientId/notes/:noteId', async (req: AuthRequest, res: Response) => {
  const bId = req.user!.businessId;
  const note = await prisma.clientNote.findFirst({
    where: { id: req.params.noteId, clientId: req.params.clientId, businessId: bId },
  });
  if (!note) return res.status(404).json({ error: 'Nota no encontrada' });
  await prisma.clientNote.delete({ where: { id: req.params.noteId } });
  res.status(204).send();
});

export default router;

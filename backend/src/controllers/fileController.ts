import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { category, name } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    const newFile = await prisma.file.create({
      data: {
        name: name || req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        type: req.file.mimetype,
        category: category || 'general',
        agencyId: user.agencyId,
        uploaderId: user.userId
      },
      include: { uploader: { select: { firstName: true, lastName: true } } }
    });

    res.status(201).json(newFile);
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

export const getFiles = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { search, category } = req.query;
    const where: any = { agencyId: user.agencyId };

    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (category && category !== 'All') where.category = category;

    const files = await prisma.file.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { firstName: true, lastName: true } } }
    });

    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch files' });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    await prisma.file.delete({ where: { id, agencyId: user.agencyId } });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

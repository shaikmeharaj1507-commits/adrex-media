import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    if (!req.file) {
      console.error('File upload: No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const { category, name, folderId, tags } = req.body;
    const fileUrl = `/uploads/${req.file.filename}`;

    let parsedTags: string[] = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch (e) {
        parsedTags = tags.split(',').map((t: string) => t.trim());
      }
    }

    console.log('File upload success:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      category: category || 'general',
      folderId,
      tags: parsedTags,
      fileUrl,
      agencyId: user.agencyId,
      uploaderId: user.userId,
    });

    const newFile = await prisma.file.create({
      data: {
        name: name || req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        type: req.file.mimetype,
        category: category || 'general',
        folderId: folderId || null,
        tags: parsedTags,
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

    const { search, category, folderId, tag } = req.query;
    const where: any = { agencyId: user.agencyId };

    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (category && category !== 'All') where.category = category;
    if (folderId !== undefined) {
      where.folderId = folderId === 'root' ? null : folderId;
    }
    if (tag) where.tags = { has: tag };

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

    const file = await prisma.file.findUnique({ where: { id, agencyId: user.agencyId } });
    if (file) {
      const filePath = path.join(UPLOAD_DIR, path.basename(file.url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.file.delete({ where: { id, agencyId: user.agencyId } });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

export const renameFile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updated = await prisma.file.update({
      where: { id, agencyId: user.agencyId },
      data: { name: name.trim() },
      include: { uploader: { select: { firstName: true, lastName: true } } }
    });

    res.json(updated);
  } catch (error) {
    console.error('Rename file error:', error);
    res.status(500).json({ error: 'Failed to rename file' });
  }
};

export const moveFile = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const { folderId } = req.body;

    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, agencyId: user.agencyId }
      });
      if (!folder) {
        return res.status(404).json({ error: 'Target folder not found' });
      }
    }

    const updated = await prisma.file.update({
      where: { id, agencyId: user.agencyId },
      data: { folderId: folderId || null },
      include: { uploader: { select: { firstName: true, lastName: true } } }
    });

    res.json(updated);
  } catch (error) {
    console.error('Move file error:', error);
    res.status(500).json({ error: 'Failed to move file' });
  }
};

export const getFileStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const files = await prisma.file.findMany({
      where: { agencyId: user.agencyId },
      select: { size: true, category: true }
    });

    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    const countByCategory = files.reduce((acc: Record<string, number>, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1;
      return acc;
    }, {});

    res.json({
      totalSize,
      totalFiles: files.length,
      countByCategory,
      storageLimit: 104857600 // 100 MB
    });
  } catch (error) {
    console.error('File stats error:', error);
    res.status(500).json({ error: 'Failed to fetch file stats' });
  }
};

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

    console.log('File upload success:', {
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      category: category || 'general',
      fileUrl,
      agencyId: user.agencyId,
      uploaderId: user.userId,
      folderId: folderId || null,
      tags: tags || '',
    });

    const newFile = await prisma.file.create({
      data: {
        name: name || req.file.originalname,
        url: fileUrl,
        size: req.file.size,
        type: req.file.mimetype,
        category: category || 'general',
        folderId: folderId && folderId !== 'root' ? folderId : null,
        tags: tags || '',
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
    if (tag) where.tags = { contains: tag as string, mode: 'insensitive' };
    
    // Filter by folder context: 'root' or undefined null checks
    if (folderId) {
      where.folderId = folderId === 'root' ? null : folderId;
    }

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

export const createFolder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { name, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Folder name is required' });

    const newFolder = await prisma.folder.create({
      data: {
        name,
        tags: tags || '',
        agencyId: user.agencyId,
      }
    });

    res.status(201).json(newFolder);
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({ error: 'Failed to create folder' });
  }
};

export const getFolders = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { search, tag } = req.query;
    const where: any = { agencyId: user.agencyId };

    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (tag) where.tags = { contains: tag as string, mode: 'insensitive' };

    const folders = await prisma.folder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(folders);
  } catch (error) {
    console.error('Fetch folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};

export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    // Find all files inside this folder to delete them from the filesystem
    const files = await prisma.file.findMany({
      where: { folderId: id, agencyId: user.agencyId }
    });

    for (const file of files) {
      const filePath = path.join(UPLOAD_DIR, path.basename(file.url));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete folder from database (Prisma handles cascading deletion for File records)
    await prisma.folder.delete({
      where: { id, agencyId: user.agencyId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
};

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createFolder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Folder name is required' });

    const newFolder = await prisma.folder.create({
      data: {
        name,
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

    const folders = await prisma.folder.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { files: true }
        }
      }
    });

    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
};

export const deleteFolder = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    // Optional: Delete files inside the folder, or just delete the folder
    // Since Prisma has onDelete: Cascade for folderId in File model, 
    // files will be deleted automatically if we delete the folder.
    // If we want to keep files, we should use SetNull, but our schema uses Cascade.
    await prisma.folder.delete({
      where: { id, agencyId: user.agencyId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ error: 'Failed to delete folder' });
  }
};

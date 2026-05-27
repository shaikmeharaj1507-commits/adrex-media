import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const InvoiceSchema = z.object({
  clientId: z.string().uuid('Invalid client ID'),
  amount: z.string().or(z.number()),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'OVERDUE']).optional(),
  dueDate: z.string().date('Invalid date format'),
  description: z.string().optional(),
});

const InvoiceUpdateSchema = InvoiceSchema.partial();

const ExpenseSchema = z.object({
  category: z.string().min(2, 'Category is required'),
  amount: z.string().or(z.number()),
  description: z.string().optional(),
  date: z.string().date('Invalid date format').optional(),
});

const ExpenseUpdateSchema = ExpenseSchema.partial();

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });
    const invoices = await prisma.invoice.findMany({
      where: { agencyId: user.agencyId },
      include: { client: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invoices);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch invoices' }); }
};

export const createInvoice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = InvoiceSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { clientId, amount, status, dueDate, description } = validation.data;
    const invoice = await prisma.invoice.create({
      data: {
        agencyId: user.agencyId,
        clientId,
        amount: parseFloat(String(amount)),
        status: status || 'DRAFT',
        dueDate: new Date(dueDate),
        description
      },
      include: { client: { select: { companyName: true } } }
    });
    res.status(201).json(invoice);
  } catch (error) { res.status(500).json({ error: 'Failed to create invoice' }); }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = InvoiceUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { id } = req.params;
    const { amount, status, dueDate, description } = validation.data;
    const invoice = await prisma.invoice.update({
      where: { id, agencyId: user.agencyId },
      data: {
        ...(amount !== undefined && { amount: parseFloat(String(amount)) }),
        ...(status && { status }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(description !== undefined && { description })
      },
      include: { client: { select: { companyName: true } } }
    });
    res.json(invoice);
  } catch (error) { res.status(500).json({ error: 'Failed to update invoice' }); }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });
    await prisma.invoice.delete({ where: { id: req.params.id, agencyId: user.agencyId } });
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: 'Failed to delete invoice' }); }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });
    const expenses = await prisma.expense.findMany({
      where: { agencyId: user.agencyId },
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (error) { res.status(500).json({ error: 'Failed to fetch expenses' }); }
};

export const createExpense = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = ExpenseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { category, amount, description, date } = validation.data;
    const expense = await prisma.expense.create({
      data: { agencyId: user.agencyId, category, amount: parseFloat(String(amount)), description, date: date ? new Date(date) : new Date() }
    });
    res.status(201).json(expense);
  } catch (error) { res.status(500).json({ error: 'Failed to create expense' }); }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = ExpenseUpdateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0].message });
    }

    const { id } = req.params;
    const { category, amount, description, date } = validation.data;
    const expense = await prisma.expense.update({
      where: { id, agencyId: user.agencyId },
      data: {
        ...(category && { category }),
        ...(amount !== undefined && { amount: parseFloat(String(amount)) }),
        ...(description !== undefined && { description }),
        ...(date && { date: new Date(date) })
      }
    });
    res.json(expense);
  } catch (error) { res.status(500).json({ error: 'Failed to update expense' }); }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });
    await prisma.expense.delete({ where: { id: req.params.id, agencyId: user.agencyId } });
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: 'Failed to delete expense' }); }
};

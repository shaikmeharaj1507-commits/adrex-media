import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
    const { clientId, amount, status, dueDate } = req.body;
    const invoice = await prisma.invoice.create({
      data: { agencyId: user.agencyId, clientId, amount: parseFloat(amount), status: status || 'DRAFT', dueDate: new Date(dueDate) },
      include: { client: { select: { companyName: true } } }
    });
    res.status(201).json(invoice);
  } catch (error) { res.status(500).json({ error: 'Failed to create invoice' }); }
};

export const updateInvoice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const invoice = await prisma.invoice.update({
      where: { id, agencyId: user.agencyId },
      data: req.body,
      include: { client: { select: { companyName: true } } }
    });
    res.json(invoice);
  } catch (error) { res.status(500).json({ error: 'Failed to update invoice' }); }
};

export const deleteInvoice = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await prisma.invoice.delete({ where: { id: req.params.id, agencyId: user.agencyId } });
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: 'Failed to delete invoice' }); }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
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
    const { category, amount, description, date } = req.body;
    const expense = await prisma.expense.create({
      data: { agencyId: user.agencyId, category, amount: parseFloat(amount), description, date: date ? new Date(date) : new Date() }
    });
    res.status(201).json(expense);
  } catch (error) { res.status(500).json({ error: 'Failed to create expense' }); }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    await prisma.expense.delete({ where: { id: req.params.id, agencyId: user.agencyId } });
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: 'Failed to delete expense' }); }
};

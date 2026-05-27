import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const agencyId = user.agencyId;

    const [campaigns, activeCampaigns, influencers, clients, tasks, expenses, invoices, activityLogs] = await Promise.all([
      prisma.campaign.count({ where: { agencyId } }),
      prisma.campaign.count({ where: { agencyId, status: 'ACTIVE' } }),
      prisma.influencer.count({ where: { agencyId } }),
      prisma.client.count({ where: { agencyId } }),
      prisma.task.count({ where: { agencyId } }),
      prisma.expense.findMany({ where: { agencyId }, orderBy: { date: 'desc' }, take: 6 }),
      prisma.invoice.findMany({ where: { agencyId }, orderBy: { createdAt: 'desc' }, take: 6 }),
      prisma.activityLog.findMany({ where: { agencyId }, orderBy: { createdAt: 'desc' }, take: 8, include: { user: { select: { firstName: true, lastName: true } } } }),
    ]);

    const clientList = await prisma.client.findMany({ where: { agencyId }, select: { monthlyBudget: true } });
    const totalMRR = clientList.reduce((acc, c) => acc + (c.monthlyBudget || 0), 0);

    const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const campaignList = await prisma.campaign.findMany({
      where: { agencyId },
      select: { name: true, status: true, budget: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    const monthlyRevenue = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthInvoices = await prisma.invoice.findMany({
        where: { agencyId, status: 'PAID', issuedDate: { gte: monthStart, lte: monthEnd } },
      });
      const monthExpenses = await prisma.expense.findMany({
        where: { agencyId, date: { gte: monthStart, lte: monthEnd } },
      });
      monthlyRevenue.push({
        month: d.toLocaleString('default', { month: 'short' }),
        revenue: monthInvoices.reduce((s, i) => s + i.amount, 0),
        expenses: monthExpenses.reduce((s, e) => s + e.amount, 0),
      });
    }

    const recentActivity = activityLogs.map(a => ({
      action: `${a.action} ${a.entity.toLowerCase()}`,
      detail: a.details || '',
      time: timeAgo(a.createdAt),
      color: getActivityColor(a.action),
    }));

    res.json({
      campaigns,
      clients,
      influencers,
      tasks,
      activeCampaigns,
      totalRevenue,
      totalExpenses,
      totalMRR,
      monthlyRevenue,
      recentActivity: recentActivity.length ? recentActivity : [],
      recentInvoices: invoices.slice(0, 5),
      recentCampaigns: campaignList,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getReportStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const agencyId = user.agencyId;
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    const expenseDateFilter: any = {};
    const invoiceDateFilter: any = {};

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      dateFilter.createdAt = { gte: start, lte: end };
      expenseDateFilter.date = { gte: start, lte: end };
      invoiceDateFilter.issuedDate = { gte: start, lte: end };
    }

    const [campaignCount, influencerCount, clientCount, taskCount] = await Promise.all([
      prisma.campaign.count({ where: { agencyId, ...dateFilter } }),
      prisma.influencer.count({ where: { agencyId, ...dateFilter } }),
      prisma.client.count({ where: { agencyId, ...dateFilter } }),
      prisma.task.count({ where: { agencyId, ...dateFilter } }),
    ]);

    const campaigns = await prisma.campaign.findMany({ where: { agencyId, ...dateFilter }, select: { budget: true, status: true } });
    const totalBudget = campaigns.reduce((acc, c) => acc + (c.budget || 0), 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;

    const invoices = await prisma.invoice.findMany({ where: { agencyId, ...invoiceDateFilter }, select: { amount: true, status: true } });
    const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);

    const expenses = await prisma.expense.findMany({ where: { agencyId, ...expenseDateFilter }, select: { amount: true, category: true } });
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

    const expenseByCategory: Record<string, number> = {};
    expenses.forEach(e => {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    });
    const channelData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const monthInvoices = await prisma.invoice.findMany({
        where: { agencyId, status: 'PAID', issuedDate: { gte: monthStart, lte: monthEnd } },
      });
      const monthExpenses = await prisma.expense.findMany({
        where: { agencyId, date: { gte: monthStart, lte: monthEnd } },
      });
      monthlyData.push({
        month: d.toLocaleString('default', { month: 'short' }),
        revenue: monthInvoices.reduce((s, inv) => s + inv.amount, 0),
        expenses: monthExpenses.reduce((s, e) => s + e.amount, 0),
      });
    }

    res.json({
      campaigns: campaignCount,
      clients: clientCount,
      influencers: influencerCount,
      tasks: taskCount,
      totalRevenue,
      totalAdSpend: totalBudget,
      totalExpenses,
      activeCampaigns,
      monthlyData,
      channelData,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getActivityColor(action: string): string {
  switch (action) {
    case 'CREATE': return 'bg-purple-500';
    case 'UPDATE': return 'bg-blue-500';
    case 'DELETE': return 'bg-red-500';
    default: return 'bg-zinc-500';
  }
}

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

export const generateInvoicePDF = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id, agencyId: user.agencyId },
      include: {
        client: true,
        agency: true,
      },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('Adrex Media', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).text('Invoice', { align: 'left' });
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text('Invoice Details');
    doc.fontSize(10).font('Helvetica').text(`Invoice ID: ${invoice.id}`);
    doc.text(`Date: ${new Date(invoice.issuedDate).toLocaleDateString()}`);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.text(`Status: ${invoice.status}`);
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text('Bill To:');
    doc.fontSize(10).font('Helvetica').text(invoice.client.companyName);
    doc.text(invoice.client.contactName);
    doc.text(invoice.client.email);
    if (invoice.client.phone) doc.text(invoice.client.phone);
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text('From:');
    doc.fontSize(10).font('Helvetica').text(invoice.agency.name);
    if (invoice.agency.website) doc.text(invoice.agency.website);
    doc.moveDown(1);

    doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica-Bold').text('Description', 50, doc.y, { width: 300 });
    doc.text('Amount', 450, doc.y, { width: 100, align: 'right' });
    doc.moveDown(0.5);
    doc.lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica').text('Professional Services', 50, doc.y, { width: 300 });
    doc.text(`$${invoice.amount.toLocaleString()}`, 450, doc.y, { width: 100, align: 'right' });
    doc.moveDown(1);

    doc.lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.fontSize(14).font('Helvetica-Bold').text('Total:', 400, doc.y, { width: 50 });
    doc.text(`$${invoice.amount.toLocaleString()}`, 450, doc.y, { width: 100, align: 'right' });

    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').text('Thank you for your business! - Adrex Media', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

export const generateReportPDF = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const agencyId = user.agencyId;

    const [campaigns, clients, influencers, invoices] = await Promise.all([
      prisma.campaign.findMany({ where: { agencyId }, select: { name: true, status: true, budget: true } }),
      prisma.client.findMany({ where: { agencyId }, select: { companyName: true, monthlyBudget: true } }),
      prisma.influencer.count({ where: { agencyId } }),
      prisma.invoice.findMany({ where: { agencyId }, select: { amount: true, status: true } }),
    ]);

    const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
    const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=adrex-report.pdf');
    doc.pipe(res);

    doc.fontSize(24).font('Helvetica-Bold').text('Adrex Media', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(14).text('Agency Performance Report', { align: 'left' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'left' });
    doc.moveDown(1);

    doc.fontSize(14).font('Helvetica-Bold').text('Summary');
    doc.fontSize(10).font('Helvetica').text(`Total Campaigns: ${campaigns.length}`);
    doc.text(`Active Campaigns: ${campaigns.filter(c => c.status === 'ACTIVE').length}`);
    doc.text(`Total Clients: ${clients.length}`);
    doc.text(`Total Influencers: ${influencers}`);
    doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`);
    doc.text(`Total Budget: $${totalBudget.toLocaleString()}`);
    doc.moveDown(1);

    doc.fontSize(14).font('Helvetica-Bold').text('Campaigns');
    campaigns.forEach(c => {
      doc.fontSize(10).text(`- ${c.name} (${c.status}) - $${(c.budget || 0).toLocaleString()}`);
    });
    doc.moveDown(1);

    doc.fontSize(14).font('Helvetica-Bold').text('Clients');
    clients.forEach(c => {
      doc.fontSize(10).text(`- ${c.companyName} - $${(c.monthlyBudget || 0).toLocaleString()}/month`);
    });

    doc.moveDown(2);
    doc.fontSize(8).font('Helvetica').text('Adrex Media - Agency Management Platform', { align: 'center' });

    doc.end();
  } catch (error) {
    console.error('Report PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate report PDF' });
  }
};

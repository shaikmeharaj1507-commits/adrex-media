import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

type Doc = InstanceType<typeof PDFDocument>;

const prisma = new PrismaClient();
const APP_NAME = 'Adrex Media';
const APP_VERSION = 'v2.1';
const BRAND_COLOR = '#7c3aed';
const LIGHT_GRAY = '#f4f4f5';
const TEXT_PRIMARY = '#18181b';
const TEXT_SECONDARY = '#71717a';
const TEXT_MUTED = '#a1a1aa';

function drawHeader(doc: Doc, agencyName: string) {
  const pageWidth = doc.page.width;
  doc.rect(0, 0, pageWidth, 65).fillColor('#18181b').fill();
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff').text(APP_NAME, 50, 18);
  doc.fontSize(8).font('Helvetica').fillColor('#a1a1aa').text(`${APP_VERSION} • Agency Management Platform`, 50, 40);
  const agencyText = doc.fontSize(10).font('Helvetica').fillColor('#d4d4d8');
  const textWidth = doc.widthOfString(agencyName);
  agencyText.text(agencyName, pageWidth - 50 - textWidth, 18);
  doc.moveDown(3);
}

function drawFooter(doc: Doc, agencyName: string) {
  const pageHeight = doc.page.height;
  const pageWidth = doc.page.width;
  doc.rect(0, pageHeight - 30, pageWidth, 30).fillColor('#f4f4f5').fill();
  doc.fontSize(7).font('Helvetica').fillColor('#a1a1aa').text(
    `${APP_NAME} • ${agencyName} • Generated ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} • Page ${doc.bufferedPageRange().start + 1}`,
    50, pageHeight - 22, { width: pageWidth - 100, align: 'center' }
  );
}

function drawSectionHeader(doc: Doc, title: string) {
  doc.moveDown(0.5);
  doc.rect(50, doc.y, 500, 1.5).fillColor(BRAND_COLOR).fill();
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text(title);
  doc.moveDown(0.5);
}

function drawTableHeader(doc: Doc, columns: { label: string; x: number; width: number; align?: 'left' | 'center' | 'right' }[]) {
  doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_SECONDARY);
  columns.forEach(col => {
    doc.text(col.label, col.x, doc.y, { width: col.width, align: col.align || 'left' });
  });
  doc.moveDown(0.2);
  const y = doc.y;
  doc.lineWidth(0.5).strokeColor('#e4e4e7').moveTo(50, y).lineTo(550, y).stroke();
  doc.moveDown(0.3);
}

function drawTableRow(doc: Doc, columns: { text: string; x: number; width: number; align?: 'left' | 'center' | 'right'; bold?: boolean; color?: string }[]) {
  columns.forEach(col => {
    if (col.bold) doc.font('Helvetica-Bold');
    else doc.font('Helvetica');
    doc.fontSize(9).fillColor(col.color || TEXT_PRIMARY);
    doc.text(col.text, col.x, doc.y, { width: col.width, align: col.align || 'left', ellipsis: true });
  });
  doc.moveDown(0.3);
}

export const generateInvoicePDF = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.userId) return res.status(401).json({ error: 'Authentication required' });

    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id, agencyId: user.agencyId },
      include: { client: true, agency: true },
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${APP_NAME}-invoice-${invoice.id.slice(0, 8)}.pdf`);
    doc.pipe(res);

    // Header bar
    drawHeader(doc, invoice.agency.name);

    // Invoice title
    doc.fontSize(28).font('Helvetica-Bold').fillColor(BRAND_COLOR).text('INVOICE', 50, doc.y);
    doc.moveDown(0.5);

    // Two-column layout: Invoice details | Bill To
    const col1X = 50;
    const col2X = 320;
    const rowY = doc.y;

    // Left column - Invoice Details
    doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text('Invoice Details', col1X, rowY);
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_SECONDARY);
    const details = [
      ['Invoice No.', `INV-${invoice.id.slice(0, 8).toUpperCase()}`],
      ['Issued', new Date(invoice.issuedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
      ['Due Date', new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
    ];
    details.forEach(([label, value]) => {
      doc.text(`${label}:`, col1X, doc.y, { width: 100 });
      doc.font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text(value, col1X + 100, doc.y - 12, { width: 150 });
      doc.font('Helvetica').fillColor(TEXT_SECONDARY);
      doc.moveDown(0.4);
    });

    // Status badge
    const statusColor = invoice.status === 'PAID' ? '#10b981' : invoice.status === 'OVERDUE' ? '#ef4444' : invoice.status === 'SENT' ? '#3b82f6' : '#f59e0b';
    doc.rect(col1X, doc.y, 80, 20).fillColor(statusColor).fill();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff').text(invoice.status, col1X + 10, doc.y + 5, { width: 60, align: 'center' });

    // Right column - Bill To
    doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text('Bill To:', col2X, rowY);
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text(invoice.client.companyName, col2X, doc.y);
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_SECONDARY);
    doc.text(invoice.client.contactName, col2X, doc.y);
    doc.text(invoice.client.email, col2X, doc.y);
    if (invoice.client.phone) doc.text(invoice.client.phone, col2X, doc.y);

    doc.moveDown(2);

    // Line items table
    drawSectionHeader(doc, 'Services');
    drawTableHeader(doc, [
      { label: 'Description', x: 50, width: 300 },
      { label: 'Qty', x: 370, width: 50, align: 'center' },
      { label: 'Amount', x: 450, width: 100, align: 'right' },
    ]);

    drawTableRow(doc, [
      { text: invoice.description || 'Professional Marketing Services', x: 50, width: 300 },
      { text: '1', x: 370, width: 50, align: 'center' },
      { text: `₹${invoice.amount.toLocaleString('en-IN')}`, x: 450, width: 100, align: 'right', bold: true },
    ]);

    // Separator
    doc.moveDown(0.5);
    const sepY = doc.y;
    doc.lineWidth(1).strokeColor('#e4e4e7').moveTo(50, sepY).lineTo(550, sepY).stroke();

    // Total
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor(TEXT_SECONDARY).text('Subtotal:', 400, doc.y, { width: 50 });
    doc.fontSize(10).font('Helvetica').fillColor(TEXT_PRIMARY).text(`₹${invoice.amount.toLocaleString('en-IN')}`, 450, doc.y, { width: 100, align: 'right' });
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor(TEXT_SECONDARY).text('Tax (0%):', 400, doc.y, { width: 50 });
    doc.fontSize(10).font('Helvetica').fillColor(TEXT_PRIMARY).text('₹0', 450, doc.y, { width: 100, align: 'right' });
    doc.moveDown(0.3);
    doc.lineWidth(0.5).strokeColor('#e4e4e7').moveTo(400, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(BRAND_COLOR).text('Total Due:', 380, doc.y, { width: 70 });
    doc.fontSize(16).font('Helvetica-Bold').fillColor(BRAND_COLOR).text(`₹${invoice.amount.toLocaleString('en-IN')}`, 450, doc.y, { width: 100, align: 'right' });

    // Payment info & notes
    doc.moveDown(2);
    drawSectionHeader(doc, 'Payment Information');
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_SECONDARY);
    doc.text('Bank: State Bank of India', 50, doc.y);
    doc.text('Account: XXXX XXXX 1234', 50, doc.y);
    doc.text('IFSC: SBIN0001234', 50, doc.y);

    doc.moveDown(1);
    drawSectionHeader(doc, 'Notes');
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_SECONDARY);
    doc.text('Payment is due within 30 days of the invoice date. Late payments may incur a 2% monthly interest charge.', 50, doc.y, { width: 500 });

    // Thank you
    doc.moveDown(2);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(BRAND_COLOR).text('Thank you for your business!', { align: 'center' });

    // Footer
    drawFooter(doc, invoice.agency.name);

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

export const generateReportPDF = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Authentication required' });

    const agencyId = user.agencyId;

    const [agency, campaigns, clients, influencers, expenses, invoices, tasks] = await Promise.all([
      prisma.agency.findUnique({ where: { id: agencyId } }),
      prisma.campaign.findMany({ where: { agencyId }, orderBy: { createdAt: 'desc' } }),
      prisma.client.findMany({ where: { agencyId }, orderBy: { createdAt: 'desc' } }),
      prisma.influencer.findMany({ where: { agencyId }, orderBy: { rating: 'desc' } }),
      prisma.expense.findMany({ where: { agencyId }, orderBy: { date: 'desc' } }),
      prisma.invoice.findMany({ where: { agencyId }, orderBy: { createdAt: 'desc' } }),
      prisma.task.findMany({ where: { agencyId }, orderBy: { createdAt: 'desc' } }),
    ]);

    const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + i.amount, 0);
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
    const completedTasks = tasks.filter(t => t.status === 'DONE').length;
    const pendingTasks = tasks.filter(t => t.status !== 'DONE').length;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${APP_NAME}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    doc.pipe(res);

    // Cover page
    drawHeader(doc, agency?.name || 'Agency');
    
    doc.fontSize(32).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text('Performance Report', 50, doc.y);
    doc.fontSize(12).font('Helvetica').fillColor(TEXT_SECONDARY).text(`Comprehensive agency analytics and insights`, 50, doc.y);
    doc.fontSize(10).fillColor(TEXT_MUTED).text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 50, doc.y);
    doc.moveDown(1.5);

    // KPI cards
    const kpis = [
      { label: 'Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#10b981' },
      { label: 'Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, color: '#ef4444' },
      { label: 'Net Profit', value: `₹${netProfit.toLocaleString('en-IN')}`, color: BRAND_COLOR },
      { label: 'Margin', value: `${profitMargin}%`, color: '#3b82f6' },
    ];

    const cardWidth = 115;
    const cardGap = 15;
    kpis.forEach((kpi, i) => {
      const x = 50 + i * (cardWidth + cardGap);
      doc.rect(x, doc.y, cardWidth, 55).fillColor(LIGHT_GRAY).fill();
      doc.fontSize(16).font('Helvetica-Bold').fillColor(kpi.color).text(kpi.value, x + 10, doc.y + 10, { width: cardWidth - 20, align: 'center' });
      doc.fontSize(8).font('Helvetica').fillColor(TEXT_SECONDARY).text(kpi.label, x + 10, doc.y + 35, { width: cardWidth - 20, align: 'center' });
    });

    doc.moveDown(3);

    // Summary section
    drawSectionHeader(doc, 'Agency Overview');
    const summaryItems = [
      ['Total Campaigns', campaigns.length.toString()],
      ['Active Campaigns', activeCampaigns.toString()],
      ['Total Campaign Budget', `₹${totalBudget.toLocaleString('en-IN')}`],
      ['Total Clients', clients.length.toString()],
      ['Total Influencers', influencers.length.toString()],
      ['Completed Tasks', `${completedTasks} / ${tasks.length}`],
      ['Pending Tasks', pendingTasks.toString()],
    ];
    drawTableHeader(doc, [
      { label: 'Metric', x: 50, width: 300 },
      { label: 'Value', x: 450, width: 100, align: 'right' },
    ]);
    summaryItems.forEach(([label, value]) => {
      drawTableRow(doc, [
        { text: label, x: 50, width: 300 },
        { text: value, x: 450, width: 100, align: 'right', bold: true },
      ]);
    });

    // Campaigns
    if (campaigns.length > 0) {
      drawSectionHeader(doc, 'Campaigns');
      drawTableHeader(doc, [
        { label: 'Campaign', x: 50, width: 180 },
        { label: 'Status', x: 250, width: 80, align: 'center' },
        { label: 'Budget', x: 450, width: 100, align: 'right' },
      ]);
      campaigns.slice(0, 15).forEach(c => {
        drawTableRow(doc, [
          { text: c.name, x: 50, width: 180 },
          { text: c.status, x: 250, width: 80, align: 'center' },
          { text: `₹${(c.budget || 0).toLocaleString('en-IN')}`, x: 450, width: 100, align: 'right', bold: true },
        ]);
      });
    }

    // Clients
    if (clients.length > 0) {
      drawSectionHeader(doc, 'Clients');
      drawTableHeader(doc, [
        { label: 'Company', x: 50, width: 160 },
        { label: 'Contact', x: 230, width: 120 },
        { label: 'Email', x: 360, width: 120 },
        { label: 'Monthly Budget', x: 490, width: 60, align: 'right' },
      ]);
      clients.slice(0, 15).forEach(c => {
        drawTableRow(doc, [
          { text: c.companyName, x: 50, width: 160 },
          { text: c.contactName, x: 230, width: 120 },
          { text: c.email, x: 360, width: 120 },
          { text: `₹${(c.monthlyBudget || 0).toLocaleString('en-IN')}`, x: 490, width: 60, align: 'right', bold: true },
        ]);
      });
    }

    // Top Influencers
    if (influencers.length > 0) {
      drawSectionHeader(doc, 'Top Influencers');
      drawTableHeader(doc, [
        { label: 'Name', x: 50, width: 150 },
        { label: 'Platform', x: 220, width: 100 },
        { label: 'Niche', x: 340, width: 100 },
        { label: 'Rating', x: 490, width: 60, align: 'center' },
      ]);
      influencers.slice(0, 10).forEach(inf => {
        const platform = [inf.instagram ? 'IG' : '', inf.tiktok ? 'TT' : '', inf.youtube ? 'YT' : ''].filter(Boolean).join(', ') || '—';
        drawTableRow(doc, [
          { text: inf.name, x: 50, width: 150 },
          { text: platform, x: 220, width: 100 },
          { text: inf.niche || '—', x: 340, width: 100 },
          { text: inf.rating > 0 ? `${inf.rating}/5` : 'N/A', x: 490, width: 60, align: 'center', bold: true },
        ]);
      });
    }

    // Expense Breakdown
    if (expenses.length > 0) {
      drawSectionHeader(doc, 'Expense Breakdown');
      const expenseByCategory: Record<string, number> = {};
      expenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });

      drawTableHeader(doc, [
        { label: 'Category', x: 50, width: 250 },
        { label: 'Amount', x: 400, width: 80, align: 'right' },
        { label: '% of Total', x: 490, width: 60, align: 'right' },
      ]);
      Object.entries(expenseByCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount]) => {
          const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';
          drawTableRow(doc, [
            { text: cat, x: 50, width: 250 },
            { text: `₹${amount.toLocaleString('en-IN')}`, x: 400, width: 80, align: 'right', bold: true },
            { text: `${pct}%`, x: 490, width: 60, align: 'right' },
          ]);
        });
    }

    // Recent Invoices
    if (invoices.length > 0) {
      drawSectionHeader(doc, 'Recent Invoices');
      drawTableHeader(doc, [
        { label: 'Client', x: 50, width: 150 },
        { label: 'Status', x: 220, width: 80, align: 'center' },
        { label: 'Due Date', x: 320, width: 100 },
        { label: 'Amount', x: 490, width: 60, align: 'right' },
      ]);
      invoices.slice(0, 10).forEach(inv => {
        const clientName = (inv as any).client?.companyName || 'Unknown';
        drawTableRow(doc, [
          { text: clientName, x: 50, width: 150 },
          { text: inv.status, x: 220, width: 80, align: 'center' },
          { text: new Date(inv.dueDate).toLocaleDateString('en-IN'), x: 320, width: 100 },
          { text: `₹${inv.amount.toLocaleString('en-IN')}`, x: 490, width: 60, align: 'right', bold: true },
        ]);
      });
    }

    // Footer
    drawFooter(doc, agency?.name || 'Agency');

    doc.end();
  } catch (error) {
    console.error('Report PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate report PDF' });
  }
};

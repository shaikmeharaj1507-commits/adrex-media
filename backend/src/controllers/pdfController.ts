import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

type Doc = InstanceType<typeof PDFDocument>;

const prisma = new PrismaClient();
const APP_NAME = 'Adrex Media';
const APP_VERSION = 'v2.1';
const BRAND_COLOR = '#7c3aed';
const LIGHT_GRAY = '#f8fafc';
const TEXT_PRIMARY = '#0f172a';
const TEXT_SECONDARY = '#475569';
const TEXT_MUTED = '#94a3b8';

function drawHeader(doc: Doc, agencyName: string) {
  const pageWidth = doc.page.width;
  // Branded Top Navigation Header Bar
  doc.rect(0, 0, pageWidth, 65).fillColor('#0f172a').fill();
  
  // Left: Brand Logo text
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff').text(APP_NAME.toUpperCase(), 50, 18);
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(`${APP_VERSION} • Operations OS`, 50, 38);
  
  // Right: Agency Name
  const agencyText = doc.fontSize(10).font('Helvetica-Bold').fillColor('#e2e8f0');
  const textWidth = doc.widthOfString(agencyName);
  agencyText.text(agencyName, pageWidth - 50 - textWidth, 24);
}

function drawFooter(doc: Doc, agencyName: string) {
  const pageHeight = doc.page.height;
  const pageWidth = doc.page.width;
  
  // Thin border above footer
  doc.lineWidth(0.5).strokeColor('#e2e8f0').moveTo(50, pageHeight - 35).lineTo(pageWidth - 50, pageHeight - 35).stroke();
  
  // Page number & generated timestamp
  doc.fontSize(7).font('Helvetica').fillColor('#64748b').text(
    `CONFIDENTIAL • ${agencyName.toUpperCase()} • Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    50, pageHeight - 25, { width: pageWidth - 100, align: 'left' }
  );
  
  // Page count on the right
  const pageNumberText = `Page ${doc.bufferedPageRange().start + 1}`;
  doc.text(pageNumberText, pageWidth - 50 - doc.widthOfString(pageNumberText), pageHeight - 25);
}

function drawSectionHeader(doc: Doc, title: string) {
  ensureSpace(doc, 60);
  doc.moveDown(1);
  const startY = doc.y;
  
  // Left small purple marker bar
  doc.rect(50, startY, 4, 16).fillColor(BRAND_COLOR).fill();
  
  // Section text
  doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text(title.toUpperCase(), 62, startY + 2);
  doc.moveDown(0.6);
}

function drawTableHeader(doc: Doc, columns: { label: string; x: number; width: number; align?: 'left' | 'center' | 'right' }[]) {
  ensureSpace(doc, 30);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(TEXT_SECONDARY);
  columns.forEach(col => {
    doc.text(col.label, col.x, doc.y, { width: col.width, align: col.align || 'left' });
  });
  doc.moveDown(0.25);
  const y = doc.y;
  doc.lineWidth(1).strokeColor('#cbd5e1').moveTo(50, y).lineTo(545, y).stroke();
  doc.moveDown(0.4);
}

function drawTableRow(
  doc: Doc, 
  columns: { text: string; x: number; width: number; align?: 'left' | 'center' | 'right'; bold?: boolean; color?: string }[], 
  isEven: boolean = false
) {
  ensureSpace(doc, 22);
  const currentY = doc.y;
  
  // Light background strip for even rows
  if (isEven) {
    doc.rect(50, currentY - 3, 495, 18).fillColor('#f8fafc').fill();
  }

  columns.forEach(col => {
    if (col.bold) doc.font('Helvetica-Bold');
    else doc.font('Helvetica');
    doc.fontSize(8.5).fillColor(col.color || TEXT_PRIMARY);
    // Align y position precisely
    doc.text(col.text, col.x, currentY, { width: col.width, align: col.align || 'left', ellipsis: true });
  });
  doc.moveDown(0.5);
}

function ensureSpace(doc: Doc, needed: number) {
  // A4 Page Height is 842. Bottom margin starts around 780.
  if (doc.y + needed > 770) {
    doc.addPage();
  }
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

    const doc = new PDFDocument({ 
      size: 'A4', 
      margins: { top: 80, bottom: 50, left: 50, right: 50 } 
    });

    // Auto-draw header and footer on additional pages
    doc.on('pageAdded', () => {
      drawHeader(doc, invoice.agency.name);
      drawFooter(doc, invoice.agency.name);
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${APP_NAME}-invoice-${invoice.id.slice(0, 8)}.pdf`);
    doc.pipe(res);

    // Initial page header & footer
    drawHeader(doc, invoice.agency.name);
    drawFooter(doc, invoice.agency.name);

    // Position below header
    doc.y = 85;

    // Title
    doc.fontSize(22).font('Helvetica-Bold').fillColor(BRAND_COLOR).text('INVOICE', 50, doc.y);
    doc.moveDown(0.8);

    // Two-column Details layout
    const col1X = 50;
    const col2X = 320;
    const rowY = doc.y;

    // Left Column: Invoice Info
    doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text('Invoice Details', col1X, rowY);
    doc.moveDown(0.4);
    
    doc.font('Helvetica').fontSize(9).fillColor(TEXT_SECONDARY);
    const details = [
      ['Invoice ID', `INV-${invoice.id.slice(0, 8).toUpperCase()}`],
      ['Issued Date', new Date(invoice.issuedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
      ['Due Date', new Date(invoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
    ];
    
    details.forEach(([label, value]) => {
      const curY = doc.y;
      doc.text(label, col1X, curY);
      doc.font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text(value, col1X + 80, curY);
      doc.font('Helvetica').fillColor(TEXT_SECONDARY);
      doc.moveDown(0.2);
    });

    // Status Badge
    doc.moveDown(0.5);
    const statusBg = invoice.status === 'PAID' ? '#d1fae5' : invoice.status === 'OVERDUE' ? '#fee2e2' : '#fef3c7';
    const statusText = invoice.status === 'PAID' ? '#065f46' : invoice.status === 'OVERDUE' ? '#991b1b' : '#92400e';
    
    doc.rect(col1X, doc.y, 70, 16).fillColor(statusBg).fill();
    doc.fontSize(8).font('Helvetica-Bold').fillColor(statusText).text(invoice.status, col1X, doc.y + 4, { width: 70, align: 'center' });

    // Right Column: Bill To Info
    doc.fontSize(10).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text('Bill To:', col2X, rowY);
    doc.moveDown(0.4);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text(invoice.client.companyName, col2X, doc.y);
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_SECONDARY);
    doc.text(invoice.client.contactName, col2X, doc.y);
    doc.text(invoice.client.email, col2X, doc.y);
    if (invoice.client.phone) doc.text(invoice.client.phone, col2X, doc.y);

    doc.moveDown(2);

    // Services section
    drawSectionHeader(doc, 'Services / Deliverables');
    drawTableHeader(doc, [
      { label: 'Item / Description', x: 50, width: 330 },
      { label: 'Qty', x: 390, width: 40, align: 'center' },
      { label: 'Amount', x: 445, width: 100, align: 'right' },
    ]);

    drawTableRow(doc, [
      { text: invoice.description || 'Professional Marketing Services', x: 50, width: 330 },
      { text: '1', x: 390, width: 40, align: 'center' },
      { text: `₹${invoice.amount.toLocaleString('en-IN')}.00`, x: 445, width: 100, align: 'right', bold: true },
    ], false);

    // Divider
    doc.moveDown(0.8);
    const dividerY = doc.y;
    doc.lineWidth(0.5).strokeColor('#e2e8f0').moveTo(50, dividerY).lineTo(545, dividerY).stroke();

    // Summary calculation block
    doc.moveDown(0.6);
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_SECONDARY).text('Subtotal:', 380, doc.y, { width: 60 });
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_PRIMARY).text(`₹${invoice.amount.toLocaleString('en-IN')}.00`, 445, doc.y - 10, { width: 100, align: 'right' });
    
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_SECONDARY).text('Tax (0.0%):', 380, doc.y, { width: 60 });
    doc.fontSize(9).font('Helvetica').fillColor(TEXT_PRIMARY).text('₹0.00', 445, doc.y - 10, { width: 100, align: 'right' });
    
    doc.moveDown(0.4);
    const subDivY = doc.y;
    doc.lineWidth(0.5).strokeColor('#cbd5e1').moveTo(380, subDivY).lineTo(545, subDivY).stroke();
    
    doc.moveDown(0.4);
    doc.fontSize(12).font('Helvetica-Bold').fillColor(BRAND_COLOR).text('Total Due:', 380, doc.y, { width: 70 });
    doc.fontSize(12).font('Helvetica-Bold').fillColor(BRAND_COLOR).text(`₹${invoice.amount.toLocaleString('en-IN')}.00`, 445, doc.y - 13, { width: 100, align: 'right' });

    // Payment Information Details
    doc.moveDown(2);
    drawSectionHeader(doc, 'Payment Instructions');
    doc.fontSize(8.5).font('Helvetica').fillColor(TEXT_SECONDARY);
    doc.text('Please process payments to the following bank account:', 50, doc.y);
    doc.moveDown(0.2);
    
    const bankDetails = [
      ['Beneficiary Bank', 'State Bank of India'],
      ['Account Number', 'XXXX XXXX 1234'],
      ['IFSC Code', 'SBIN0001234'],
      ['Payment Terms', 'Net 30 days'],
    ];
    bankDetails.forEach(([lbl, val]) => {
      const curY = doc.y;
      doc.text(lbl, 50, curY);
      doc.font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text(val, 160, curY);
      doc.font('Helvetica').fillColor(TEXT_SECONDARY);
      doc.moveDown(0.15);
    });

    doc.moveDown(1.5);
    drawSectionHeader(doc, 'Terms & Conditions');
    doc.fontSize(8).font('Helvetica').fillColor(TEXT_MUTED);
    doc.text('All services provided are subject to our standard service agreements. Overdue accounts will incur finance charges of 2.0% per month on the unpaid balance.', 50, doc.y, { width: 495 });

    doc.moveDown(2.5);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(BRAND_COLOR).text('Thank you for choosing Adrex Media!', { align: 'center' });

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

    const doc = new PDFDocument({ 
      size: 'A4', 
      margins: { top: 80, bottom: 50, left: 50, right: 50 } 
    });

    const agencyName = agency?.name || 'Agency';

    // Auto-draw header and footer on additional pages
    doc.on('pageAdded', () => {
      drawHeader(doc, agencyName);
      drawFooter(doc, agencyName);
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${APP_NAME}-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    doc.pipe(res);

    // Initial page header & footer
    drawHeader(doc, agencyName);
    drawFooter(doc, agencyName);

    // Cover Title block
    doc.y = 90;
    doc.fontSize(24).font('Helvetica-Bold').fillColor(TEXT_PRIMARY).text('AGENCY PERFORMANCE REPORT', 50, doc.y);
    doc.fontSize(10).font('Helvetica').fillColor(TEXT_SECONDARY).text('Operations Summary & Strategy Metrics Overview', 50, doc.y);
    doc.moveDown(1.5);

    // KPI Cards Block (Horizontal Flex)
    const kpis = [
      { label: 'Revenue Earned', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#059669' },
      { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, color: '#dc2626' },
      { label: 'Net Profit', value: `₹${netProfit.toLocaleString('en-IN')}`, color: BRAND_COLOR },
      { label: 'Profit Margin', value: `${profitMargin}%`, color: '#2563eb' },
    ];

    const cardWidth = 110;
    const cardGap = 18;
    const initialKpiY = doc.y;

    kpis.forEach((kpi, i) => {
      const x = 50 + i * (cardWidth + cardGap);
      // Soft card outline and background
      doc.rect(x, initialKpiY, cardWidth, 50).fillColor('#f8fafc').fill();
      doc.rect(x, initialKpiY, cardWidth, 50).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
      
      doc.fontSize(11).font('Helvetica-Bold').fillColor(kpi.color).text(kpi.value, x, initialKpiY + 12, { width: cardWidth, align: 'center' });
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(TEXT_SECONDARY).text(kpi.label.toUpperCase(), x, initialKpiY + 30, { width: cardWidth, align: 'center' });
    });

    doc.y = initialKpiY + 65;

    // Overview section
    drawSectionHeader(doc, 'Operations Overview');
    const summaryItems = [
      ['Total Campaigns Configured', campaigns.length.toString()],
      ['Active / Running Campaigns', activeCampaigns.toString()],
      ['Cumulative Campaigns Budget', `₹${totalBudget.toLocaleString('en-IN')}`],
      ['Total Clients Served', clients.length.toString()],
      ['Active Creator Roster Size', influencers.length.toString()],
      ['Completed Deliverable Tasks', `${completedTasks} / ${tasks.length} tasks`],
      ['Remaining Pending Tasks', pendingTasks.toString()],
    ];

    drawTableHeader(doc, [
      { label: 'Key Performance Metric', x: 50, width: 330 },
      { label: 'Current Roster Value', x: 445, width: 100, align: 'right' },
    ]);

    summaryItems.forEach(([label, value], idx) => {
      drawTableRow(doc, [
        { text: label, x: 50, width: 330 },
        { text: value, x: 445, width: 100, align: 'right', bold: true },
      ], idx % 2 === 0);
    });

    // Campaigns section
    if (campaigns.length > 0) {
      drawSectionHeader(doc, 'Campaign Status & Budgets');
      drawTableHeader(doc, [
        { label: 'Campaign Title', x: 50, width: 230 },
        { label: 'Current Status', x: 290, width: 90, align: 'center' },
        { label: 'Approved Budget', x: 445, width: 100, align: 'right' },
      ]);
      campaigns.slice(0, 10).forEach((c, idx) => {
        drawTableRow(doc, [
          { text: c.name, x: 50, width: 230 },
          { text: c.status, x: 290, width: 90, align: 'center' },
          { text: `₹${(c.budget || 0).toLocaleString('en-IN')}`, x: 445, width: 100, align: 'right', bold: true },
        ], idx % 2 === 0);
      });
    }

    // Clients section
    if (clients.length > 0) {
      drawSectionHeader(doc, 'Accounts Summary');
      drawTableHeader(doc, [
        { label: 'Client / Company', x: 50, width: 140 },
        { label: 'Primary Contact', x: 200, width: 100 },
        { label: 'Billing Email Address', x: 310, width: 130 },
        { label: 'Retainer Fee', x: 450, width: 95, align: 'right' },
      ]);
      clients.slice(0, 10).forEach((c, idx) => {
        drawTableRow(doc, [
          { text: c.companyName, x: 50, width: 140 },
          { text: c.contactName, x: 200, width: 100 },
          { text: c.email, x: 310, width: 130 },
          { text: `₹${(c.monthlyBudget || 0).toLocaleString('en-IN')}`, x: 450, width: 95, align: 'right', bold: true },
        ], idx % 2 === 0);
      });
    }

    // Influencers section
    if (influencers.length > 0) {
      drawSectionHeader(doc, 'Top Roster Creators');
      drawTableHeader(doc, [
        { label: 'Influencer / Creator', x: 50, width: 160 },
        { label: 'Primary Network', x: 220, width: 110 },
        { label: 'Niche Content Type', x: 340, width: 120 },
        { label: 'Rating', x: 475, width: 70, align: 'center' },
      ]);
      influencers.slice(0, 10).forEach((inf, idx) => {
        const platform = [inf.instagram ? 'Instagram' : '', inf.tiktok ? 'TikTok' : '', inf.youtube ? 'YouTube' : ''].filter(Boolean).join(', ') || 'General';
        drawTableRow(doc, [
          { text: inf.name, x: 50, width: 160 },
          { text: platform, x: 220, width: 110 },
          { text: inf.niche || 'General Creative', x: 340, width: 120 },
          { text: inf.rating > 0 ? `${inf.rating} / 5` : 'New', x: 475, width: 70, align: 'center', bold: true },
        ], idx % 2 === 0);
      });
    }

    // Expenses Breakdown
    if (expenses.length > 0) {
      drawSectionHeader(doc, 'Expense Breakdown By Category');
      const expenseByCategory: Record<string, number> = {};
      expenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });

      drawTableHeader(doc, [
        { label: 'Expense Category / Spend Label', x: 50, width: 260 },
        { label: 'Total Incurred', x: 360, width: 90, align: 'right' },
        { label: 'Share of Total', x: 465, width: 80, align: 'right' },
      ]);
      Object.entries(expenseByCategory)
        .sort((a, b) => b[1] - a[1])
        .forEach(([cat, amount], idx) => {
          const pct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';
          drawTableRow(doc, [
            { text: cat, x: 50, width: 260 },
            { text: `₹${amount.toLocaleString('en-IN')}`, x: 360, width: 90, align: 'right', bold: true },
            { text: `${pct}%`, x: 465, width: 80, align: 'right' },
          ], idx % 2 === 0);
        });
    }

    // Recent Invoices
    if (invoices.length > 0) {
      drawSectionHeader(doc, 'Recent Invoices Ledger');
      drawTableHeader(doc, [
        { label: 'Client / Account', x: 50, width: 170 },
        { label: 'Invoice Status', x: 230, width: 90, align: 'center' },
        { label: 'Payment Due Date', x: 330, width: 110 },
        { label: 'Total Amount', x: 455, width: 90, align: 'right' },
      ]);
      invoices.slice(0, 10).forEach((inv, idx) => {
        const clientName = (inv as any).client?.companyName || 'Corporate Client';
        drawTableRow(doc, [
          { text: clientName, x: 50, width: 170 },
          { text: inv.status, x: 230, width: 90, align: 'center' },
          { text: new Date(inv.dueDate).toLocaleDateString('en-IN'), x: 330, width: 110 },
          { text: `₹${inv.amount.toLocaleString('en-IN')}`, x: 455, width: 90, align: 'right', bold: true },
        ], idx % 2 === 0);
      });
    }

    doc.end();
  } catch (error) {
    console.error('Report PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate report PDF' });
  }
};

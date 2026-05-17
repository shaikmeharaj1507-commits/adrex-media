import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';

const prisma = new PrismaClient();

// In production, these should be in .env
// For demo/development, using placeholders
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC_PLACEHOLDER';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'AUTH_PLACEHOLDER';
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox number

const client = twilio(accountSid, authToken);

export const getWhatsAppHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { phoneNumber } = req.query;

    const whereClause: any = { agencyId: user.agencyId };
    if (phoneNumber) {
      whereClause.OR = [
        { toNumber: `whatsapp:${phoneNumber}` },
        { fromNumber: `whatsapp:${phoneNumber}` }
      ];
    }

    const messages = await prisma.whatsAppMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching WhatsApp history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

export const sendWhatsAppMessage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { to, body } = req.body;

    if (!to || !body) {
      return res.status(400).json({ error: 'Missing "to" or "body" parameters' });
    }

    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

    // If API credentials are not set, mock the success (useful for local development)
    if (accountSid === 'AC_PLACEHOLDER') {
      const mockMessage = await prisma.whatsAppMessage.create({
        data: {
          agencyId: user.agencyId,
          toNumber: formattedTo,
          fromNumber: twilioWhatsAppNumber,
          body: body,
          status: 'sent',
          messageSid: `SM_mock_${Date.now()}`,
          direction: 'outbound'
        }
      });
      return res.status(201).json(mockMessage);
    }

    // Actual Twilio Send
    const message = await client.messages.create({
      body: body,
      from: twilioWhatsAppNumber,
      to: formattedTo
    });

    // Log to Database
    const dbMessage = await prisma.whatsAppMessage.create({
      data: {
        agencyId: user.agencyId,
        toNumber: formattedTo,
        fromNumber: twilioWhatsAppNumber,
        body: body,
        status: message.status,
        messageSid: message.sid,
        direction: 'outbound'
      }
    });

    res.status(201).json(dbMessage);
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
};

export const handleTwilioWebhook = async (req: Request, res: Response) => {
  try {
    // This endpoint handles INCOMING messages from Twilio
    const { SmsMessageSid, From, To, Body, SmsStatus } = req.body;

    // In a real multi-tenant app, we'd need a way to map 'To' (our twilio number)
    // or 'From' (influencer number) back to the specific agency.
    // For this implementation, we'll try to find an existing outbound message to determine the agency.
    
    let agencyId = null;
    const previousMessage = await prisma.whatsAppMessage.findFirst({
      where: { toNumber: From }, // Outbound message to this number
      orderBy: { createdAt: 'desc' }
    });

    if (previousMessage) {
      agencyId = previousMessage.agencyId;
    }

    if (agencyId) {
      await prisma.whatsAppMessage.create({
        data: {
          agencyId: agencyId,
          toNumber: To,
          fromNumber: From,
          body: Body,
          status: SmsStatus || 'received',
          messageSid: SmsMessageSid,
          direction: 'inbound'
        }
      });
    }

    // Twilio expects TwiML in response
    res.setHeader('Content-Type', 'text/xml');
    res.send('<Response></Response>');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).send('Error processing webhook');
  }
};

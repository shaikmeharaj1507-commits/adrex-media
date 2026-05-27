import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { aiService } from '../services/aiService';

const prisma = new PrismaClient();

function unauthorized(res: Response) {
  return res.status(401).json({ error: 'Authentication required' });
}

function badRequest(res: Response, message: string) {
  return res.status(400).json({ error: message });
}

function serverError(res: Response, error: any, context: string) {
  console.error(`AI Error [${context}]:`, error?.status || '', error?.message || '');
  const msg = error?.message || 'Unknown error';
  if (msg.includes('GROQ_API_KEY') || msg.includes('not configured')) {
    return res.status(503).json({ error: 'AI service is not configured. Contact your administrator.' });
  }
  return res.status(500).json({ error: `AI generation failed: ${msg}` });
}

async function saveChat(userId: string, agencyId: string, tool: string, prompt: string, result: string) {
  try {
    await prisma.aIChat.create({
      data: { userId, agencyId, tool, prompt, result }
    });
  } catch (e) {
    console.error('Failed to save AI chat:', e);
  }
}

export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) return unauthorized(res);

    const chats = await prisma.aIChat.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

export const deleteChat = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.userId) return unauthorized(res);

    const { id } = req.params;
    await prisma.aIChat.delete({ where: { id, userId: user.userId } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};

export const generateCampaignIdea = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.agencyId) return unauthorized(res);

    const { clientName, industry, budget, goals, prompt, context } = req.body;
    const input = prompt || context || (clientName ? `${clientName} — ${industry || 'General'}` : '');

    if (!input) return badRequest(res, 'Provide a prompt, or clientName + industry.');

    const systemPrompt = `You are a world-class influencer marketing strategist at Adrex Media. Generate creative, data-driven campaign briefs. Return your response as clear, well-formatted text with headings, bullet points, and sections. Do NOT return JSON. Use markdown-style formatting with **bold** for emphasis.`;

    let userPrompt: string;
    if (clientName && industry) {
      userPrompt = `Create a detailed campaign brief:
Client: ${clientName}
Industry: ${industry}
Budget: ${budget ? `₹${budget}` : 'Not specified'}
Goals: ${goals || 'Brand awareness and conversions'}

Include these sections:
- Campaign Name (catchy, under 6 words)
- Tagline
- Concept Description (2-3 sentences)
- Target Audience
- Recommended Platforms
- Content Pillars (3 pillars)
- KPIs to Track (3-5 metrics)`;
    } else {
      userPrompt = `Create a detailed campaign brief for: ${input}

Include these sections:
- Campaign Name (catchy, under 6 words)
- Tagline
- Concept Description (2-3 sentences)
- Target Audience
- Recommended Platforms
- Content Pillars (3 pillars)
- KPIs to Track (3-5 metrics)`;
    }

    const result = await aiService.chat({
      systemPrompt,
      userPrompt,
      temperature: 0.8,
      maxTokens: 1500,
    });

    const trimmed = result.content.trim();
    await saveChat(user.userId, user.agencyId, 'campaign', input, trimmed);

    return res.json({ result: trimmed });
  } catch (error: any) {
    return serverError(res, error, 'campaign-idea');
  }
};

export const generateCaption = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.agencyId) return unauthorized(res);

    const { prompt, context } = req.body;
    const input = prompt || context || '';
    if (!input) return badRequest(res, 'A prompt describing the content is required.');

    const result = await aiService.chat({
      systemPrompt: `You are a viral social media copywriting expert. Generate 3 engaging, platform-optimized captions with relevant hashtags. Be conversational, trendy, and engaging.`,
      userPrompt: `Write 3 captions for: ${input}\n\nNumber each caption clearly. Include relevant hashtags.`,
      temperature: 0.9,
      maxTokens: 1000,
    });

    const trimmed = result.content.trim();
    await saveChat(user.userId, user.agencyId, 'caption', input, trimmed);

    return res.json({ result: trimmed });
  } catch (error: any) {
    return serverError(res, error, 'caption');
  }
};

export const generateOutreachMessage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.agencyId) return unauthorized(res);

    const { prompt, context, influencerName, niche, platform, campaignName } = req.body;
    const input = prompt || context || '';

    let userPrompt: string;
    if (influencerName) {
      userPrompt = `Write a personalized outreach message:
Influencer: ${influencerName}
Niche: ${niche || 'Content Creator'}
Platform: ${platform || 'Instagram'}
Campaign: ${campaignName || 'Brand Partnership'}

Write both a DM version (short, casual) and an Email version (professional, detailed). Be warm and specific.`;
    } else if (input) {
      userPrompt = `Write a compelling influencer outreach message for: ${input}\n\nInclude both a DM version and an Email version.`;
    } else {
      return badRequest(res, 'Provide a prompt/context or influencerName.');
    }

    const result = await aiService.chat({
      systemPrompt: `You are a professional influencer relationship manager at Adrex Media. Write compelling, personalized outreach messages that get replies. Be warm, professional, and specific with clear CTAs.`,
      userPrompt,
      temperature: 0.8,
      maxTokens: 1200,
    });

    const trimmed = result.content.trim();
    await saveChat(user.userId, user.agencyId, 'outreach', input, trimmed);

    return res.json({ result: trimmed });
  } catch (error: any) {
    return serverError(res, error, 'outreach');
  }
};

export const generateStrategy = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.agencyId) return unauthorized(res);

    const { prompt, context } = req.body;
    const input = prompt || context || '';
    if (!input) return badRequest(res, 'Describe your business or challenge for strategy advice.');

    const result = await aiService.chat({
      systemPrompt: `You are a world-class influencer & performance marketing strategist at Adrex Media. Provide detailed, actionable strategy recommendations with specific steps, timelines, and metrics.`,
      userPrompt: `Create a comprehensive strategy for: ${input}\n\nInclude: platform strategy, content pillars, influencer tier recommendations, budget allocation, KPIs to track, and a 30-60-90 day roadmap.`,
      temperature: 0.75,
      maxTokens: 2000,
    });

    const trimmed = result.content.trim();
    await saveChat(user.userId, user.agencyId, 'strategy', input, trimmed);

    return res.json({ result: trimmed });
  } catch (error: any) {
    return serverError(res, error, 'strategy');
  }
};

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.agencyId) return unauthorized(res);

    const { prompt } = req.body;
    if (!prompt) return badRequest(res, 'A message is required.');

    const result = await aiService.chat({
      systemPrompt: `You are the Adrex Media AI assistant — an expert in influencer marketing, campaign management, team coordination, finance, and agency operations. Be concise, professional, and provide actionable advice. Use bullet points and clear formatting.`,
      userPrompt: prompt,
      temperature: 0.7,
      maxTokens: 1500,
    });

    const trimmed = result.content.trim();
    await saveChat(user.userId, user.agencyId, 'chat', prompt, trimmed);

    return res.json({ result: trimmed, response: trimmed });
  } catch (error: any) {
    return serverError(res, error, 'chat');
  }
};

export const generateWorkflowSuggestions = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.agencyId) return unauthorized(res);

    const { campaignName, description, platform } = req.body;
    const campaignInput = campaignName || req.body.prompt || req.body.context || '';
    if (!campaignInput) return badRequest(res, 'Campaign Name is required.');

    const result = await aiService.chat({
      systemPrompt: `You are an expert operations manager at a world-class influencer marketing agency. Generate a prioritized 3-step action workflow for setting up a campaign. Respond only in clear markdown bullet points with headers.`,
      userPrompt: `Generate a 3-step action workflow for:
Campaign: ${campaignInput}
Description: ${description || 'Not specified'}
Platform: ${platform || 'Instagram/TikTok'}`,
      temperature: 0.7,
      maxTokens: 800
    });

    const trimmed = result.content.trim();
    await saveChat(user.userId, user.agencyId, 'workflow', campaignInput, trimmed);

    return res.json({ result: trimmed });
  } catch (error: any) {
    return serverError(res, error, 'workflow');
  }
};

export const generateContentCalendar = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user?.agencyId) return unauthorized(res);

    const { campaignName, durationWeeks, platforms } = req.body;
    const campaignInput = campaignName || req.body.prompt || req.body.context || '';
    if (!campaignInput) return badRequest(res, 'Campaign Name is required.');

    const result = await aiService.chat({
      systemPrompt: `You are an expert social media content coordinator. Generate a structured weekly content calendar for a marketing campaign. Return the response as a valid JSON array of objects representing days. Each object MUST have keys: "day" (e.g. "Monday"), "platform" (e.g. "Instagram"), "topic" (short title), "format" (e.g. "Reel"), and "description" (brief concept). Output ONLY the raw JSON string, nothing else. Do not include markdown formatting or wrapping code blocks in your output.`,
      userPrompt: `Generate a structured calendar for:
Campaign: ${campaignInput}
Duration: ${durationWeeks || 1} week(s)
Platforms: ${platforms ? (Array.isArray(platforms) ? platforms.join(', ') : platforms) : 'Instagram'}`,
      temperature: 0.75,
      maxTokens: 1500
    });

    const trimmed = result.content.trim();
    await saveChat(user.userId, user.agencyId, 'calendar', campaignInput, trimmed);

    return res.json({ result: trimmed });
  } catch (error: any) {
    return serverError(res, error, 'content-calendar');
  }
};

import { Request, Response } from 'express';
import { aiService } from '../services/aiService';

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

    return res.json({ result: result.content.trim() });
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

    return res.json({ result: result.content.trim() });
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

    return res.json({ result: result.content.trim() });
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

    return res.json({ result: result.content.trim() });
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

    return res.json({ result: result.content.trim(), response: result.content.trim() });
  } catch (error: any) {
    return serverError(res, error, 'chat');
  }
};

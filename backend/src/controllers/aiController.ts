import { Request, Response } from 'express';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.1-8b-instant';

export const generateCampaignIdea = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { clientName, industry, budget, goals, prompt, context } = req.body;

    let promptText: string;

    if (prompt || context) {
      const input = prompt || context;
      promptText = `You are a world-class influencer marketing strategist. Based on the following request, generate a creative and detailed campaign brief. Return ONLY a JSON object with no markdown or extra text.

Request: ${input}

Return this exact JSON structure:
{
  "name": "Catchy campaign name (under 6 words)",
  "tagline": "One-line campaign tagline",
  "description": "A compelling 2-3 sentence description of the campaign concept.",
  "targetAudience": "Specific audience description",
  "recommendedPlatforms": ["platform1", "platform2"],
  "contentPillars": ["pillar1", "pillar2", "pillar3"],
  "kpis": ["KPI 1", "KPI 2", "KPI 3"]
}`;
    } else {
      if (!clientName || !industry) {
        return res.status(400).json({ error: 'clientName and industry are required.' });
      }

      promptText = `You are a world-class influencer marketing strategist. Generate a creative and detailed campaign brief for a client. Return ONLY a JSON object with no markdown or extra text.

Client: ${clientName}
Industry: ${industry}
Budget: ${budget ? `₹${budget}` : 'Not specified'}
Goals: ${goals || 'Brand awareness and conversions'}

Return this exact JSON structure:
{
  "name": "Catchy campaign name (under 6 words)",
  "tagline": "One-line campaign tagline",
  "description": "A compelling 2-3 sentence description of the campaign concept.",
  "targetAudience": "Specific audience description",
  "recommendedPlatforms": ["platform1", "platform2"],
  "contentPillars": ["pillar1", "pillar2", "pillar3"],
  "kpis": ["KPI 1", "KPI 2", "KPI 3"]
}`;
    }

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: promptText }],
      temperature: 0.8,
      max_tokens: 600,
    });

    const raw = completion.choices[0].message.content ?? '{}';
    
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: 'AI returned invalid response.' });
    
    const result = JSON.parse(jsonMatch[0]);
    res.json(result);

  } catch (error: any) {
    console.error('Groq AI Error:', error?.status, error?.message, error?.response?.data || '');
    res.status(500).json({ error: `AI generation failed: ${error?.message || 'Unknown error'}` });
  }
};

export const draftOutreachEmail = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { influencerName, niche, platform, campaignName, agencyName } = req.body;

    if (!influencerName) {
      return res.status(400).json({ error: 'influencerName is required.' });
    }

    const prompt = `You are a professional influencer marketing manager. Write a short, personalized, and compelling outreach email to an influencer. Be friendly, professional, and concise. Return ONLY plain text — no subject line label, no markdown.

Influencer: ${influencerName}
Niche: ${niche || 'Content Creator'}
Platform: ${platform || 'Instagram'}
Campaign: ${campaignName || 'Brand Partnership'}
Agency: ${agencyName || 'Adrex Media Agency'}

Write the email body (2-3 short paragraphs). Start with "Hi ${influencerName}," and end with the agency name signature.`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.75,
      max_tokens: 400,
    });

    const emailBody = completion.choices[0].message.content ?? '';
    res.json({ email: emailBody.trim() });

  } catch (error: any) {
    console.error('Groq AI Error (outreach):', error?.status, error?.message);
    res.status(500).json({ error: `AI generation failed: ${error?.message || 'Unknown error'}` });
  }
};

export const generateTaskBreakdown = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { campaignName, campaignDescription } = req.body;

    if (!campaignName) {
      return res.status(400).json({ error: 'campaignName is required.' });
    }

    const prompt = `You are a campaign project manager. Break down this campaign into actionable tasks for an influencer marketing agency. Return ONLY a JSON array with no markdown.

Campaign: ${campaignName}
Description: ${campaignDescription || 'Standard influencer marketing campaign'}

Return exactly this structure (5-7 tasks):
[
  {"title": "Task title", "priority": "HIGH", "assignee": ""},
  {"title": "Task title", "priority": "MEDIUM", "assignee": ""}
]

Priority must be HIGH, MEDIUM, or LOW.`;

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 500,
    });

    const raw = completion.choices[0].message.content ?? '[]';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return res.status(500).json({ error: 'AI returned invalid response.' });

    const tasks = JSON.parse(jsonMatch[0]);
    res.json({ tasks });

  } catch (error: any) {
    console.error('Groq AI Error (tasks):', error?.status, error?.message);
    res.status(500).json({ error: `AI generation failed: ${error?.message || 'Unknown error'}` });
  }
};

export const generateCaption = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { prompt, context } = req.body;
    const input = prompt || context || '';
    if (!input) return res.status(400).json({ error: 'Prompt is required.' });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: `You are a viral social media expert. Generate 3 engaging captions with relevant hashtags for:\n\n${input}\n\nFormat each caption clearly numbered. Make them conversational, engaging, and platform-optimized.` }],
      temperature: 0.9,
      max_tokens: 500,
    });
    const result = completion.choices[0].message.content ?? '';
    res.json({ result: result.trim() });
  } catch (error: any) {
    console.error('Groq AI Error (caption):', error?.status, error?.message);
    res.status(500).json({ error: `AI generation failed: ${error?.message || 'Unknown error'}` });
  }
};

export const generateStrategy = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { prompt, context } = req.body;
    const input = prompt || context || '';
    if (!input) return res.status(400).json({ error: 'Context is required.' });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: `You are a world-class influencer & performance marketing strategist. Provide a detailed, actionable strategy recommendation for:\n\n${input}\n\nInclude: Platform strategy, content pillars, influencer tier recommendations, budget allocation advice, KPIs to track, and a 30-60-90 day roadmap.` }],
      temperature: 0.75,
      max_tokens: 1000,
    });
    const result = completion.choices[0].message.content ?? '';
    res.json({ result: result.trim() });
  } catch (error: any) {
    console.error('Groq AI Error (strategy):', error?.status, error?.message);
    res.status(500).json({ error: `AI generation failed: ${error?.message || 'Unknown error'}` });
  }
};

export const generateOutreachMessage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { prompt, context } = req.body;
    const input = prompt || context || '';
    if (!input) return res.status(400).json({ error: 'Context is required.' });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: `You are a professional influencer relationship manager. Write a compelling, personalized outreach message (both a DM version and email version) for:\n\n${input}\n\nMake it warm, professional, specific, and include a clear call-to-action. Format clearly with DM and Email sections.` }],
      temperature: 0.8,
      max_tokens: 600,
    });
    const result = completion.choices[0].message.content ?? '';
    res.json({ result: result.trim() });
  } catch (error: any) {
    console.error('Groq AI Error (outreach msg):', error?.status, error?.message);
    res.status(500).json({ error: `AI generation failed: ${error?.message || 'Unknown error'}` });
  }
};

export const chatWithAI = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.agencyId) return res.status(401).json({ error: 'Unauthorized' });

    const { prompt, context } = req.body;
    const input = prompt || '';
    if (!input) return res.status(400).json({ error: 'Prompt is required.' });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: `You are a helpful AI assistant for Adrex Media, an influencer and performance marketing agency management platform. Answer questions about agency operations, campaign management, team coordination, finance, and marketing strategy. Be concise, professional, and actionable.\n\nUser question: ${input}` }],
      temperature: 0.7,
      max_tokens: 500,
    });
    const result = completion.choices[0].message.content ?? '';
    res.json({ result: result.trim(), response: result.trim() });
  } catch (error: any) {
    console.error('Groq AI Error (chat):', error?.status, error?.message);
    res.status(500).json({ error: `AI chat failed: ${error?.message || 'Unknown error'}` });
  }
};


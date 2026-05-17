import Groq from 'groq-sdk';

export interface AIResponse {
  content: string;
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

export interface AIRequest {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

class AIService {
  private groq: Groq | null = null;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    }
  }

  isConfigured(): boolean {
    return !!this.groq;
  }

  async chat(request: AIRequest): Promise<AIResponse> {
    if (!this.groq) {
      throw new Error('GROQ_API_KEY is not configured. Add it to your environment variables.');
    }

    const models = [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
    ];

    for (const model of models) {
      try {
        const completion = await this.groq.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: request.userPrompt },
          ],
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 1024,
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from AI');

        return {
          content,
          model,
          usage: completion.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
      } catch (error: any) {
        const isRateLimit = error?.status === 429;
        const isModelNotFound = error?.status === 404;
        const isLastModel = model === models[models.length - 1];

        if (!isRateLimit && !isModelNotFound && !isLastModel) {
          continue;
        }

        if (isLastModel) {
          throw error;
        }

        console.warn(`Model ${model} failed (${error?.status}), trying next...`);
      }
    }

    throw new Error('All AI models failed');
  }
}

export const aiService = new AIService();

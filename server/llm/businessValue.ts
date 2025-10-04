import { OpenAI } from 'openai';
import { z } from 'zod';
import { businessSystemPrompt, buildBusinessValuePrompt } from '@/prompts/businessValue';

const BusinessValueSchema = z.object({
  score: z.number(),
  narrative: z.string()
});

export type BusinessValueResult = z.infer<typeof BusinessValueSchema>;

export interface BusinessValueOptions {
  timeRequired: string;
  frequency: string;
  stakeholder: string;
}

export async function runBusinessValue(options: BusinessValueOptions): Promise<BusinessValueResult> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL ?? undefined
  });
  const prompt = buildBusinessValuePrompt(options);
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: businessSystemPrompt },
    { role: 'user', content: prompt }
  ];
  const completion = await openai.chat.completions.create({
    messages,
    model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4.1-mini',
    temperature: 0.1,
    top_p: 0.95,
    response_format: { type: 'json_object' },
    stream: false
  });
  const raw = completion.choices[0]?.message?.content ?? '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const cleaned = raw
      .replace(/^```json\n?/i, '')
      .replace(/```$/, '')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');
    parsed = JSON.parse(cleaned);
  }
  const result = BusinessValueSchema.parse(parsed);
  return result;
}
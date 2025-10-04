import { OpenAI } from 'openai';
import { z } from 'zod';
import { buildToolPrompt } from '@/prompts/toolsAutomation';

const ToolsSchema = z.object({
  recommendations: z.array(
    z.object({
      tool: z.string(),
      reason: z.string()
    })
  )
});

export type ToolsResult = z.infer<typeof ToolsSchema>;

export interface ToolsOptions {
  description: string;
  applications: string;
}

export async function runToolsAutomation(options: ToolsOptions): Promise<ToolsResult> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL ?? undefined
  });
  const prompt = buildToolPrompt(options);
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
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
  const result = ToolsSchema.parse(parsed);
  return result;
}
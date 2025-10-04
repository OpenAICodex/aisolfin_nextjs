import { OpenAI } from 'openai';
import { z } from 'zod';
import { createServerSupabaseClient } from '../supabase';
import { complianceSystemPrompt, buildCompliancePrompt } from '@/prompts/compliance';

/**
 * Schema describing the expected structure of the compliance analysis. This
 * matches the JSON schema defined in the prompt. Strictly validating the
 * response helps ensure downstream UI components receive predictable data.
 */
const ComplianceSchema = z.object({
  gdpr_status: z.enum(['green', 'yellow', 'red']),
  gdpr_section: z.string(),
  ai_act_status: z.enum(['ok', 'warning', 'violation']),
  ai_act_section: z.string(),
  explanations: z.object({
    gdpr: z.string(),
    ai_act: z.string()
  })
});

export type ComplianceResult = z.infer<typeof ComplianceSchema>;

interface ComplianceOptions {
  description: string;
  k?: number;
}

/**
 * Retrieves the most relevant document excerpts from the vector store using
 * Supabase’s pgvector functionality. This function expects a Postgres
 * stored procedure named `match_doc_chunks` to be available. The procedure
 * should accept the query embedding, desired match count and optional
 * document version and return the matching rows in descending similarity.
 *
 * When the procedure or pgvector is not available, an empty list is
 * returned. The calling code should handle fallback behaviour (e.g.
 * passing an empty context to the model).
 */
async function fetchExcerpts(description: string, matchCount = 8): Promise<string> {
  const supabase = createServerSupabaseClient();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  // Generate embedding for the query using OpenAI's embedding API. The
  // resulting vector will be used in a pgvector similarity search. For
  // deterministic behaviour the default model `text-embedding-3-small` is
  // specified explicitly.
  const embedResp = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: description
  });
  const embedding = embedResp.data[0]?.embedding;
  if (!embedding) return '';

  const { data, error } = await supabase.rpc('match_doc_chunks', {
    query_embedding: embedding,
    match_count: matchCount,
    doc_version: null
  });
  if (error || !data) return '';
  // Each row should include a `chunk` field containing the excerpt text
  const texts = data.map((row: any) => row.chunk as string);
  return texts.join('\n\n');
}

/**
 * Executes the compliance analysis by retrieving relevant excerpts, building
 * the full prompt and invoking the OpenAI Chat API. The function enforces
 * strict schema validation on the response and throws an error when the
 * structure does not conform.
 */
export async function runCompliance({ description, k = 8 }: ComplianceOptions): Promise<ComplianceResult> {
  const excerpts = await fetchExcerpts(description, k);
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // Setting baseURL enables local gateways; fallback to default API URL
    baseURL: process.env.OPENAI_BASE_URL ?? undefined
  });
  const prompt = buildCompliancePrompt({ excerpts, description });
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: complianceSystemPrompt },
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
    // Attempt to clean up common formatting mistakes such as trailing commas
    const cleaned = raw
      .replace(/^```json\n?/i, '')
      .replace(/```$/, '')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']');
    parsed = JSON.parse(cleaned);
  }
  const result = ComplianceSchema.parse(parsed);
  return result;
}
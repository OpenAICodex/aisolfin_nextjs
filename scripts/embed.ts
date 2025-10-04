#!/usr/bin/env ts-node
import fs from 'fs';
import { parse } from 'pdf-parse';
import { OpenAI } from 'openai';
import { createServerSupabaseClient } from '../server/supabase';

/**
 * This script demonstrates how to ingest a PDF document, split it into
 * overlapping chunks, create embeddings using OpenAI and write them to
 * Supabase. It is intended to be run manually by an administrator when
 * uploading a new regulation document. Real‐world usage should include
 * error handling and concurrency controls.
 */
async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: embed.ts <PDF file>');
    process.exit(1);
  }
  const buffer = fs.readFileSync(file);
  const data = await parse(buffer);
  // Simple splitter: break text into ~1000 character chunks with 200 char overlap
  const chunks: string[] = [];
  const fullText = data.text.replace(/\n+/g, '\n').trim();
  const chunkSize = 1000;
  const overlap = 200;
  for (let i = 0; i < fullText.length; i += chunkSize - overlap) {
    chunks.push(fullText.slice(i, i + chunkSize));
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = createServerSupabaseClient();
  // Create new document record
  const { data: docRow, error: docError } = await supabase
    .from('documents')
    .insert({
      version: Date.now(),
      title: file,
      file_url: file,
      is_active: false
    })
    .select()
    .single();
  if (docError || !docRow) {
    console.error('Failed to create document', docError);
    process.exit(1);
  }
  // Generate embeddings and insert chunks
  for (const chunk of chunks) {
    const embedResp = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
      input: chunk
    });
    const vector = embedResp.data[0].embedding;
    await supabase.from('doc_chunks').insert({
      doc_id: docRow.id,
      chunk,
      embedding: vector,
      meta: {}
    });
  }
  console.log(`Embedded ${chunks.length} chunks for document ${file}`);
}
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
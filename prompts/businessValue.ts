/**
 * Business value prompt instructions. The template below instructs the model to
 * return a numeric score along with a narrative. The score should be a
 * floating‑point number between 0 and 100 representing the overall value of
 * automating the described process.
 */

export const businessSystemPrompt: string =
  'Du bist ein erfahrener Business-Analyst.';

export function buildBusinessValuePrompt({
  timeRequired,
  frequency,
  stakeholder
}: {
  timeRequired: string;
  frequency: string;
  stakeholder: string;
}): string {
  return [
    'Du bist ein Analyst. Berechne einen Business-Value-Score aus:',
    `- time_required: ${timeRequired}`,
    `- frequency: ${frequency}`,
    `- stakeholder: ${stakeholder}`,
    '',
    'Gib NUR JSON zurück:',
    '{',
    '  "score": <float>,',
    '  "narrative": "<string>"',
    '}',
    ''
  ].join('\n');
}
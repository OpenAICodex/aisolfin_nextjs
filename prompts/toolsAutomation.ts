/**
 * Tool recommendation prompt. The model is asked to recommend three tools
 * including reasons based on the provided process description and any
 * existing applications used. The format mirrors the original Streamlit
 * implementation and instructs the model to return strictly formatted JSON.
 */

export function buildToolPrompt({
  description,
  applications
}: {
  description: string;
  applications: string;
}): string {
  return [
    'Du bist ein Automation-Architekt. Empfiehl die Top-3 Tools (mit Gründen) für:',
    `- Beschreibung: """${description}"""`,
    `- Bestehende Apps: ${applications || '-'}`,
    '',
    'Gib NUR JSON zurück:',
    '{',
    '  "recommendations": [',
    '    { "tool": "<string>", "reason": "<string>" },',
    '    { "tool": "<string>", "reason": "<string>" },',
    '    { "tool": "<string>", "reason": "<string>" }',
    '  ]',
    '}',
    ''
  ].join('\n');
}
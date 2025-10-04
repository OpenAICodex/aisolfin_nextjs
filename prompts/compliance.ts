/**
 * The compliance prompts used when querying the OpenAI Chat API. These
 * templates mirror the logic found in the original Streamlit application and
 * should remain editable via the admin interface. Do not change the content
 * directly here – instead modify them through the admin settings stored in
 * the database.
 */

export const complianceSystemPrompt: string =
  'Du bist ein Compliance-Experte, der *ausschließlich* auf den folgenden Gesetzestext-Auszügen aus der DSGVO und dem EU AI Act basiert.';

/**
 * Returns the full prompt for the compliance analysis. The `excerpts` come
 * from the most similar document chunks retrieved via vector search. The
 * `description` is the user-provided process description. The JSON schema
 * embedded in the prompt instructs the model to return a well-structured
 * response.
 */
export function buildCompliancePrompt({
  excerpts,
  description
}: {
  excerpts: string;
  description: string;
}): string {
  return [
    'Auszüge:',
    excerpts,
    '',
    '1) Entscheide, ob KI verwendet wird (“yes”/“no”) und begründe kurz.',
    '2) Klassifiziere DSGVO:',
    '   - gdpr_status: "green" / "yellow" / "red"',
    '   - gdpr_section: exakte Artikelnummer oder "-"',
    '3) Klassifiziere EU AI Act:',
    '   - Wenn KI verwendet: ai_act_status: "ok"/"warning"/"violation", plus ai_act_section',
    '   - Sonst: ai_act_status: "ok", ai_act_section: "-"',
    '4) Gib NUR JSON zurück mit:',
    '{',
    '  "gdpr_status":    "<string>",',
    '  "gdpr_section":   "<string>",',
    '  "ai_act_status":  "<string>",',
    '  "ai_act_section": "<string>",',
    '  "explanations": {',
    '    "gdpr":   "<string>",',
    '    "ai_act": "<string>"',
    '  }',
    '}',
    '',
    'Bewerte: """' + description + '"""'
  ].join('\n');
}
"use client";

import React, { useState } from 'react';

/**
 * Multi‑step evaluation form that mimics the design of the reference
 * AI Solution Finder app. The form is split into four steps: process
 * description, additional details, confirmation and API submission, and
 * results. Each step is wrapped in a card with a thick black border and
 * subtle drop shadow. Navigation controls appear at the bottom of the
 * card. A progress bar at the top of the card reflects the current
 * step. Once the evaluation is submitted the results are displayed in
 * the final step.
 */
interface EvaluationResult {
  compliance: {
    gdpr_status: string;
    gdpr_section: string;
    ai_act_status: string;
    ai_act_section: string;
    explanations: { gdpr: string; ai_act: string };
  };
  businessValue: {
    score: number;
    narrative: string;
  };
  tools: {
    recommendations: { tool: string; reason: string }[];
  };
}

const timeOptions = ['< 15 min', '15–30 min', '30–60 min', '1–2 h', '> 2 h'];
const frequencyOptions = ['täglich', 'mehrmals pro Woche', 'wöchentlich', 'monatlich', 'seltener'];
const stakeholderOptions = ['mich', 'mein Team', 'meinen Chef', 'Kunden', 'andere'];

// Application categories and prefilled software options. These lists are
// inspired by the original reference site. Feel free to extend or
// refine them as needed. When "Alle Kategorien" is selected, all
// applications across categories will be shown.
const appCategories: { [category: string]: string[] } = {
  'Office & Collaboration': [
    'Microsoft 365 Suite (Excel, Word, PowerPoint, Outlook)',
    'Google Workspace (Sheets, Docs, Slides, Gmail, Drive)',
    'Apple Numbers | Pages | Keynote',
    'LibreOffice',
    'Notion',
    'Confluence',
    'Coda',
    'Miro',
    'Figma',
    'Microsoft Teams',
    'Slack',
    'Zoom'
  ],
  'Projekt- & Work-Management': ['Jira', 'Asana', 'Trello', 'Monday.com', 'Basecamp', 'ClickUp'],
  'CRM & Sales': ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho CRM', 'Zendesk Sell'],
  'Marketing-Automation': ['Mailchimp', 'HubSpot Marketing', 'ActiveCampaign', 'Klaviyo'],
  'ERP & Finance': ['SAP', 'Oracle NetSuite', 'Microsoft Dynamics 365', 'Sage', 'QuickBooks'],
  'Business Intelligence': ['Tableau', 'Power BI', 'Looker', 'Qlik Sense', 'Metabase']
};

export default function EvaluationForm() {
  const [step, setStep] = useState(1);
  const [description, setDescription] = useState('');
  // Note: applications are derived from `selectedApps` and any custom entry.
  // We provide a text input so users can add their own application if it is
  // not listed in the predefined categories. The `customApp` state holds the
  // value of this input until the user adds it to the selected apps list.
  // Track the currently selected category for filtering apps in step 2.
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle Kategorien');
  // Selected apps for step 2. We derive the applications value from this
  // array when submitting the evaluation.
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  // Temporarily holds the name of a custom application entered by the user.
  const [customApp, setCustomApp] = useState('');
  const [timeRequired, setTimeRequired] = useState(timeOptions[0]);
  const [frequency, setFrequency] = useState(frequencyOptions[0]);
  const [stakeholder, setStakeholder] = useState(stakeholderOptions[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  /**
   * Advance to the next step. When arriving at the submission step
   * (step 3), this function triggers the API call and moves to the
   * results step once complete. If validation fails at any step the
   * function sets an error and returns early.
   */
  const handleNext = async () => {
    setError(null);
    // Validation for step 1: require at least 20 characters
    if (step === 1 && description.trim().length < 20) {
      setError('Bitte geben Sie mindestens 20 Zeichen ein, um fortzufahren.');
      return;
    }
    // Validation for step 2: no specific requirements
    if (step === 3) {
      // Trigger evaluation API call
      setLoading(true);
      try {
        const res = await fetch('/api/evaluate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            applications: selectedApps.join(', '),
            timeRequired,
            frequency,
            stakeholder
          })
        });
        if (!res.ok) {
          const { error: apiError } = await res.json();
          setError(apiError || 'Analyse fehlgeschlagen');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setResult(data as EvaluationResult);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Unerwarteter Fehler');
        setLoading(false);
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  /** Move back one step. */
  const handlePrev = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  /** Render the progress bar proportionally to the current step. */
  const renderProgress = () => {
    const percent = ((step - 1) / 3) * 100;
    return (
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
        <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400" style={{ width: `${percent}%` }}></div>
      </div>
    );
  };

  /** Content for each step of the wizard. */
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-500 text-white flex items-center justify-center rounded-md border-2 border-black">
                📄
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Beschreiben Sie Ihren Prozess</h2>
            <p className="text-center text-gray-700 mb-6 max-w-xl mx-auto">
              Erzählen Sie uns möglichst ausführlich über den Prozess, den Sie optimieren möchten. Je detaillierter
              Ihre Beschreibung, desto präziser wird unsere Analyse.
            </p>
            <label className="block mb-2 font-medium">Prozessbeschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              className="w-full rounded-md border-2 border-black p-3 bg-white focus:outline-none"
              placeholder="Beschreibe deinen Prozess möglichst ausführlich. Mach dir keine Gedanken zur Rechtschreibung oder Grammatik. Tippe einfach drauf los…"
            ></textarea>
            {/* Tip card */}
            <div className="border-2 border-black rounded-md p-4 mt-4 bg-gray-50">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <span className="text-blue-600">💡</span>
                Tipp für eine bessere Analyse:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-2">
                <li>Welche Schritte sind Teil des Prozesses?</li>
                <li>Welche Tools oder Systeme verwenden Sie?</li>
                <li>Wo entstehen Wartezeiten oder Unterbrechungen?</li>
                <li>Was sind die häufigsten Probleme oder Fehlerquellen?</li>
              </ul>
            </div>
            <p className="text-right text-xs text-gray-600 mt-2">
              {description.trim().length} Zeichen (mindestens 20 für die nächste Stufe)
            </p>
          </>
        );
      case 2:
        return (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-500 text-white flex items-center justify-center rounded-md border-2 border-black">
                ⚙️
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Weitere Details</h2>
            <p className="text-center text-gray-700 mb-6 max-w-xl mx-auto">
              Wähle alle Tools und Systeme aus, die in deinem Prozess verwendet werden, und gib Zeitaufwand und Häufigkeit an.
            </p>
            {/* Selected applications chips */}
            {selectedApps.length > 0 && (
              <div className="mb-4">
                <p className="font-medium mb-1">Ausgewählte Anwendungen ({selectedApps.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApps.map((app) => (
                    <button
                      key={app}
                      type="button"
                      onClick={() => {
                        setSelectedApps(selectedApps.filter((a) => a !== app));
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white rounded-full border-2 border-black text-sm"
                    >
                      <span>{app}</span>
                      <span className="ml-1">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Categories navigation */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                className={`px-3 py-1 rounded-md border-2 border-black text-sm font-medium ${selectedCategory === 'Alle Kategorien' ? 'bg-purple-600 text-white' : 'bg-white'}`}
                onClick={() => setSelectedCategory('Alle Kategorien')}
              >
                Alle Kategorien
              </button>
              {Object.keys(appCategories).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`px-3 py-1 rounded-md border-2 border-black text-sm font-medium ${selectedCategory === cat ? 'bg-purple-600 text-white' : 'bg-white'}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Applications list */}
            <div className="h-52 overflow-y-auto border-2 border-black rounded-md p-2 bg-gray-50 mb-6">
              {(() => {
                // Determine list of applications to display based on selected category.
                const apps: string[] = selectedCategory === 'Alle Kategorien'
                  ? Object.values(appCategories).flat()
                  : appCategories[selectedCategory] ?? [];
                return apps.map((app) => {
                  const selected = selectedApps.includes(app);
                  return (
                    <button
                      key={app}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          setSelectedApps(selectedApps.filter((a) => a !== app));
                        } else {
                          setSelectedApps([...selectedApps, app]);
                        }
                      }}
                      className={`flex justify-between items-center w-full mb-2 px-3 py-2 rounded-md border-2 border-black text-sm ${selected ? 'bg-purple-600 text-white' : 'bg-white'}`}
                    >
                      <span>{app}</span>
                      {selected && <span>✓</span>}
                    </button>
                  );
                });
              })()}
            </div>
            {/* Other details: time required, frequency, stakeholder */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-medium mb-1">Zeitaufwand pro Ausführung</label>
                <select
                  value={timeRequired}
                  onChange={(e) => setTimeRequired(e.target.value)}
                  className="w-full rounded-md border-2 border-black p-2 bg-white focus:outline-none"
                >
                  {timeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Häufigkeit</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-md border-2 border-black p-2 bg-white focus:outline-none"
                >
                  {frequencyOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium mb-1">Betroffene Person(en)</label>
                <select
                  value={stakeholder}
                  onChange={(e) => setStakeholder(e.target.value)}
                  className="w-full rounded-md border-2 border-black p-2 bg-white focus:outline-none"
                >
                  {stakeholderOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Custom application entry */}
            <div className="mt-6">
              <label className="block font-medium mb-1">Andere Anwendung</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customApp}
                  onChange={(e) => setCustomApp(e.target.value)}
                  placeholder="Name der Anwendung eingeben"
                  className="flex-1 rounded-md border-2 border-black p-2 bg-white focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!customApp.trim()}
                  onClick={() => {
                    const trimmed = customApp.trim();
                    if (trimmed && !selectedApps.includes(trimmed)) {
                      setSelectedApps([...selectedApps, trimmed]);
                    }
                    setCustomApp('');
                  }}
                  className={`px-3 py-2 rounded-md border-2 border-black font-medium ${customApp.trim() ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600' : 'bg-gray-300 text-gray-500'}`}
                >
                  Hinzufügen
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">Füge weitere Anwendungen hinzu, die nicht in der Liste vorhanden sind.</p>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-500 text-white flex items-center justify-center rounded-md border-2 border-black">
                ✅
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Überprüfen & Bestätigen</h2>
            <p className="text-center text-gray-700 mb-6 max-w-xl mx-auto">
              Bitte überprüfen Sie Ihre Angaben. Wenn alles korrekt ist, starten Sie die Analyse.
            </p>
            <div className="bg-gray-50 border-2 border-black rounded-md p-4 space-y-2 text-sm">
              <p><strong>Prozessbeschreibung:</strong> {description}</p>
              {selectedApps.length > 0 && <p><strong>Anwendungen:</strong> {selectedApps.join(', ')}</p>}
              <p><strong>Zeitaufwand:</strong> {timeRequired}</p>
              <p><strong>Häufigkeit:</strong> {frequency}</p>
              <p><strong>Betroffene:</strong> {stakeholder}</p>
            </div>
            {loading && <p className="mt-4 text-center text-purple-600">Analyse läuft…</p>}
            {error && <p className="mt-4 text-center text-red-600">{error}</p>}
          </>
        );
      case 4:
        return result ? (
          <>
            {/* Step icon and heading */}
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-500 text-white flex items-center justify-center rounded-md border-2 border-black">
                📊
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Analyseergebnisse</h2>
            <p className="text-center text-gray-700 mb-6 max-w-xl mx-auto">
              Hier sind deine Ergebnisse. Werte zur Compliance, dem Business Value und Tool‑Empfehlungen.
            </p>
            {/* Compliance section */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {/* EU AI Act card */}
              <div className="p-4 border-4 border-black rounded-lg bg-white shadow-md">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">🛡 EU AI Act</h4>
                {/* Traffic light representation */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="space-y-1">
                    {[0, 1, 2, 3].map((idx) => {
                      // Determine which light should be active based on the
                      // AI Act status. The compliance API returns
                      // 'ok' (minimal risk), 'warning' (limited/high risk) or 'violation'
                      // (unlawful/illegal). We also handle legacy `ai_act_tier` values.
                      let activeIndex = 3;
                      let color = 'bg-green-500';
                      const status = (result.compliance as any).ai_act_status ?? (result.compliance as any).ai_act_tier;
                      if (status && typeof status === 'string') {
                        const lower = status.toLowerCase();
                        // Map the known AI Act statuses to traffic light colours. The
                        // compliance API enumerates "ok" → green, "warning" → yellow
                        // and "violation" → red. Unknown values default to green.
                        if (lower === 'violation') {
                          activeIndex = 1;
                          color = 'bg-red-500';
                        } else if (lower === 'warning') {
                          activeIndex = 2;
                          color = 'bg-yellow-400';
                        } else if (lower === 'ok') {
                          activeIndex = 3;
                          color = 'bg-green-500';
                        }
                      }
                      return (
                        <div
                          key={idx}
                          className={`w-5 h-5 rounded-full border-2 border-black ${idx === activeIndex ? color : 'bg-gray-300'}`}
                        ></div>
                      );
                    })}
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2 py-1 rounded-md text-sm font-medium text-white ${(() => {
                        const status = (result.compliance as any).ai_act_status ?? (result.compliance as any).ai_act_tier;
                        if (!status) return 'bg-gray-400';
                        const lower = status.toLowerCase();
                        if (lower === 'violation') return 'bg-red-500';
                        if (lower === 'warning') return 'bg-yellow-500';
                        if (lower === 'ok') return 'bg-green-500';
                        return 'bg-green-500';
                      })()}`}
                    >
                      {(result.compliance as any).ai_act_status ?? (result.compliance as any).ai_act_tier ?? '—'}
                    </span>
                  </div>
                </div>
                <p className="text-sm mb-2">
                  <strong>Artikel:</strong> {(result.compliance as any).ai_act_section ?? 'n/a'}
                </p>
                <p className="text-sm bg-gray-100 border border-black rounded-md p-3">
                  <strong>Begründung:</strong> {(result.compliance as any).explanations?.ai_act ?? '—'}
                </p>
              </div>
              {/* GDPR card */}
              <div className="p-4 border-4 border-black rounded-lg bg-white shadow-md">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">📜 DSGVO</h4>
                {/* Traffic light for GDPR */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="space-y-1">
                    {[0, 1, 2, 3].map((idx) => {
                      let activeIndex = 3;
                      let color = 'bg-green-500';
                      const status = (result.compliance as any).gdpr_status ?? (result.compliance as any).gdpr?.lawful_basis;
                      if (status && typeof status === 'string') {
                        const lower = status.toLowerCase();
                        // Map GDPR statuses to colours. The prompt enumerates
                        // "green", "yellow" and "red". Fall back to green for
                        // unknown values.
                        if (lower === 'red') {
                          activeIndex = 1;
                          color = 'bg-red-500';
                        } else if (lower === 'yellow') {
                          activeIndex = 2;
                          color = 'bg-yellow-400';
                        } else if (lower === 'green') {
                          activeIndex = 3;
                          color = 'bg-green-500';
                        }
                      }
                      return (
                        <div
                          key={idx}
                          className={`w-5 h-5 rounded-full border-2 border-black ${idx === activeIndex ? color : 'bg-gray-300'}`}
                        ></div>
                      );
                    })}
                  </div>
                  <div>
                    <span
                      className={`inline-block px-2 py-1 rounded-md text-sm font-medium text-white ${(() => {
                        const status = (result.compliance as any).gdpr_status ?? (result.compliance as any).gdpr?.lawful_basis;
                        if (!status) return 'bg-gray-400';
                        const lower = status.toLowerCase();
                        if (lower === 'red') return 'bg-red-500';
                        if (lower === 'yellow') return 'bg-yellow-500';
                        if (lower === 'green') return 'bg-green-500';
                        return 'bg-green-500';
                      })()}`}
                    >
                      {(result.compliance as any).gdpr_status ?? (result.compliance as any).gdpr?.lawful_basis ?? '—'}
                    </span>
                  </div>
                </div>
                <p className="text-sm mb-2">
                  <strong>Artikel:</strong> {(result.compliance as any).gdpr_section ?? (result.compliance as any).citations?.[0]?.article ?? 'n/a'}
                </p>
                <p className="text-sm bg-gray-100 border border-black rounded-md p-3">
                  <strong>Begründung:</strong> {(result.compliance as any).explanations?.gdpr ?? '—'}
                </p>
              </div>
            </div>
            {/* Business value and tools */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Business value */}
              <div className="p-4 border-4 border-black rounded-lg bg-white shadow-md">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">💡 Business Value</h4>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-4 border-black flex items-center justify-center text-3xl font-bold bg-gradient-to-b from-yellow-300 to-yellow-200">
                      {result.businessValue.score.toFixed(0)}
                    </div>
                    <span className="text-sm mt-1 text-gray-700">von 100</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm bg-gray-100 border border-black rounded-md p-3">
                      {result.businessValue.narrative}
                    </p>
                  </div>
                </div>
              </div>
              {/* Tools recommendation */}
              <div className="p-4 border-4 border-black rounded-lg bg-white shadow-md">
                <h4 className="font-semibold text-lg mb-2 flex items-center gap-2">🛠 Tool‑Empfehlung</h4>
                {result.tools.recommendations.length > 0 ? (
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    {result.tools.recommendations.map((rec, idx) => (
                      <li key={idx}>
                        <strong>{rec.tool}</strong>: {rec.reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">Keine Empfehlungen verfügbar.</p>
                )}
              </div>
            </div>
            {/* Call to action for premium analysis */}
            <div className="mt-8 p-6 border-4 border-black rounded-lg bg-gradient-to-b from-purple-50 to-purple-100 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-xl font-semibold mb-2 flex items-center gap-2">🌟 Exklusive Expertenanalyse</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Detaillierte Implementierungsempfehlungen</li>
                  <li>Spezifische Tool‑Konfigurationen</li>
                  <li>ROI‑Berechnung und Zeitsparnis‑Prognose</li>
                  <li>Schritt‑für‑Schritt Umsetzungsplan</li>
                </ul>
                {/* The consumption indicator was static and misleading.  A
                dynamic quota display should be implemented in the future
                using the rate limit information returned from the API. */}
              </div>
                <button
                  type="button"
                  className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 rounded-md border-2 border-black bg-gradient-to-r from-purple-600 to-purple-500 text-white font-medium hover:from-purple-700 hover:to-purple-600"
                >
                  Premium‑Analyse anfordern →
                </button>
            </div>
          </>
        ) : (
          <p className="text-center text-red-600">Fehler beim Laden der Ergebnisse.</p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="w-full max-w-3xl border-4 border-black rounded-xl shadow-lg bg-white p-6">
        {renderProgress()}
        {renderStepContent()}
        <div className="flex justify-between mt-8 pt-4 border-t-2 border-black">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1 || loading}
            className={`px-4 py-2 rounded-md border-2 border-black font-medium ${step === 1 || loading ? 'bg-gray-300 text-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Zurück
          </button>
          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={(step === 1 && description.trim().length < 20) || loading}
              className={`px-4 py-2 rounded-md border-2 border-black font-medium ${
                (step === 1 && description.trim().length < 20) || loading
                  ? 'bg-purple-300 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600'
              }`}
            >
              {step === 3 ? 'Analyse starten' : 'Weiter'}
            </button>
          )}
        </div>
        {step === 4 && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                // Reset the form to start a new evaluation
                setStep(1);
                setDescription('');
                setSelectedApps([]);
                setTimeRequired(timeOptions[0]);
                setFrequency(frequencyOptions[0]);
                setStakeholder(stakeholderOptions[0]);
                setResult(null);
              }}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-md border-2 border-black bg-gray-100 hover:bg-gray-200"
            >
              Neue Analyse starten
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
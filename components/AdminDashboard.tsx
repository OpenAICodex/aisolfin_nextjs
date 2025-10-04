"use client";

import React, { useState, useEffect } from 'react';

interface AdminDashboardProps {
  initialPrompts: {
    compliance?: string;
    businessValue?: string;
    toolsAutomation?: string;
  };
}

/**
 * Client component rendering the editable fields for the admin
 * dashboard.  Administrators can modify the system prompts used for
 * compliance, business value and tools analyses.  Changes are saved
 * via the `/api/admin/prompts` endpoint.  A simple status message
 * indicates success or failure.  For brevity, document uploads and
 * re‑embedding are displayed as placeholders.
 */
export default function AdminDashboard({ initialPrompts }: AdminDashboardProps) {
  const [compliance, setCompliance] = useState(initialPrompts.compliance ?? '');
  const [business, setBusiness] = useState(initialPrompts.businessValue ?? '');
  const [tools, setTools] = useState(initialPrompts.toolsAutomation ?? '');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compliancePrompt: compliance,
          businessPrompt: business,
          toolsPrompt: tools
        })
      });
      if (!res.ok) {
        const { error } = await res.json();
        setStatus(error || 'Speichern fehlgeschlagen');
      } else {
        setStatus('Gespeichert');
      }
    } catch {
      setStatus('Netzwerkfehler');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <h2 className="text-3xl font-bold">Admin Einstellungen</h2>
      <p className="text-neutral-600">Passe die Systemprompts für die drei Analysen an oder lade neue Regulierungstexte hoch.</p>
      <div className="space-y-6">
        {/* Compliance prompt */}
        <div className="border-2 border-black rounded-md p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-2">Compliance Prompt</h3>
          <textarea
            className="w-full h-32 border-2 border-black rounded-md p-2"
            value={compliance}
            onChange={(e) => setCompliance(e.target.value)}
          />
        </div>
        {/* Business value prompt */}
        <div className="border-2 border-black rounded-md p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-2">Business‑Value Prompt</h3>
          <textarea
            className="w-full h-32 border-2 border-black rounded-md p-2"
            value={business}
            onChange={(e) => setBusiness(e.target.value)}
          />
        </div>
        {/* Tools prompt */}
        <div className="border-2 border-black rounded-md p-4 bg-white shadow-sm">
          <h3 className="font-semibold mb-2">Tools/Automation Prompt</h3>
          <textarea
            className="w-full h-32 border-2 border-black rounded-md p-2"
            value={tools}
            onChange={(e) => setTools(e.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className={`inline-flex items-center px-4 py-2 rounded-md border-2 border-black font-medium ${
            saving ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600'
          }`}
        >
          {saving ? 'Speichern…' : 'Speichern'}
        </button>
        {status && <p className="text-sm mt-2 text-gray-700">{status}</p>}
        {/* Placeholder for document uploads */}
        <div className="border-2 border-black rounded-md p-4 bg-yellow-50">
          <p className="font-semibold mb-2">Dokumente & Embeddings</p>
          <p className="text-sm">Das Hochladen neuer PDFs, die Versionierung und das Re‑Embedding sind in dieser Demo nicht implementiert. Bitte implementieren Sie diese Funktionen entsprechend Ihren Anforderungen.</p>
        </div>
      </div>
    </div>
  );
}
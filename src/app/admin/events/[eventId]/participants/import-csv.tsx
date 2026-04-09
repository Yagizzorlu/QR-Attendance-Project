"use client";

import { useState } from "react";

type ImportResult = {
  totalRows: number;
  imported: number;
  skippedDuplicates: number;
};

export function ImportCsv({ eventId }: { eventId: string }) {
  const [csvText, setCsvText]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<ImportResult | null>(null);
  const [error, setError]         = useState<string | null>(null);

  async function handleImport() {
    if (!csvText.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res  = await fetch(`/api/events/${eventId}/participants/import`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ csvText }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Import başarısız.");
        return;
      }

      setResult(data.data);
      setCsvText("");
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-200">Import CSV</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Expected columns:{" "}
          <span className="font-mono text-slate-400">firstName, lastName, email, phone</span>
        </p>
      </div>

      <textarea
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder={"firstName,lastName,email,phone\nAhmet,Yılmaz,ahmet@example.com,05001234567"}
        rows={6}
        spellCheck={false}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 font-mono text-xs text-slate-200 placeholder-slate-600 outline-none resize-y transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {result && (
        <div className="flex items-center gap-4 text-xs bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
          <span className="text-green-400 font-medium">{result.imported} imported</span>
          <span className="text-slate-500">{result.skippedDuplicates} skipped</span>
          <span className="text-slate-600">{result.totalRows} total rows</span>
        </div>
      )}

      <button
        onClick={handleImport}
        disabled={loading || !csvText.trim()}
        className="self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
      >
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            İçe Aktarılıyor...
          </>
        ) : (
          "Import CSV"
        )}
      </button>
    </div>
  );
}

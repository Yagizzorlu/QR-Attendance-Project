"use client";

import { useState } from "react";

type Props = { eventId: string };
type Status = { type: "success" | "error"; message: string } | null;

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";

export function AddParticipant({ eventId }: Props) {
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState<Status>(null);
  const [form, setForm]         = useState({ firstName: "", lastName: "", email: "", phone: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/events/${eventId}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName:  form.lastName.trim(),
          email:     form.email.trim()  || undefined,
          phone:     form.phone.trim()  || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: "error", message: data.message ?? "Bir hata oluştu." });
        return;
      }

      setStatus({ type: "success", message: `${form.firstName} ${form.lastName} eklendi.` });
      setForm({ firstName: "", lastName: "", email: "", phone: "" });
      setTimeout(() => { window.location.reload(); }, 1200);
    } catch {
      setStatus({ type: "error", message: "Sunucuya ulaşılamadı." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900">
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setStatus(null); }}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-300 hover:text-white transition-colors"
      >
        <span>+ Add Participant</span>
        <span className="text-slate-600">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t border-slate-800 px-5 py-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name *" required className={inputCls} />
            <input name="lastName"  value={form.lastName}  onChange={handleChange} placeholder="Last name *"  required className={inputCls} />
            <input name="email"     value={form.email}     onChange={handleChange} placeholder="Email"                  className={inputCls} type="email" />
            <input name="phone"     value={form.phone}     onChange={handleChange} placeholder="Phone"                  className={inputCls} />
          </div>
          <p className="text-xs text-slate-600">Email veya phone en az biri zorunludur.</p>

          {status && (
            <p className={`text-sm ${status.type === "success" ? "text-green-400" : "text-red-400"}`}>
              {status.message}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {loading ? "Ekleniyor..." : "Add"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputCls =
  "w-full rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-blue-500 focus:bg-slate-800 focus:ring-2 focus:ring-blue-500/20";

export function LoginForm() {
  const router = useRouter();

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setError("E-posta veya şifre hatalı.");
        return;
      }

      router.push("/admin/events");
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* subtle grid background */}
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-5 shadow-lg shadow-blue-600/30">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">QR Attendance</h1>
          <p className="mt-1.5 text-sm text-slate-400">Admin paneline giriş yapın.</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur p-7 shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                autoFocus
                autoComplete="email"
                className={inputCls}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={inputCls}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
                <span className="shrink-0 text-base">!</span>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold tracking-wide transition-colors mt-1 shadow-lg shadow-blue-600/20"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

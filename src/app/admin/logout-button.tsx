"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router  = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-sm font-medium transition-colors"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}

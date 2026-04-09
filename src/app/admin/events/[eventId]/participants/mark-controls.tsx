"use client";

import { useState } from "react";

type Props = {
  eventId: string;
  participantId: string;
  currentPresent: boolean;
  currentAbsent: boolean;
};

type Status = "present" | "absent" | "reset";

export function MarkControls({ eventId, participantId, currentPresent, currentAbsent }: Props) {
  const [loading, setLoading] = useState(false);

  async function mark(status: Status) {
    setLoading(true);
    try {
      await fetch(`/api/events/${eventId}/participants/${participantId}/attendance-mark`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => mark("present")}
        disabled={loading}
        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 ${
          currentPresent
            ? "bg-green-500/20 text-green-400 border border-green-500/30"
            : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-green-500/40 hover:text-green-400"
        }`}
      >
        Present
      </button>
      <button
        onClick={() => mark("absent")}
        disabled={loading}
        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40 ${
          currentAbsent
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-slate-800 text-slate-400 border border-slate-700 hover:border-red-500/40 hover:text-red-400"
        }`}
      >
        Absent
      </button>
      <button
        onClick={() => mark("reset")}
        disabled={loading || (!currentPresent && !currentAbsent)}
        className="px-2.5 py-1 rounded text-xs font-medium bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300 transition-colors disabled:opacity-40"
      >
        Reset
      </button>
    </div>
  );
}

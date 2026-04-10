"use client";

import { useEffect, useState, useCallback, useRef } from "react";

type QrData = {
  eventTitle: string;
  slotStart: string;
  expiresAt: string;
  qrDataUrl: string;
  sig: string;
};

export default function QrDisplay({ eventId, initial }: { eventId: string; initial: QrData }) {
  const [data, setData]             = useState<QrData>(initial);
  const [secondsLeft, setLeft]      = useState(() => Math.max(0, Math.floor((new Date(initial.expiresAt).getTime() - Date.now()) / 1000)));
  const [refreshing, setRefreshing] = useState(false);
  const inFlight                    = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const res  = await fetch(`/api/events/${eventId}/live-qr`);
      const json = await res.json();
      if (!res.ok || !json.success) return;

      const r = json.data;
      const QRCode = (await import("qrcode")).default;
      const qrDataUrl = await QRCode.toDataURL(r.qrValue, {
        width: 320,
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" },
      });

      setData({
        eventTitle: r.eventTitle,
        slotStart:  r.slotStart,
        expiresAt:  r.expiresAt,
        qrDataUrl,
        sig: r.payload.sig,
      });
      setLeft(Math.max(0, Math.floor((new Date(r.expiresAt).getTime() - Date.now()) / 1000)));
    } finally {
      setRefreshing(false);
      inFlight.current = false;
    }
  }, [eventId]);

  /* Countdown tick */
  useEffect(() => {
    const id = setInterval(() => {
      setLeft((prev) => {
        if (prev <= 1) {
          refresh();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  function fmt(iso: string) {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">

      {/* QR image */}
      <div className="px-6 py-8 flex flex-col items-center gap-4">
        <div className={`rounded-xl border-2 ${refreshing ? "border-blue-500/50 opacity-60" : "border-slate-700"} bg-white p-4 shadow-lg transition-opacity`}>
          <img
            src={data.qrDataUrl}
            alt="Live QR code"
            width={280}
            height={280}
            className="block"
          />
        </div>

        {/* Countdown */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${secondsLeft > 10 ? "bg-green-400" : "bg-amber-400 animate-pulse"}`} />
          <span className="text-sm text-slate-400">
            {refreshing
              ? "Yenileniyor..."
              : <>Yenileniyor: <span className="font-mono font-semibold text-white">{mins}:{secs}</span></>
            }
          </span>
        </div>
      </div>

      {/* Slot Info */}
      <div className="px-6 py-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Slot Bilgisi
        </h2>
        <div className="flex flex-col gap-3">
          <Row label="Etkinlik"       value={data.eventTitle} />
          <Row label="Slot Başlangıç" value={fmt(data.slotStart)} />
          <Row label="Geçerlilik"     value={fmt(data.expiresAt)} />
        </div>
      </div>

    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-slate-400">{label}</span>
      <span className="text-sm text-slate-200 font-medium text-right break-all">{value}</span>
    </div>
  );
}

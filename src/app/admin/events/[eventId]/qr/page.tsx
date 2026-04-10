import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { QrService } from "@/server/services/qr.service";
import { LogoutButton } from "@/app/admin/logout-button";

const qrService = new QrService();

function fmt(date: Date) {
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function EventQrPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  let result;
  try {
    result = await qrService.getLiveQr(eventId);
  } catch {
    notFound();
  }

  const qrDataUrl = await QRCode.toDataURL(result.qrValue, {
    width: 320,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">

        <p className="text-xs text-slate-500 tracking-wide uppercase mb-4">
          Admin &rsaquo;{" "}
          <Link href="/admin/events" className="hover:text-slate-300 transition-colors">
            Events
          </Link>{" "}
          &rsaquo;{" "}
          <Link href={`/admin/events/${eventId}`} className="hover:text-slate-300 transition-colors">
            {result.eventTitle}
          </Link>{" "}
          &rsaquo; QR
        </p>

        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Live QR</h1>
            <p className="mt-1 text-sm text-slate-400">{result.eventTitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/events/${eventId}`}
              className="shrink-0 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Event
            </Link>
            <LogoutButton />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">

          <div className="px-6 py-8 flex justify-center">
            <div className="rounded-xl border border-slate-700 bg-white p-4 shadow-lg">
              <img
                src={qrDataUrl}
                alt="Live QR code"
                width={280}
                height={280}
                className="block"
              />
            </div>
          </div>

          <Section title="Slot Info">
            <Row label="Event"      value={result.eventTitle} />
            <Row label="Slot Start" value={fmt(result.slotStart)} />
            <Row label="Expires At" value={fmt(result.expiresAt)} />
            <Row label="Signature"  value={result.payload.sig} mono />
          </Section>


        </div>

      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-sm text-slate-400">{label}</span>
      <span className={`text-sm text-slate-200 font-medium text-right break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

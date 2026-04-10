import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { EventService } from "@/server/services/event.service";
import { LogoutButton } from "@/app/admin/logout-button";
import { verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const eventService = new EventService();

function fmt(date: Date) {
  return date.toLocaleString("tr-TR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function eventStatus(startsAt: Date, endsAt: Date) {
  const now = new Date();
  if (now < startsAt) return { label: "Upcoming",  color: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
  if (now > endsAt)   return { label: "Completed", color: "text-slate-400 bg-slate-400/10 border-slate-700" };
  return               { label: "Active",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const cookieStore = await cookies();
  const token       = cookieStore.get("session")?.value;
  const session     = token ? verifySession(token) : null;
  if (!session) redirect("/login");

  const { eventId } = await params;

  let event;
  try {
    event = await eventService.getEventById(eventId);
  } catch {
    notFound();
  }

  const status = eventStatus(event.startsAt, event.endsAt);
  const isActive = status.label === "Active";

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/admin/events" className="hover:text-slate-300 transition-colors">Events</Link>
          <span>/</span>
          <span className="text-slate-400 truncate">{event.title}</span>
        </div>

        {/* Page header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-3xl font-bold text-white tracking-tight truncate">{event.title}</h1>
              <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>
            {event.description && (
              <p className="text-sm text-slate-400">{event.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/admin/events" className="text-sm text-slate-400 hover:text-slate-200 transition-colors hidden md:block">
              ← Geri
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Action cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <Link
            href={`/admin/events/${eventId}/qr`}
            className={`group rounded-xl border p-4 flex items-center gap-3 transition-all ${
              isActive
                ? "border-blue-500/40 bg-blue-600/10 hover:bg-blue-600/20"
                : "border-slate-700 bg-slate-900 hover:border-slate-600"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-blue-600" : "bg-slate-800"}`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              </svg>
            </div>
            <div>
              <p className={`text-sm font-semibold ${isActive ? "text-blue-300" : "text-slate-300"}`}>Live QR</p>
              <p className="text-xs text-slate-500">QR kodunu göster</p>
            </div>
          </Link>

          <Link
            href={`/admin/events/${eventId}/participants`}
            className="group rounded-xl border border-slate-700 bg-slate-900 hover:border-slate-600 p-4 flex items-center gap-3 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Katılımcılar</p>
              <p className="text-xs text-slate-500">Liste & import</p>
            </div>
          </Link>

          <Link
            href={`/admin/events/${eventId}/attendance`}
            className="group rounded-xl border border-slate-700 bg-slate-900 hover:border-slate-600 p-4 flex items-center gap-3 transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-300">Yoklama</p>
              <p className="text-xs text-slate-500">Kayıtlar & export</p>
            </div>
          </Link>
        </div>

        {/* Detail card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">

          <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Etkinlik Detayları</h2>
          </div>

          <div className="divide-y divide-slate-800">
            <InfoRow label="Başlangıç" value={fmt(event.startsAt)} />
            <InfoRow label="Bitiş"     value={fmt(event.endsAt)} />
            <InfoRow label="Konum"     value={`${event.latitude}, ${event.longitude}`} />
            <InfoRow label="İzin Verilen Yarıçap" value={`${event.allowedRadiusMeters} metre`} />
            <InfoRow label="QR Yenileme Süresi"   value={`${event.qrRotationSeconds} saniye (${Math.round(event.qrRotationSeconds / 60)} dk)`} />
          </div>
        </div>

      </div>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm text-slate-200 font-medium text-right">{value}</span>
    </div>
  );
}

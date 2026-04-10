import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { EventService } from "@/server/services/event.service";
import { LogoutButton } from "@/app/admin/logout-button";
import { verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const eventService = new EventService();

function eventStatus(startsAt: Date, endsAt: Date) {
  const now = new Date();
  if (now < startsAt) return { label: "Upcoming", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" };
  if (now > endsAt)   return { label: "Completed", color: "text-slate-400 bg-slate-400/10 border-slate-700" };
  return               { label: "Active",   color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" };
}

function fmt(date: Date) {
  return date.toLocaleString("tr-TR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function EventsPage() {
  const cookieStore = await cookies();
  const token       = cookieStore.get("session")?.value;
  const session     = token ? verifySession(token) : null;
  if (!session) redirect("/login");

  const events = await eventService.getAllEvents();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">Admin Panel</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Events</h1>
            <p className="mt-1 text-sm text-slate-400">
              {events.length === 0
                ? "Henüz etkinlik yok."
                : `${events.length} etkinlik listeleniyor.`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-blue-600/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Yeni Etkinlik
            </Link>
            <LogoutButton />
          </div>
        </div>

        {events.length === 0 ? (
          /* Empty state */
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 mb-5">
              <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
              </svg>
            </div>
            <p className="text-slate-300 font-medium mb-1">Henüz etkinlik yok</p>
            <p className="text-slate-500 text-sm mb-6">İlk etkinliği oluşturarak başlayın.</p>
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors"
            >
              İlk Etkinliği Oluştur
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const status = eventStatus(event.startsAt, event.endsAt);
              const isActive = status.label === "Active";
              const participantCount = event._count.participants;
              const attendanceCount  = event._count.attendances;

              return (
                <div
                  key={event.id}
                  className={`rounded-xl border bg-slate-900 px-6 py-5 flex flex-col md:flex-row md:items-center gap-4 transition-colors ${
                    isActive
                      ? "border-emerald-500/30 bg-emerald-950/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <h2 className="text-base font-semibold text-white truncate">{event.title}</h2>
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Description */}
                    {event.description && (
                      <p className="text-sm text-slate-500 mb-3 truncate">{event.description}</p>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                      <span>
                        <span className="text-slate-600 mr-1">Başlangıç</span>
                        <span className="text-slate-400">{fmt(event.startsAt)}</span>
                      </span>
                      <span>
                        <span className="text-slate-600 mr-1">Bitiş</span>
                        <span className="text-slate-400">{fmt(event.endsAt)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-slate-600">Katılımcı</span>
                        <span className="text-slate-300 font-medium">{participantCount}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-slate-600">Check-in</span>
                        <span className={`font-medium ${attendanceCount > 0 ? "text-emerald-400" : "text-slate-400"}`}>
                          {attendanceCount}
                        </span>
                        {participantCount > 0 && (
                          <span className="text-slate-600">
                            ({Math.round((attendanceCount / participantCount) * 100)}%)
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/events/${event.id}`}
                    className="shrink-0 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    Detaylar
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

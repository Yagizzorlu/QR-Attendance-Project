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
  if (now < startsAt) return { label: "Upcoming", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" };
  if (now > endsAt)   return { label: "Completed", color: "text-slate-400 bg-slate-400/10 border-slate-600" };
  return               { label: "Active", color: "text-green-400 bg-green-400/10 border-green-400/20" };
}

function fmt(date: Date) {
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
        <p className="text-xs text-slate-500 tracking-wide uppercase mb-4">
          Admin &rsaquo; Events
        </p>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Events</h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage your events and monitor attendance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/events/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              + Create New Event
            </Link>
            <LogoutButton />
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <p className="text-slate-500 text-sm">No events yet.</p>
            <Link
              href="/admin/events/new"
              className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Create your first event →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {events.map((event) => {
              const status = eventStatus(event.startsAt, event.endsAt);
              return (
                <div
                  key={event.id}
                  className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-5 flex flex-col md:flex-row md:items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-base font-semibold text-white truncate">
                        {event.title}
                      </h2>
                      <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <p className="text-sm text-slate-500 mb-3 truncate">
                      {event.description ?? "No description"}
                    </p>

                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400">
                      <span>
                        <span className="text-slate-600 mr-1">Start</span>
                        {fmt(event.startsAt)}
                      </span>
                      <span>
                        <span className="text-slate-600 mr-1">End</span>
                        {fmt(event.endsAt)}
                      </span>
                      <span>
                        <span className="text-slate-600 mr-1">Radius</span>
                        {event.allowedRadiusMeters} m
                      </span>
                      <span>
                        <span className="text-slate-600 mr-1">QR rotation</span>
                        {event.qrRotationSeconds}s
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/events/${event.id}`}
                    className="shrink-0 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
                  >
                    View Details →
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { EventService } from "@/server/services/event.service";
import { LogoutButton } from "@/app/admin/logout-button";

const eventService = new EventService();

function fmt(date: Date) {
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventStatus(startsAt: Date, endsAt: Date) {
  const now = new Date();
  if (now < startsAt) return { label: "Upcoming", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" };
  if (now > endsAt)   return { label: "Completed", color: "text-slate-400 bg-slate-400/10 border-slate-600" };
  return               { label: "Active", color: "text-green-400 bg-green-400/10 border-green-400/20" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  let event;
  try {
    event = await eventService.getEventById(eventId);
  } catch {
    notFound();
  }

  const status = eventStatus(event.startsAt, event.endsAt);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-4xl mx-auto">

        {/* Breadcrumb */}
        <p className="text-xs text-slate-500 tracking-wide uppercase mb-4">
          Admin &rsaquo;{" "}
          <Link href="/admin/events" className="hover:text-slate-300 transition-colors">
            Events
          </Link>{" "}
          &rsaquo; {event.title}
        </p>

        {/* Page header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-semibold text-white tracking-tight">
                {event.title}
              </h1>
              <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>
            {event.description && (
              <p className="mt-1 text-sm text-slate-400">{event.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/events/${eventId}/participants`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              View Participants
            </Link>
            <Link
              href={`/admin/events/${eventId}/attendance`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              View Attendance
            </Link>
            <Link
              href={`/admin/events/${eventId}/qr`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
            >
              Open Live QR
            </Link>
            <Link
              href="/admin/events"
              className="shrink-0 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Events
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Detail card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 divide-y divide-slate-800">

          {/* Schedule */}
          <Section title="Schedule">
            <Row label="Starts At" value={fmt(event.startsAt)} />
            <Row label="Ends At"   value={fmt(event.endsAt)} />
          </Section>

          {/* Location */}
          <Section title="Location">
            <Row label="Latitude"        value={String(event.latitude)} />
            <Row label="Longitude"       value={String(event.longitude)} />
            <Row label="Allowed Radius"  value={`${event.allowedRadiusMeters} meters`} />
          </Section>

          {/* QR Settings */}
          <Section title="QR Settings">
            <Row label="Rotation Interval" value={`${event.qrRotationSeconds} seconds`} />
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-slate-200 font-medium">{value}</span>
    </div>
  );
}

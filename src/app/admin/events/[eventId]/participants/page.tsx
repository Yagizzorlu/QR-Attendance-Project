import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { EventParticipantService } from "@/server/services/event-participant.service";
import { MarkControls } from "./mark-controls";
import { ImportCsv } from "./import-csv";
import { AddParticipant } from "./add-participant";
import { LogoutButton } from "@/app/admin/logout-button";
import { verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const eventParticipantService = new EventParticipantService();

function fmt(date: Date) {
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}


function sourceLabel(sourceType: string) {
  if (sourceType === "CSV")     return <span className="text-blue-400">CSV</span>;
  if (sourceType === "WALK_IN") return <span className="text-yellow-400">Walk-in</span>;
  return <span className="text-slate-400">Manual</span>;
}

export default async function ParticipantsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const cookieStore = await cookies();
  const token       = cookieStore.get("session")?.value;
  const session     = token ? verifySession(token) : null;
  if (!session) redirect("/login");

  const { eventId } = await params;

  let rows;
  try {
    rows = await eventParticipantService.getParticipantsByEventId(eventId);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <p className="text-xs text-slate-500 tracking-wide uppercase mb-4">
          Admin &rsaquo;{" "}
          <Link href="/admin/events" className="hover:text-slate-300 transition-colors">
            Events
          </Link>{" "}
          &rsaquo; Participants
        </p>

        {/* Page header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Participants</h1>
            <p className="mt-1 text-sm text-slate-400">
              View registered participants for this event.
            </p>
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

        <div className="mb-4 flex flex-col gap-3">
          <AddParticipant eventId={eventId} />
          <ImportCsv eventId={eventId} />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <p className="text-slate-500 text-sm">No participants yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Contact
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Source
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Manual Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Registered At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.eventParticipantId} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-4 text-slate-200 font-medium">{row.fullName}</td>
                      <td className="px-5 py-4 text-slate-400">
                        {row.email ?? row.phone ?? "—"}
                      </td>
                      <td className="px-5 py-4">
                        {sourceLabel(row.sourceType)}
                      </td>
                      <td className="px-5 py-4">
                        <MarkControls
                          eventId={eventId}
                          participantId={row.participantId}
                          currentPresent={row.isMarkedPresentManually}
                          currentAbsent={row.isMarkedAbsentManually}
                        />
                      </td>
                      <td className="px-5 py-4 text-slate-400">{fmt(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-800">
              <p className="text-xs text-slate-600">
                {rows.length} participant{rows.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}


      </div>
    </main>
  );
}

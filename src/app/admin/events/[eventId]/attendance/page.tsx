import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AttendanceService } from "@/server/services/attendance.service";
import { LogoutButton } from "@/app/admin/logout-button";
import { verifySession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const attendanceService = new AttendanceService();

function fmt(date: Date) {
  return date.toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AttendancePage({
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
  let summary;
  try {
    [rows, summary] = await Promise.all([
      attendanceService.getAttendanceByEventId(eventId),
      attendanceService.getAttendanceSummary(eventId),
    ]);
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
          &rsaquo; Attendance
        </p>

        {/* Page header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Attendance</h1>
            <p className="mt-1 text-sm text-slate-400">
              View participant check-in records for this event.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/api/events/${eventId}/attendance/export`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              Export Excel
            </a>
            <Link
              href={`/admin/events/${eventId}`}
              className="shrink-0 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              ← Back to Event
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Check-ins
            </p>
            <p className="text-2xl font-semibold text-white mt-2">{summary.totalCheckIns}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Unique Participants
            </p>
            <p className="text-2xl font-semibold text-white mt-2">{summary.uniqueParticipants}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-16 text-center">
            <p className="text-slate-500 text-sm">No attendance records yet.</p>
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
                      Checked In
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Distance
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      QR Slot
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rows.map((row) => (
                    <tr key={row.attendanceId} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-4 text-slate-200 font-medium">{row.fullName}</td>
                      <td className="px-5 py-4 text-slate-400">
                        {row.email ?? row.phone ?? "—"}
                      </td>
                      <td className="px-5 py-4 text-slate-400">{fmt(row.checkedInAt)}</td>
                      <td className="px-5 py-4 text-slate-400">
                        {row.distanceMeters === 0 ? "—" : `${Math.round(row.distanceMeters)} m`}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500">
                        {new Date(row.qrSlot).toLocaleString("tr-TR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-800">
              <p className="text-xs text-slate-600">
                {rows.length} record{rows.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

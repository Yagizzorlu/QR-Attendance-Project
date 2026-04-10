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
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
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
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/admin/events" className="hover:text-slate-300 transition-colors">Events</Link>
          <span>/</span>
          <Link href={`/admin/events/${eventId}`} className="hover:text-slate-300 transition-colors">Detail</Link>
          <span>/</span>
          <span className="text-slate-400">Yoklama</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Yoklama Kayıtları</h1>
            <p className="mt-1 text-sm text-slate-400">Etkinliğe ait tüm check-in kayıtları.</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/events/${eventId}/attendance/export`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Excel İndir
            </a>
            <Link href={`/admin/events/${eventId}`} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              ← Geri
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Toplam Check-in"
            value={String(summary.totalCheckIns)}
            color="text-white"
          />
          <StatCard
            label="Benzersiz Katılımcı"
            value={String(summary.uniqueParticipants)}
            color="text-white"
          />
          <StatCard
            label="Son Güncelleme"
            value={rows.length > 0 ? fmt(rows[0].checkedInAt) : "—"}
            color="text-slate-300"
            small
          />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-20 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 mb-5">
              <svg className="w-7 h-7 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-300 font-medium mb-1">Henüz yoklama kaydı yok</p>
            <p className="text-slate-500 text-sm">QR okutulduğunda kayıtlar burada görünecek.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Ad Soyad</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">İletişim</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Check-in Zamanı</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Mesafe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rows.map((row) => (
                    <tr key={row.attendanceId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 text-slate-100 font-medium">{row.fullName}</td>
                      <td className="px-5 py-4 text-slate-400 text-sm">{row.email ?? row.phone ?? "—"}</td>
                      <td className="px-5 py-4 text-slate-400 text-sm">{fmt(row.checkedInAt)}</td>
                      <td className="px-5 py-4">
                        {row.distanceMeters > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2 py-0.5 rounded-full">
                            {Math.round(row.distanceMeters)} m
                          </span>
                        ) : (
                          <span className="text-slate-600 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <p className="text-xs text-slate-600">{rows.length} kayıt</p>
              <a
                href={`/api/events/${eventId}/attendance/export`}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Excel olarak indir →
              </a>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function StatCard({ label, value, color, small }: { label: string; value: string; color: string; small?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <p className={`font-semibold ${small ? "text-lg" : "text-3xl"} ${color}`}>{value}</p>
    </div>
  );
}

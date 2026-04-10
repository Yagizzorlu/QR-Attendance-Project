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
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function SourceBadge({ sourceType }: { sourceType: string }) {
  if (sourceType === "CSV")     return <span className="text-xs font-medium text-blue-400 bg-blue-400/10 border border-blue-400/20 px-2 py-0.5 rounded-full">CSV</span>;
  if (sourceType === "WALK_IN") return <span className="text-xs font-medium text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">Walk-in</span>;
  return <span className="text-xs font-medium text-slate-400 bg-slate-400/10 border border-slate-700 px-2 py-0.5 rounded-full">Manuel</span>;
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

  const csvCount    = rows.filter(r => r.sourceType === "CSV").length;
  const manualCount = rows.filter(r => r.sourceType === "MANUAL").length;
  const walkInCount = rows.filter(r => r.sourceType === "WALK_IN").length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-5xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
          <Link href="/admin/events" className="hover:text-slate-300 transition-colors">Events</Link>
          <span>/</span>
          <Link href={`/admin/events/${eventId}`} className="hover:text-slate-300 transition-colors">Detail</Link>
          <span>/</span>
          <span className="text-slate-400">Katılımcılar</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Katılımcılar</h1>
            <p className="mt-1 text-sm text-slate-400">
              {rows.length > 0
                ? `${rows.length} katılımcı kayıtlı`
                : "Henüz katılımcı eklenmemiş."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/admin/events/${eventId}`} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              ← Geri
            </Link>
            <LogoutButton />
          </div>
        </div>

        {/* Stats */}
        {rows.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-6 rounded-full bg-blue-500/60" />
              <div>
                <p className="text-xs text-slate-500">CSV</p>
                <p className="text-lg font-semibold text-white">{csvCount}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-6 rounded-full bg-slate-500/60" />
              <div>
                <p className="text-xs text-slate-500">Manuel</p>
                <p className="text-lg font-semibold text-white">{manualCount}</p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 flex items-center gap-3">
              <div className="w-2 h-6 rounded-full bg-amber-500/60" />
              <div>
                <p className="text-xs text-slate-500">Walk-in</p>
                <p className="text-lg font-semibold text-white">{walkInCount}</p>
              </div>
            </div>
          </div>
        )}

        {/* Add / Import tools */}
        <div className="mb-6 flex flex-col gap-3">
          <AddParticipant eventId={eventId} />
          <ImportCsv eventId={eventId} />
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 mb-4">
              <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <p className="text-slate-300 font-medium mb-1">Katılımcı yok</p>
            <p className="text-slate-500 text-sm">Yukarıdan manuel ekleyin veya CSV yükleyin.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/40">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Ad Soyad</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">İletişim</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Kaynak</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Manuel Durum</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {rows.map((row) => (
                    <tr key={row.eventParticipantId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 text-slate-100 font-medium">{row.fullName}</td>
                      <td className="px-5 py-4 text-slate-400 text-sm">{row.email ?? row.phone ?? "—"}</td>
                      <td className="px-5 py-4"><SourceBadge sourceType={row.sourceType} /></td>
                      <td className="px-5 py-4">
                        <MarkControls
                          eventId={eventId}
                          participantId={row.participantId}
                          currentPresent={row.isMarkedPresentManually}
                          currentAbsent={row.isMarkedAbsentManually}
                        />
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-sm">{fmt(row.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/50">
              <p className="text-xs text-slate-600">{rows.length} katılımcı</p>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

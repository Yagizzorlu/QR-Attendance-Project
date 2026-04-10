import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import QRCode from "qrcode";
import { QrService } from "@/server/services/qr.service";
import { LogoutButton } from "@/app/admin/logout-button";
import { verifySession } from "@/lib/auth/session";
import QrDisplay from "./QrDisplay";

export const dynamic = "force-dynamic";

const qrService = new QrService();

export default async function EventQrPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const cookieStore = await cookies();
  const token       = cookieStore.get("session")?.value;
  const session     = token ? verifySession(token) : null;
  if (!session) redirect("/login");

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
          &rsaquo; Live QR
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

        <QrDisplay
          eventId={eventId}
          initial={{
            eventTitle: result.eventTitle,
            slotStart:  result.slotStart.toISOString(),
            expiresAt:  result.expiresAt.toISOString(),
            qrDataUrl,
            sig: result.payload.sig,
          }}
        />

      </div>
    </main>
  );
}

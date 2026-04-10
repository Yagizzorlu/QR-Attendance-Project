import { NextRequest, NextResponse } from "next/server";
import { QrService } from "@/server/services/qr.service";
import { verifySession } from "@/lib/auth/session";

const qrService = new QrService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const token = request.cookies.get("session")?.value;
  if (!token || !verifySession(token)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  try {
    const result = await qrService.getLiveQr(eventId);
    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "Event not found") {
      return NextResponse.json(
        { success: false, code: "EVENT_NOT_FOUND", message: "Event not found" },
        { status: 404 }
      );
    }

    console.error("[GET /api/events/:eventId/live-qr]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

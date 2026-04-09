import { NextResponse } from "next/server";
import { QrService } from "@/server/services/qr.service";

const qrService = new QrService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
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

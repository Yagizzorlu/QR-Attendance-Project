import { NextRequest, NextResponse } from "next/server";
import { ParticipantImportService } from "@/server/services/participant-import.service";
import { verifySession } from "@/lib/auth/session";

const participantImportService = new ParticipantImportService();

function err(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, code, message }, { status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const token = request.cookies.get("session")?.value;
  if (!token || !verifySession(token)) {
    return err(401, "UNAUTHORIZED", "Unauthorized");
  }

  const { eventId } = await params;

  const body = await request.json().catch(() => null);
  if (!body || !body.csvText) {
    return err(400, "INVALID_REQUEST", "csvText zorunludur.");
  }

  try {
    const result = await participantImportService.importCsv(eventId, body.csvText as string);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "Event not found") {
      return NextResponse.json(
        { success: false, code: "EVENT_NOT_FOUND", message: "Event not found" },
        { status: 404 }
      );
    }

    console.error("[POST /api/events/:eventId/participants/import]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

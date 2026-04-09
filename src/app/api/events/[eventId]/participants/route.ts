import { NextResponse } from "next/server";
import { EventParticipantService } from "@/server/services/event-participant.service";

const eventParticipantService = new EventParticipantService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const data = await eventParticipantService.getParticipantsByEventId(eventId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "Event not found") {
      return NextResponse.json(
        { success: false, code: "EVENT_NOT_FOUND", message: "Event not found" },
        { status: 404 }
      );
    }

    console.error("[GET /api/events/:eventId/participants]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

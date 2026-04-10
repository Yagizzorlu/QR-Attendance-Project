import { NextRequest, NextResponse } from "next/server";
import { EventParticipantService } from "@/server/services/event-participant.service";
import { ParticipantService } from "@/server/services/participant.service";
import { verifySession } from "@/lib/auth/session";

const eventParticipantService = new EventParticipantService();
const participantService = new ParticipantService();

function getSession(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  return token ? verifySession(token) : null;
}

function unauth() {
  return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  if (!getSession(request)) return unauth();

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  if (!getSession(request)) return unauth();

  const { eventId } = await params;

  const body = await request.json().catch(() => null);
  if (!body || !body.firstName?.trim() || !body.lastName?.trim()) {
    return NextResponse.json(
      { success: false, code: "INVALID_REQUEST", message: "firstName ve lastName zorunludur." },
      { status: 400 }
    );
  }

  if (!body.email?.trim() && !body.phone?.trim()) {
    return NextResponse.json(
      { success: false, code: "INVALID_REQUEST", message: "email veya phone en az biri zorunludur." },
      { status: 400 }
    );
  }

  try {
    const result = await participantService.addManual({
      eventId,
      firstName: body.firstName.trim(),
      lastName:  body.lastName.trim(),
      email:     body.email?.trim() || undefined,
      phone:     body.phone?.trim() || undefined,
    });
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "Event not found") {
      return NextResponse.json(
        { success: false, code: "EVENT_NOT_FOUND", message: "Event not found" },
        { status: 404 }
      );
    }
    if (message === "Already registered") {
      return NextResponse.json(
        { success: false, code: "ALREADY_REGISTERED", message: "Bu katılımcı zaten kayıtlı." },
        { status: 409 }
      );
    }

    console.error("[POST /api/events/:eventId/participants]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { EventService, ValidationError } from "@/server/services/event.service";
import { verifySession } from "@/lib/auth/session";

const eventService = new EventService();

function getSession(request: NextRequest) {
  const token = request.cookies.get("session")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function GET(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await eventService.getAllEvents(session.adminId);
    return NextResponse.json({ success: true, data: events });
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = getSession(request);
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { success: false, message: "Geçersiz JSON." },
      { status: 400 }
    );
  }

  try {
    const event = await eventService.createEvent({
      ...body,
      createdByAdminId: session.adminId,
    });
    return NextResponse.json({ success: true, data: event }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { success: false, message: err.message, fields: err.fields },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

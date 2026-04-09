import { NextRequest, NextResponse } from "next/server";
import { EventService, ValidationError } from "@/server/services/event.service";

const eventService = new EventService();

const TEMP_ADMIN_ID = "seed-admin-id";

export async function GET() {
  try {
    const events = await eventService.getAllEvents(TEMP_ADMIN_ID);
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
      createdByAdminId: TEMP_ADMIN_ID,
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

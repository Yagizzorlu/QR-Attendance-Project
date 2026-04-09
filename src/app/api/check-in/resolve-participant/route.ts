import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ParticipantService } from "@/server/services/participant.service";

const participantService = new ParticipantService();

function err(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, code, message }, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || !body.eventId) {
    return err(400, "INVALID_REQUEST", "eventId zorunludur.");
  }

  const { eventId, email, phone } = body as {
    eventId: string;
    email?: string;
    phone?: string;
  };

  if (!email && !phone) {
    return err(400, "INVALID_REQUEST", "email veya phone en az biri zorunludur.");
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return err(404, "EVENT_NOT_FOUND", "Etkinlik bulunamadı.");
  }

  const result = await participantService.resolveForEvent({ eventId, email, phone });

  return NextResponse.json({ success: true, data: result });
}

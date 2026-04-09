import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

function err(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, code, message }, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    !body.eventId ||
    !body.participantId ||
    !body.qrSlot ||
    !body.qrSignatureHash
  ) {
    return err(400, "INVALID_REQUEST", "eventId, participantId, qrSlot ve qrSignatureHash zorunludur.");
  }

  const { eventId, participantId, qrSlot, qrSignatureHash } = body as {
    eventId: string;
    participantId: string;
    qrSlot: string;
    qrSignatureHash: string;
  };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return err(404, "EVENT_NOT_FOUND", "Etkinlik bulunamadı.");
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId } });
  if (!participant) {
    return err(404, "PARTICIPANT_NOT_FOUND", "Katılımcı bulunamadı.");
  }

  const existing = await prisma.attendance.findUnique({
    where: { eventId_participantId: { eventId, participantId } },
  });
  if (existing) {
    return err(409, "DUPLICATE_ATTENDANCE", "Yoklamanız zaten alınmış.");
  }

  const attendance = await prisma.attendance.create({
    data: {
      eventId,
      participantId,
      qrSlot,
      qrSignatureHash,
      latitude: 0,
      longitude: 0,
      distanceMeters: 0,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      attendanceId: attendance.id,
      participantId: attendance.participantId,
      eventId: attendance.eventId,
    },
  });
}

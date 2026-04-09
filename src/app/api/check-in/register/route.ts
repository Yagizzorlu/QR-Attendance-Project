import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ParticipantService } from "@/server/services/participant.service";

const participantService = new ParticipantService();

function err(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, code, message }, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    !body.eventId ||
    !body.firstName ||
    !body.lastName ||
    !body.qrSlot ||
    !body.qrSignatureHash
  ) {
    return err(400, "INVALID_REQUEST", "eventId, firstName, lastName, qrSlot ve qrSignatureHash zorunludur.");
  }

  const { eventId, firstName, lastName, email, phone, qrSlot, qrSignatureHash } = body as {
    eventId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    qrSlot: string;
    qrSignatureHash: string;
  };

  if (!email && !phone) {
    return err(400, "INVALID_REQUEST", "email veya phone en az biri zorunludur.");
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return err(404, "EVENT_NOT_FOUND", "Etkinlik bulunamadı.");
  }

  const participant = await participantService.registerWalkIn({
    eventId,
    firstName,
    lastName,
    email,
    phone,
  });

  const existing = await prisma.attendance.findUnique({
    where: { eventId_participantId: { eventId, participantId: participant.id } },
  });
  if (existing) {
    return err(409, "DUPLICATE_ATTENDANCE", "Yoklamanız zaten alınmış.");
  }

  const attendance = await prisma.attendance.create({
    data: {
      eventId,
      participantId: participant.id,
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
      participantId: participant.id,
      attendanceId: attendance.id,
      fullName: `${participant.firstName} ${participant.lastName}`,
    },
  });
}

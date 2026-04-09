import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

function err(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, code, message }, { status });
}

const VALID_STATUSES = ["present", "absent", "reset"] as const;
type Status = (typeof VALID_STATUSES)[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; participantId: string }> }
) {
  const { eventId, participantId } = await params;

  const body = await request.json().catch(() => null);
  if (!body || !VALID_STATUSES.includes(body.status)) {
    return err(400, "INVALID_REQUEST", "status must be 'present', 'absent', or 'reset'.");
  }

  const status: Status = body.status;

  const existing = await prisma.eventParticipant.findUnique({
    where: { eventId_participantId: { eventId, participantId } },
  });
  if (!existing) {
    return err(404, "PARTICIPANT_NOT_FOUND", "Participant not registered for this event.");
  }

  const data =
    status === "present" ? { isMarkedPresentManually: true,  isMarkedAbsentManually: false } :
    status === "absent"  ? { isMarkedPresentManually: false, isMarkedAbsentManually: true  } :
                           { isMarkedPresentManually: false, isMarkedAbsentManually: false };

  await prisma.eventParticipant.update({
    where: { eventId_participantId: { eventId, participantId } },
    data,
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { EventRepository } from "@/server/repositories/event.repository";
import { signQrPayload } from "@/lib/qr/signer";
import { getSlotEnd } from "@/lib/qr/slot";
import { calculateDistanceMeters } from "@/lib/geo/haversine";

const repo = new EventRepository();

function err(status: number, code: string, message: string, data?: object) {
  return NextResponse.json({ success: false, code, message, ...(data && { data }) }, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    !body.eventId ||
    !body.slot ||
    !body.sig ||
    typeof body.latitude  !== "number" ||
    typeof body.longitude !== "number"
  ) {
    return err(400, "INVALID_REQUEST", "eventId, slot, sig, latitude ve longitude zorunludur.");
  }

  const { eventId, slot, sig, latitude, longitude } = body as {
    eventId: string;
    slot: string;
    sig: string;
    latitude: number;
    longitude: number;
  };

  const event = await repo.findById(eventId);
  if (!event) {
    return err(404, "EVENT_NOT_FOUND", "Etkinlik bulunamadı.");
  }

  const slotDate = new Date(slot);
  if (isNaN(slotDate.getTime())) {
    return err(400, "INVALID_QR", "Geçersiz slot formatı.");
  }

  const expectedSig = signQrPayload(eventId, slotDate);
  if (sig !== expectedSig) {
    return err(400, "INVALID_QR", "QR imzası geçersiz.");
  }

  const slotEnd = getSlotEnd(slotDate, event.qrRotationSeconds);
  if (new Date() > slotEnd) {
    return err(400, "QR_EXPIRED", "QR kodunun süresi dolmuş.");
  }

  const distanceMeters = calculateDistanceMeters(
    latitude,
    longitude,
    event.latitude,
    event.longitude
  );

  if (distanceMeters > event.allowedRadiusMeters) {
    return err(400, "OUT_OF_RANGE", "Etkinlik alanı dışındasınız.", {
      distanceMeters: Math.round(distanceMeters),
      allowedMeters: event.allowedRadiusMeters,
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      eventId: event.id,
      eventTitle: event.title,
      slot,
      expiresAt: slotEnd.toISOString(),
      distanceMeters: Math.round(distanceMeters),
      allowedMeters: event.allowedRadiusMeters,
    },
  });
}

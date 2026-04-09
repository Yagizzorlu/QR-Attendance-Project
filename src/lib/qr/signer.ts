import { createHmac } from "crypto";

export type QrTokenPayload = {
  eventId: string;
  slot: string;
  sig: string;
};

function getQrSecret(): string {
  const secret = process.env.QR_SECRET;
  if (!secret) throw new Error("QR_SECRET is missing");
  return secret;
}

export function signQrPayload(eventId: string, slotStart: Date): string {
  const message = `${eventId}|${slotStart.toISOString()}`;
  return createHmac("sha256", getQrSecret()).update(message).digest("hex");
}

export function buildQrTokenPayload(eventId: string, slotStart: Date): QrTokenPayload {
  return {
    eventId,
    slot: slotStart.toISOString(),
    sig: signQrPayload(eventId, slotStart),
  };
}

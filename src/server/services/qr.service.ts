import { EventRepository } from "@/server/repositories/event.repository";
import { getSlotStart, getSlotEnd } from "@/lib/qr/slot";
import { buildQrTokenPayload, type QrTokenPayload } from "@/lib/qr/signer";

export type LiveQrResult = {
  eventId: string;
  eventTitle: string;
  slotStart: Date;
  slotEnd: Date;
  expiresAt: Date;
  payload: QrTokenPayload;
  qrValue: string;
};

export class QrService {
  private repo = new EventRepository();

  async getLiveQr(eventId: string): Promise<LiveQrResult> {
    const event = await this.repo.findById(eventId);
    if (!event) throw new Error("Event not found");

    const now = new Date();
    const slotStart = getSlotStart(now, event.qrRotationSeconds);
    const slotEnd = getSlotEnd(slotStart, event.qrRotationSeconds);
    const payload = buildQrTokenPayload(event.id, slotStart);

    const baseUrl = process.env["APP_URL"];
    if (!baseUrl) throw new Error("APP_URL is missing");

    const params = new URLSearchParams({
      eventId: payload.eventId,
      slot:    payload.slot,
      sig:     payload.sig,
    });
    const qrValue = `${baseUrl}/check-in?${params.toString()}`;

    return {
      eventId: event.id,
      eventTitle: event.title,
      slotStart,
      slotEnd,
      expiresAt: slotEnd,
      payload,
      qrValue,
    };
  }
}

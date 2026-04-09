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
    const qrValue = JSON.stringify(payload);

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

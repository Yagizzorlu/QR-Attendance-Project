import { EventParticipantRepository } from "@/server/repositories/event-participant.repository";
import { EventRepository } from "@/server/repositories/event.repository";

export type EventParticipantListItem = {
  eventParticipantId: string;
  participantId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  sourceType: string;
  isMarkedPresentManually: boolean;
  isMarkedAbsentManually: boolean;
  createdAt: Date;
};

export class EventParticipantService {
  private eventParticipantRepo = new EventParticipantRepository();
  private eventRepo = new EventRepository();

  async getParticipantsByEventId(eventId: string): Promise<EventParticipantListItem[]> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Event not found");

    const rows = await this.eventParticipantRepo.findByEventId(eventId);

    return rows.map((row) => ({
      eventParticipantId: row.id,
      participantId: row.participantId,
      fullName: `${row.participant.firstName} ${row.participant.lastName}`,
      email: row.participant.email,
      phone: row.participant.phone,
      sourceType: row.sourceType,
      isMarkedPresentManually: row.isMarkedPresentManually,
      isMarkedAbsentManually: row.isMarkedAbsentManually,
      createdAt: row.createdAt,
    }));
  }
}

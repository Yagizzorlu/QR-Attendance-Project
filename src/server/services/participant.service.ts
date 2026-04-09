import { ParticipantRepository } from "@/server/repositories/participant.repository";
import { EventParticipantRepository } from "@/server/repositories/event-participant.repository";

type RegisterWalkInInput = {
  eventId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
};

export class ParticipantService {
  private participantRepo = new ParticipantRepository();
  private eventParticipantRepo = new EventParticipantRepository();

  async resolveForEvent(input: { eventId: string; email?: string; phone?: string }) {
    const { eventId, email, phone } = input;

    const participant =
      (email ? await this.participantRepo.findByEmail(email) : null) ??
      (phone ? await this.participantRepo.findByPhone(phone) : null);

    if (!participant) return { found: false as const };

    const eventParticipant = await this.eventParticipantRepo.findByEventAndParticipant(
      eventId,
      participant.id
    );

    if (!eventParticipant) return { found: false as const };

    return {
      found: true as const,
      participantId: participant.id,
      fullName: `${participant.firstName} ${participant.lastName}`,
    };
  }

  async registerWalkIn(input: RegisterWalkInInput) {
    const { eventId, firstName, lastName, email, phone } = input;

    let participant =
      (email ? await this.participantRepo.findByEmail(email) : null) ??
      (phone ? await this.participantRepo.findByPhone(phone) : null);

    if (!participant) {
      participant = await this.participantRepo.create({ firstName, lastName, email, phone });
    }

    await this.eventParticipantRepo.upsertWalkIn(eventId, participant.id);

    return {
      id: participant.id,
      firstName: participant.firstName,
      lastName: participant.lastName,
      email: participant.email,
      phone: participant.phone,
    };
  }
}

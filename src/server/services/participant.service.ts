import { prisma } from "@/lib/db/prisma";
import { ParticipantRepository } from "@/server/repositories/participant.repository";
import { EventParticipantRepository } from "@/server/repositories/event-participant.repository";
import { SourceType } from "@/generated/prisma";

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

    // Try both fields — a participant imported via CSV may have email stored
    // while the person identifies via phone at the door, or vice versa.
    const [byEmail, byPhone] = await Promise.all([
      email ? this.participantRepo.findByEmail(email) : null,
      phone ? this.participantRepo.findByPhone(phone) : null,
    ]);
    const participant = byEmail ?? byPhone;

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

  async addManual(input: { eventId: string; firstName: string; lastName: string; email?: string; phone?: string }) {
    const { eventId, firstName, lastName, email, phone } = input;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("Event not found");

    let participant =
      (email ? await this.participantRepo.findByEmail(email) : null) ??
      (phone ? await this.participantRepo.findByPhone(phone) : null);

    if (!participant) {
      participant = await this.participantRepo.create({ firstName, lastName, email, phone });
    }

    const existing = await this.eventParticipantRepo.findByEventAndParticipant(eventId, participant.id);
    if (existing) throw new Error("Already registered");

    await this.eventParticipantRepo.create({ eventId, participantId: participant.id, sourceType: SourceType.MANUAL });

    return { id: participant.id, firstName: participant.firstName, lastName: participant.lastName };
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

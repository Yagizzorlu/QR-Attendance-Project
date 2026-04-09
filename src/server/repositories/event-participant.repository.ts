import { prisma } from "@/lib/db/prisma";
import { SourceType } from "@/generated/prisma";

export type CreateEventParticipantInput = {
  eventId: string;
  participantId: string;
  sourceType: SourceType;
};

export class EventParticipantRepository {
  async findByEventAndParticipant(eventId: string, participantId: string) {
    return prisma.eventParticipant.findUnique({
      where: { eventId_participantId: { eventId, participantId } },
    });
  }

  async create(input: CreateEventParticipantInput) {
    return prisma.eventParticipant.create({ data: input });
  }

  async findByEventId(eventId: string) {
    return prisma.eventParticipant.findMany({
      where: { eventId },
      orderBy: { createdAt: "desc" },
      include: { participant: true },
    });
  }

  async upsertWalkIn(eventId: string, participantId: string) {
    return prisma.eventParticipant.upsert({
      where: { eventId_participantId: { eventId, participantId } },
      create: { eventId, participantId, sourceType: SourceType.WALK_IN },
      update: {},
    });
  }
}

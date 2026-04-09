import { prisma } from "@/lib/db/prisma";

export type CreateParticipantInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
};

export class ParticipantRepository {
  async findByEmail(email: string) {
    return prisma.participant.findFirst({ where: { email } });
  }

  async findByPhone(phone: string) {
    return prisma.participant.findFirst({ where: { phone } });
  }

  async create(input: CreateParticipantInput) {
    return prisma.participant.create({ data: input });
  }
}

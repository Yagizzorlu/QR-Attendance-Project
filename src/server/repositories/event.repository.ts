import { prisma } from "@/lib/db/prisma";

export type CreateEventInput = {
  title: string;
  description?: string;
  startsAt: Date;
  endsAt: Date;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  qrRotationSeconds: number;
  createdByAdminId: string;
};

export class EventRepository {
  async findAll() {
    return prisma.event.findMany({
      orderBy: { startsAt: "desc" },
    });
  }

  async findById(eventId: string) {
    return prisma.event.findUnique({
      where: { id: eventId },
    });
  }

  async create(input: CreateEventInput) {
    return prisma.event.create({ data: input });
  }

  async update(
    eventId: string,
    input: Partial<Omit<CreateEventInput, "createdByAdminId">>
  ) {
    return prisma.event.update({
      where: { id: eventId },
      data: input,
    });
  }
}

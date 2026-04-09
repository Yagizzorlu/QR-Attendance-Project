import { prisma } from "@/lib/db/prisma";

export class AttendanceRepository {
  async findByEventId(eventId: string) {
    return prisma.attendance.findMany({
      where: { eventId },
      orderBy: { checkedInAt: "desc" },
      include: { participant: true },
    });
  }
}

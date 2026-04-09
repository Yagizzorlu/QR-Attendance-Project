import { prisma } from "@/lib/db/prisma";

export class AdminRepository {
  async findByEmail(email: string) {
    return prisma.admin.findUnique({ where: { email } });
  }
}

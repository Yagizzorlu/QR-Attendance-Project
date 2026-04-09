import { PrismaClient } from "../src/generated/prisma";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const email    = process.env["ADMIN_EMAIL"];
  const password = process.env["ADMIN_PASSWORD"];

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.");
  }

  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await hashPassword(password);

  await prisma.admin.create({
    data: { email, passwordHash },
  });

  console.log(`Admin created: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

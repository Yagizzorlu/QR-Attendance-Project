import { AdminRepository } from "@/server/repositories/admin.repository";
import { verifyPassword } from "@/lib/auth/password";

export class AuthService {
  private adminRepo = new AdminRepository();

  async login(email: string, password: string) {
    const admin = await this.adminRepo.findByEmail(email);
    if (!admin) throw new Error("Invalid credentials");

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) throw new Error("Invalid credentials");

    return { id: admin.id, email: admin.email };
  }
}

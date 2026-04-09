import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/server/services/auth.service";
import { signSession } from "@/lib/auth/session";

const authService = new AuthService();

function err(status: number, code: string, message: string) {
  return NextResponse.json({ success: false, code, message }, { status });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || !body.email || !body.password) {
    return err(400, "INVALID_REQUEST", "email ve password zorunludur.");
  }

  try {
    const admin = await authService.login(body.email as string, body.password as string);
    const token = signSession({ adminId: admin.id, email: admin.email });

    const response = NextResponse.json({ success: true, data: { id: admin.id, email: admin.email } });
    response.cookies.set("session", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message === "Invalid credentials") {
      return err(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    console.error("[POST /api/auth/login]", error);
    return err(500, "INTERNAL_ERROR", "Internal server error");
  }
}

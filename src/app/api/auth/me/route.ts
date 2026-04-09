import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("session")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED", message: "Not authenticated." },
      { status: 401 }
    );
  }

  const payload = verifySession(token);

  if (!payload) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED", message: "Invalid or expired session." },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { adminId: payload.adminId, email: payload.email },
  });
}

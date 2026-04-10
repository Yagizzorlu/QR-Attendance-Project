import { NextRequest, NextResponse } from "next/server";
import { AttendanceService } from "@/server/services/attendance.service";
import { verifySession } from "@/lib/auth/session";

const attendanceService = new AttendanceService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const token = request.cookies.get("session")?.value;
  if (!token || !verifySession(token)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;

  try {
    const data = await attendanceService.getAttendanceByEventId(eventId);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "Event not found") {
      return NextResponse.json(
        { success: false, code: "EVENT_NOT_FOUND", message: "Event not found" },
        { status: 404 }
      );
    }

    console.error("[GET /api/events/:eventId/attendance]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

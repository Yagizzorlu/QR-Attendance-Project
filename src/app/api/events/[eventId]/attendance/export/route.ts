import { NextResponse } from "next/server";
import { AttendanceService } from "@/server/services/attendance.service";
import { buildAttendanceWorkbook } from "@/lib/excel/export-attendance";

const attendanceService = new AttendanceService();

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  try {
    const data   = await attendanceService.getAttendanceByEventId(eventId);
    const buffer = buildAttendanceWorkbook(data);

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="attendance.xlsx"',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";

    if (message === "Event not found") {
      return NextResponse.json(
        { success: false, code: "EVENT_NOT_FOUND", message: "Event not found" },
        { status: 404 }
      );
    }

    console.error("[GET /api/events/:eventId/attendance/export]", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

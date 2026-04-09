import { AttendanceRepository } from "@/server/repositories/attendance.repository";
import { EventRepository } from "@/server/repositories/event.repository";

export type AttendanceListItem = {
  attendanceId: string;
  participantId: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  checkedInAt: Date;
  distanceMeters: number;
  qrSlot: string;
};

export type AttendanceSummary = {
  totalCheckIns: number;
  uniqueParticipants: number;
};

export class AttendanceService {
  private attendanceRepo = new AttendanceRepository();
  private eventRepo = new EventRepository();

  async getAttendanceByEventId(eventId: string): Promise<AttendanceListItem[]> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Event not found");

    const rows = await this.attendanceRepo.findByEventId(eventId);

    return rows.map((row) => ({
      attendanceId: row.id,
      participantId: row.participantId,
      fullName: `${row.participant.firstName} ${row.participant.lastName}`,
      email: row.participant.email,
      phone: row.participant.phone,
      checkedInAt: row.checkedInAt,
      distanceMeters: row.distanceMeters,
      qrSlot: row.qrSlot,
    }));
  }

  async getAttendanceSummary(eventId: string): Promise<AttendanceSummary> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Event not found");

    const rows = await this.attendanceRepo.findByEventId(eventId);

    return {
      totalCheckIns:      rows.length,
      uniqueParticipants: rows.length,
    };
  }
}

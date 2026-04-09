import * as XLSX from "xlsx";

export type AttendanceExportRow = {
  fullName: string;
  email: string | null;
  phone: string | null;
  checkedInAt: Date;
  distanceMeters: number;
  qrSlot: string;
};

export function buildAttendanceWorkbook(rows: AttendanceExportRow[]): Buffer {
  const data = rows.map((row) => ({
    "Name":           row.fullName,
    "Email":          row.email ?? "",
    "Phone":          row.phone ?? "",
    "Checked In At":  row.checkedInAt.toLocaleString("tr-TR"),
    "Distance (m)":   row.distanceMeters,
    "QR Slot":        new Date(row.qrSlot).toLocaleString("tr-TR"),
  }));

  const sheet    = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

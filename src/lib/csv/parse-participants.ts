import { parse } from "csv-parse/sync";

export type ParsedParticipant = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
};

export function parseParticipantsCsv(csvText: string): ParsedParticipant[] {
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const results: ParsedParticipant[] = [];

  for (const row of records) {
    const firstName = row["firstName"]?.trim() ?? "";
    const lastName  = row["lastName"]?.trim()  ?? "";

    if (!firstName || !lastName) continue;

    const email = row["email"]?.trim()  || undefined;
    const phone = row["phone"]?.trim()  || undefined;

    results.push({ firstName, lastName, email, phone });
  }

  return results;
}

import { EventRepository } from "@/server/repositories/event.repository";
import { ParticipantRepository } from "@/server/repositories/participant.repository";
import { EventParticipantRepository } from "@/server/repositories/event-participant.repository";
import { parseParticipantsCsv } from "@/lib/csv/parse-participants";
import { SourceType } from "@/generated/prisma";

export type ParticipantImportResult = {
  totalRows: number;
  imported: number;
  skippedDuplicates: number;
};

export class ParticipantImportService {
  private eventRepo            = new EventRepository();
  private participantRepo      = new ParticipantRepository();
  private eventParticipantRepo = new EventParticipantRepository();

  async importCsv(eventId: string, csvText: string): Promise<ParticipantImportResult> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new Error("Event not found");

    const rows = parseParticipantsCsv(csvText);

    let imported          = 0;
    let skippedDuplicates = 0;

    for (const row of rows) {
      const { firstName, lastName, email, phone } = row;

      let participant =
        (email ? await this.participantRepo.findByEmail(email) : null) ??
        (phone ? await this.participantRepo.findByPhone(phone) : null);

      if (!participant) {
        participant = await this.participantRepo.create({ firstName, lastName, email, phone });
      }

      const existing = await this.eventParticipantRepo.findByEventAndParticipant(
        eventId,
        participant.id
      );

      if (existing) {
        skippedDuplicates++;
        continue;
      }

      await this.eventParticipantRepo.create({
        eventId,
        participantId: participant.id,
        sourceType: SourceType.CSV,
      });

      imported++;
    }

    return { totalRows: rows.length, imported, skippedDuplicates };
  }
}

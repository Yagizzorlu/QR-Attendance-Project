import {
  EventRepository,
  type CreateEventInput,
} from "@/server/repositories/event.repository";

export type CreateEventServiceInput = Omit<
  CreateEventInput,
  "startsAt" | "endsAt"
> & {
  startsAt: string;
  endsAt: string;
};

export class ValidationError extends Error {
  constructor(
    message: string,
    public fields?: Record<string, string>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Etkinlik bulunamadı.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class EventService {
  private repo = new EventRepository();

  async getAllEvents(adminId: string) {
    return this.repo.findAll(adminId);
  }

  async getEventById(eventId: string) {
    const event = await this.repo.findById(eventId);
    if (!event) throw new NotFoundError();
    return event;
  }

  async createEvent(input: CreateEventServiceInput) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    const invalidFields: Record<string, string> = {};
    if (isNaN(startsAt.getTime()))
      invalidFields.startsAt = "Geçerli bir ISO tarih string olmalıdır.";
    if (isNaN(endsAt.getTime()))
      invalidFields.endsAt = "Geçerli bir ISO tarih string olmalıdır.";
    if (Object.keys(invalidFields).length > 0) {
      throw new ValidationError("Geçersiz tarih formatı.", invalidFields);
    }

    if (endsAt <= startsAt) {
      throw new ValidationError("endsAt, startsAt'dan sonra olmalıdır.", {
        endsAt: "endsAt must be after startsAt",
      });
    }

    return this.repo.create({ ...input, startsAt, endsAt });
  }
}

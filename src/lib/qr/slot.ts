export function getSlotStart(date: Date, rotationSeconds: number): Date {
  const slotMs = rotationSeconds * 1000;
  const slotStartMs = Math.floor(date.getTime() / slotMs) * slotMs;
  return new Date(slotStartMs);
}

export function getSlotEnd(slotStart: Date, rotationSeconds: number): Date {
  return new Date(slotStart.getTime() + rotationSeconds * 1000);
}

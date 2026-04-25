/**
 * Stable Firestore doc id for `dorms/{id}` and `users.dorm` (unique per building + room).
 */
export function buildDormDocKey(hallName: string, roomNumber: string): string {
  const hall = hallName.trim();
  const room = roomNumber.trim().toUpperCase();
  const hallKey = hall
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  const safeHall = hallKey.length > 0 ? hallKey : 'HALL';
  return `${safeHall}__${room}`;
}

/** Header pill: hall + room when available; legacy users may only have `dorm`. */
export function formatDormPillLabel(params: {
  hallName?: string | null;
  roomNumber?: string | null;
  dormKey: string;
}): string {
  const { hallName, roomNumber, dormKey } = params;
  if (hallName && roomNumber) return `${hallName} · ${roomNumber}`;
  if (dormKey.includes('__')) {
    const [h, r] = dormKey.split('__');
    const hallPretty = h
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return `${hallPretty} · ${r}`;
  }
  return dormKey;
}

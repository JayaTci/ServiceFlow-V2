/**
 * Parses a session user ID string to a numeric database ID.
 * @param id - The raw string ID from session.user.id.
 * @returns The parsed integer, or null if the value is missing or not a valid integer.
 */
export function parseUserId(id: string | undefined | null): number | null {
  if (!id) return null;
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
}

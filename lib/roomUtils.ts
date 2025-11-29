// Room management utilities for multi-tenant ordering

const ROOM_ID_KEY = "breakfast_room_id";

/**
 * Generate a cryptographically secure random room ID
 * Uses UUID v4 format for unpredictability
 */
export function generateRoomId(): string {
  return crypto.randomUUID();
}

/**
 * Store room ID in localStorage
 */
export function setRoomId(roomId: string): void {
  localStorage.setItem(ROOM_ID_KEY, roomId);
}

/**
 * Get room ID from localStorage
 */
export function getRoomId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROOM_ID_KEY);
}

/**
 * Clear room ID from localStorage
 */
export function clearRoomId(): void {
  localStorage.removeItem(ROOM_ID_KEY);
}

/**
 * Validate room ID format (UUID v4)
 */
export function isValidRoomId(roomId: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(roomId);
}


import type { ConversationWithParticipants, UserPublic } from "../types/api";

/** The participant in a 1-to-1 conversation that is *not* the current user. */
export function getOtherParticipant(
  conversation: ConversationWithParticipants,
  currentUserId: string,
): UserPublic | null {
  return conversation.participants.find((p) => p.id !== currentUserId) ?? null;
}

export function conversationDisplayName(
  conversation: ConversationWithParticipants,
  currentUserId: string,
): string {
  if (conversation.is_group && conversation.title) return conversation.title;
  const other = getOtherParticipant(conversation, currentUserId);
  if (other) return other.username;
  if (conversation.title) return conversation.title;
  return "Conversation";
}

/** Two-letter monogram for avatars; defaults to "?" for empty input. */
export function initialsFor(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "?").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * Hash a string to one of N palette buckets. Stable per-name, used so each
 * username gets a consistent avatar tint without storing one server-side.
 */
export function colorIndexFor(seed: string, buckets: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash) % buckets;
}

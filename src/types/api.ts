// ─── Shared types — kept in sync with backend `src/domain/entities.ts` ────────

export interface UserPublic {
  id: string;
  username: string;
  email: string;
  public_key: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string | null;
  is_group: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithParticipants extends Conversation {
  participants: UserPublic[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  ciphertext: string;
  nonce: string;
  created_at: string;
}

export interface DecryptedMessage extends Message {
  plaintext: string;
  decrypted: boolean;
}

export interface AuthResult {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface PublicKeyLookup {
  id: string;
  username: string;
  public_key: string;
}

// ─── API envelope ─────────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: string;
  details?: unknown;
}

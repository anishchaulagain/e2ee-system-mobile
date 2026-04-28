import { apiRequest } from "./client";
import type {
  ApiEnvelope,
  AuthResult,
  ConversationWithParticipants,
  Message,
  PublicKeyLookup,
  UserPublic,
} from "../types/api";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const AuthApi = {
  register(input: {
    username: string;
    email: string;
    password: string;
    publicKey?: string;
  }): Promise<ApiEnvelope<AuthResult>> {
    return apiRequest("/auth/register", { method: "POST", body: input, auth: false });
  },

  login(input: { identifier: string; password: string }): Promise<ApiEnvelope<AuthResult>> {
    return apiRequest("/auth/login", { method: "POST", body: input, auth: false });
  },

  logout(refreshToken: string): Promise<ApiEnvelope<undefined>> {
    return apiRequest("/auth/logout", {
      method: "POST",
      body: { refreshToken },
      auth: false,
    });
  },
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const UserApi = {
  me(): Promise<ApiEnvelope<UserPublic>> {
    return apiRequest("/users/me");
  },

  search(query: string): Promise<ApiEnvelope<UserPublic[]>> {
    return apiRequest("/users/search", { query: { q: query } });
  },

  updatePublicKey(publicKey: string): Promise<ApiEnvelope<undefined>> {
    return apiRequest("/users/me/public-key", { method: "PUT", body: { publicKey } });
  },

  getPublicKey(userId: string): Promise<ApiEnvelope<PublicKeyLookup>> {
    return apiRequest(`/users/${userId}/public-key`);
  },
};

// ─── Conversations & messages ─────────────────────────────────────────────────

export const ConversationApi = {
  list(): Promise<ApiEnvelope<ConversationWithParticipants[]>> {
    return apiRequest("/conversations");
  },

  get(id: string): Promise<ApiEnvelope<ConversationWithParticipants>> {
    return apiRequest(`/conversations/${id}`);
  },

  create(participantId: string): Promise<ApiEnvelope<ConversationWithParticipants>> {
    return apiRequest("/conversations", { method: "POST", body: { participantId } });
  },
};

export const MessageApi = {
  list(
    conversationId: string,
    page = 1,
    pageSize = 50,
  ): Promise<ApiEnvelope<Message[]> & { meta: { total: number; page: number; pageSize: number } }> {
    return apiRequest(`/conversations/${conversationId}/messages`, {
      query: { page, pageSize },
    });
  },

  send(conversationId: string, ciphertext: string, nonce: string): Promise<ApiEnvelope<Message>> {
    return apiRequest(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: { ciphertext, nonce },
    });
  },
};

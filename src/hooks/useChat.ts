import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ConversationApi, MessageApi, UserApi } from "../api/endpoints";
import { decryptMessage, encryptMessage, getStoredKeyPair } from "../crypto";
import { emitTyping, getSocket, joinConversation } from "../socket";
import { getOtherParticipant } from "../utils/conversation";
import type { ConversationWithParticipants, DecryptedMessage, Message } from "../types/api";

interface UseChatResult {
  conversation: ConversationWithParticipants | undefined;
  messages: DecryptedMessage[];
  isLoading: boolean;
  isReady: boolean;
  sendError: string | null;
  peerTyping: boolean;
  send: (text: string) => Promise<void>;
  setTyping: (typing: boolean) => void;
  retry: () => void;
}

const messagesKey = (conversationId: string) => ["messages", conversationId] as const;

/**
 * Owns the lifecycle of a single chat screen:
 *
 * - fetch conversation metadata + the peer's public key
 * - load message history and decrypt locally with the device's secret key
 * - listen for `new_message` events on the socket and decrypt as they arrive
 * - encrypt & send outbound messages
 * - emit / observe typing indicators
 *
 * Decryption is best-effort per message: a single bad envelope must not
 * break rendering of the rest of the thread.
 */
export function useChat(conversationId: string, currentUserId: string): UseChatResult {
  const queryClient = useQueryClient();
  const [sendError, setSendError] = useState<string | null>(null);
  const [peerTyping, setPeerTyping] = useState(false);
  const peerTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const conversationQuery = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => (await ConversationApi.get(conversationId)).data,
    staleTime: 60_000,
  });

  const conversation = conversationQuery.data;
  const peer = useMemo(
    () => (conversation ? getOtherParticipant(conversation, currentUserId) : null),
    [conversation, currentUserId],
  );

  // Peer's public key: prefer the embedded value, fall back to the dedicated endpoint
  // (peer may have registered before the public-key column was populated).
  const peerKeyQuery = useQuery({
    queryKey: ["peer-public-key", peer?.id],
    enabled: Boolean(peer),
    queryFn: async (): Promise<string | null> => {
      if (!peer) return null;
      if (peer.public_key) return peer.public_key;
      try {
        const res = await UserApi.getPublicKey(peer.id);
        return res.data.public_key;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
  });

  const messagesQuery = useQuery({
    queryKey: messagesKey(conversationId),
    queryFn: async () => {
      const res = await MessageApi.list(conversationId, 1, 100);
      return res.data;
    },
    staleTime: 0,
  });

  // ─── Decrypt cached messages ────────────────────────────────────────────────
  // We compute decrypted messages reactively. Each message is decrypted using
  // *the sender's* public key (mine if I sent it, peer's otherwise).

  const [decrypted, setDecrypted] = useState<DecryptedMessage[]>([]);

  useEffect(() => {
    let cancelled = false;
    const raw = messagesQuery.data;
    if (!raw) {
      setDecrypted([]);
      return;
    }

    (async () => {
      const kp = await getStoredKeyPair();
      if (!kp) {
        if (!cancelled) {
          setDecrypted(raw.map(toFailed));
        }
        return;
      }

      const peerKey = peerKeyQuery.data ?? null;
      // NaCl box: the shared secret derived from (mySecret, peerPublic) equals
      // the one from (peerSecret, myPublic). So the *counterpart* key for both
      // outbound (mine) and inbound (theirs) messages is always the peer's pubkey.
      const out: DecryptedMessage[] = raw.map((m) => {
        if (!peerKey) return toFailed(m);
        const plaintext = decryptMessage(m.ciphertext, m.nonce, peerKey, kp.secretKey);
        if (plaintext === null) return toFailed(m);
        return { ...m, plaintext, decrypted: true };
      });

      // Reverse to chronological order so FlatList inverted={false} shows oldest at top.
      out.reverse();

      if (!cancelled) setDecrypted(out);
    })();

    return () => {
      cancelled = true;
    };
  }, [messagesQuery.data, peerKeyQuery.data]);

  // ─── Socket: incoming messages + typing indicator ───────────────────────────

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    joinConversation(conversationId);

    const onNewMessage = (payload: { message: Message }): void => {
      if (payload.message.conversation_id !== conversationId) return;
      queryClient.setQueryData<Message[] | undefined>(messagesKey(conversationId), (prev) => {
        if (!prev) return [payload.message];
        if (prev.some((m) => m.id === payload.message.id)) return prev;
        return [payload.message, ...prev];
      });
    };

    const onTyping = (payload: {
      userId: string;
      conversationId: string;
      isTyping: boolean;
    }): void => {
      if (payload.conversationId !== conversationId) return;
      if (payload.userId === currentUserId) return;
      setPeerTyping(payload.isTyping);

      if (peerTypingTimer.current) clearTimeout(peerTypingTimer.current);
      if (payload.isTyping) {
        peerTypingTimer.current = setTimeout(() => setPeerTyping(false), 3500);
      }
    };

    socket.on("new_message", onNewMessage);
    socket.on("typing", onTyping);

    return () => {
      socket.off("new_message", onNewMessage);
      socket.off("typing", onTyping);
      if (peerTypingTimer.current) clearTimeout(peerTypingTimer.current);
    };
  }, [conversationId, currentUserId, queryClient]);

  // ─── Send ────────────────────────────────────────────────────────────────────

  const send = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setSendError(null);

      const kp = await getStoredKeyPair();
      const peerKey = peerKeyQuery.data;
      if (!kp || !peerKey) {
        setSendError("Can't send: encryption keys aren't ready yet.");
        return;
      }

      try {
        const { ciphertext, nonce } = encryptMessage(trimmed, peerKey, kp.secretKey);
        const res = await MessageApi.send(conversationId, ciphertext, nonce);

        // Optimistically prepend the server-confirmed message into the cache.
        // The socket round-trip will dedupe it via the `id` check.
        queryClient.setQueryData<Message[] | undefined>(messagesKey(conversationId), (prev) => {
          if (!prev) return [res.data];
          if (prev.some((m) => m.id === res.data.id)) return prev;
          return [res.data, ...prev];
        });
      } catch (err) {
        setSendError(err instanceof Error ? err.message : "Failed to send message");
        throw err;
      }
    },
    [conversationId, peerKeyQuery.data, queryClient],
  );

  const setTyping = useCallback(
    (typing: boolean): void => {
      emitTyping(conversationId, typing);
    },
    [conversationId],
  );

  const retry = useCallback(() => {
    void messagesQuery.refetch();
  }, [messagesQuery]);

  const isReady = Boolean(peerKeyQuery.data);
  const isLoading =
    conversationQuery.isLoading || messagesQuery.isLoading || peerKeyQuery.isLoading;

  return {
    conversation,
    messages: decrypted,
    isLoading,
    isReady,
    sendError,
    peerTyping,
    send,
    setTyping,
    retry,
  };
}

function toFailed(m: Message): DecryptedMessage {
  return { ...m, plaintext: "", decrypted: false };
}

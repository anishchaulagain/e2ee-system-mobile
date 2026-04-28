import { io, Socket } from "socket.io-client";
import { env } from "../config/env";
import type { Message } from "../types/api";

export interface SocketEvents {
  new_message: (payload: { message: Message }) => void;
  user_online: (payload: { userId: string; online: boolean }) => void;
  typing: (payload: {
    userId: string;
    username: string;
    conversationId: string;
    isTyping: boolean;
  }) => void;
}

let socket: Socket | null = null;
let activeToken: string | null = null;

export function getSocket(): Socket | null {
  return socket;
}

/**
 * Connect (or reconnect) the Socket.IO client with the given access token.
 * Idempotent — if a live connection already uses this token, the existing
 * socket is returned untouched.
 */
export function connectSocket(token: string): Socket {
  if (socket && activeToken === token && socket.connected) {
    return socket;
  }

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socket = io(env.socketUrl, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });
  activeToken = token;
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    activeToken = null;
  }
}

export function emitTyping(conversationId: string, isTyping: boolean): void {
  socket?.emit("typing", { conversationId, isTyping });
}

export function joinConversation(conversationId: string): void {
  socket?.emit("join_conversation", conversationId);
}

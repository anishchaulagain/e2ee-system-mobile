import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { ConversationApi } from "../api/endpoints";
import { getSocket } from "../socket";
import type { ConversationWithParticipants } from "../types/api";

export const conversationsKey = ["conversations"] as const;

export function useConversations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: conversationsKey,
    queryFn: async () => (await ConversationApi.list()).data,
    staleTime: 30_000,
  });

  // Bump conversation order when new messages arrive while we're on the list screen.
  // The actual updated_at is recomputed on the server; this just nudges a refetch.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (): void => {
      void queryClient.invalidateQueries({ queryKey: conversationsKey });
    };

    socket.on("new_message", handler);
    return () => {
      socket.off("new_message", handler);
    };
  }, [queryClient]);

  return query;
}

export function useConversationCache(): {
  prepend: (c: ConversationWithParticipants) => void;
} {
  const queryClient = useQueryClient();
  return {
    prepend(conversation) {
      queryClient.setQueryData<ConversationWithParticipants[] | undefined>(
        conversationsKey,
        (prev) => {
          if (!prev) return [conversation];
          if (prev.some((p) => p.id === conversation.id)) return prev;
          return [conversation, ...prev];
        },
      );
    },
  };
}

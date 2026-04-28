import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { Avatar } from "../../../src/components/Avatar";
import { MessageBubble } from "../../../src/components/MessageBubble";
import { Screen } from "../../../src/components/Screen";
import { useChat } from "../../../src/hooks/useChat";
import { useAuthStore } from "../../../src/state/auth";
import { useThemeStore } from "../../../src/state/theme";
import { themeColors } from "../../../src/theme/colors";
import { conversationDisplayName } from "../../../src/utils/conversation";
import { formatDayHeader } from "../../../src/utils/time";
import type { DecryptedMessage } from "../../../src/types/api";

type ListItem =
  | { type: "header"; key: string; label: string }
  | { type: "message"; key: string; message: DecryptedMessage; showTail: boolean };

/** Group messages by day and decide which ones get a "tail" (last in a sender run). */
function buildItems(messages: DecryptedMessage[]): ListItem[] {
  const out: ListItem[] = [];
  let lastDayKey = "";

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]!;
    const dayKey = new Date(m.created_at).toDateString();
    if (dayKey !== lastDayKey) {
      out.push({ type: "header", key: `h-${dayKey}`, label: formatDayHeader(m.created_at) });
      lastDayKey = dayKey;
    }
    const next = messages[i + 1];
    const showTail = !next || next.sender_id !== m.sender_id;
    out.push({ type: "message", key: m.id, message: m, showTail });
  }
  return out;
}

export default function ChatScreen(): JSX.Element {
  const params = useLocalSearchParams<{ id: string }>();
  const conversationId = params.id ?? "";
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const resolved = useThemeStore((s) => s.resolved);
  const c = themeColors[resolved];

  const {
    conversation,
    messages,
    isLoading,
    isReady,
    sendError,
    peerTyping,
    send,
    setTyping,
  } = useChat(conversationId, user?.id ?? "");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ListItem>>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headerName = useMemo(() => {
    if (!conversation || !user) return "";
    return conversationDisplayName(conversation, user.id);
  }, [conversation, user]);

  const items = useMemo(() => buildItems(messages), [messages]);

  // Stop emitting "typing" on unmount or conversation change.
  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      setTyping(false);
    };
  }, [setTyping]);

  // Auto-scroll to bottom when new messages land.
  useEffect(() => {
    if (items.length === 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [items.length]);

  const handleChangeText = (text: string): void => {
    setDraft(text);
    setTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 1500);
  };

  const handleSend = async (): Promise<void> => {
    const text = draft;
    if (!text.trim() || sending) return;
    setSending(true);
    setDraft("");
    setTyping(false);
    try {
      await send(text);
    } catch {
      // restore draft on failure so the user can retry
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-cream-200 px-4 pb-3 pt-1 dark:border-clay-700">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color={c.textPrimary} />
        </Pressable>
        <Avatar name={headerName || "?"} size={40} />
        <View className="flex-1">
          <Text className="text-base font-semibold text-clay-700 dark:text-cream-100" numberOfLines={1}>
            {headerName || "Conversation"}
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="lock-closed" size={10} color="#7D6E5C" />
            <Text className="text-xs text-clay-400 dark:text-clay-200">
              {peerTyping ? "typing…" : "End-to-end encrypted"}
            </Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 88 : 0}
      >
        {isLoading && messages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#D97757" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={items}
            keyExtractor={(it) => it.key}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, flexGrow: 1 }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-8 py-24">
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-cream-200 dark:bg-clay-700">
                  <Ionicons name="lock-closed" size={22} color="#D97757" />
                </View>
                <Text className="text-center text-base font-semibold text-clay-700 dark:text-cream-100">
                  This is the start of your conversation
                </Text>
                <Text className="mt-1 text-center text-sm text-clay-400 dark:text-clay-200">
                  Messages are encrypted on this device — only you and{" "}
                  {headerName || "your contact"} can read them.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              if (item.type === "header") {
                return (
                  <View className="my-3 items-center">
                    <View className="rounded-full bg-cream-200 px-3 py-1 dark:bg-clay-700">
                      <Text className="text-[11px] font-medium text-clay-500 dark:text-clay-200">
                        {item.label}
                      </Text>
                    </View>
                  </View>
                );
              }
              return (
                <MessageBubble
                  text={item.message.plaintext}
                  decrypted={item.message.decrypted}
                  fromMe={item.message.sender_id === user?.id}
                  timestamp={item.message.created_at}
                  showTail={item.showTail}
                />
              );
            }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {sendError ? (
          <View className="mx-4 mb-1 flex-row items-center gap-2 rounded-xl bg-red-50 px-3 py-2 dark:bg-red-900/30">
            <Ionicons name="alert-circle" size={14} color="#DC2626" />
            <Text className="flex-1 text-xs text-red-600 dark:text-red-300">{sendError}</Text>
          </View>
        ) : null}

        {/* Composer */}
        <View
          className="flex-row items-end gap-2 border-t border-cream-200 bg-cream-100 px-3 py-2 dark:border-clay-700 dark:bg-clay-800"
          style={{ paddingBottom: Platform.OS === "ios" ? 24 : 12 }}
        >
          <View className="flex-1 flex-row items-end rounded-3xl border border-cream-300 bg-cream-50 px-4 py-1 dark:border-clay-500 dark:bg-clay-700">
            <TextInput
              value={draft}
              onChangeText={handleChangeText}
              placeholder={isReady ? "Message" : "Setting up encryption…"}
              placeholderTextColor={c.textSecondary}
              multiline
              editable={isReady}
              className="flex-1 text-base text-clay-700 dark:text-cream-100"
              style={{ maxHeight: 120, minHeight: 36, paddingTop: 8, paddingBottom: 8 }}
              selectionColor={c.accent}
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim() || sending || !isReady}
            className="h-11 w-11 items-center justify-center rounded-full bg-ember-500"
            style={({ pressed }) => [
              { opacity: !draft.trim() || sending || !isReady ? 0.4 : pressed ? 0.85 : 1 },
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#FBF8F3" size="small" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#FBF8F3" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

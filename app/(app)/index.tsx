import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ConversationItem } from "../../src/components/ConversationItem";
import { EmptyState } from "../../src/components/EmptyState";
import { Screen } from "../../src/components/Screen";
import { useAuthStore } from "../../src/state/auth";
import { useConversations } from "../../src/hooks/useConversations";
import { conversationDisplayName } from "../../src/utils/conversation";

export default function ConversationsScreen(): JSX.Element {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isRefetching, refetch } = useConversations();

  const items = useMemo(() => data ?? [], [data]);

  return (
    <Screen className="bg-cream-100 dark:bg-clay-800">
      <View className="flex-row items-center justify-between px-5 pb-2 pt-2">
        <View>
          <Text className="text-3xl font-bold text-clay-700 dark:text-cream-100">Chats</Text>
          {user ? (
            <Text className="mt-0.5 text-sm text-clay-400 dark:text-clay-200">
              Signed in as @{user.username}
            </Text>
          ) : null}
        </View>
        <View className="flex-row items-center gap-1.5">
          <Pressable
            onPress={() => router.push("/(app)/settings")}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full bg-cream-200 dark:bg-clay-700"
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="settings-outline" size={20} color="#7D6E5C" />
          </Pressable>
          <Pressable
            onPress={() => router.push("/(app)/new-chat")}
            hitSlop={8}
            className="h-11 w-11 items-center justify-center rounded-full bg-ember-500"
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="create-outline" size={20} color="#FBF8F3" />
          </Pressable>
        </View>
      </View>

      {isLoading && items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D97757" />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          description="Start a new chat to send your first end-to-end encrypted message."
          action={
            <Pressable
              onPress={() => router.push("/(app)/new-chat")}
              className="self-stretch items-center rounded-2xl bg-ember-500 py-3.5"
              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
            >
              <Text className="text-base font-semibold text-cream-50">Start a chat</Text>
            </Pressable>
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          ItemSeparatorComponent={() => (
            <View className="ml-[88px] h-px bg-cream-200 dark:bg-clay-700" />
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#D97757"
            />
          }
          renderItem={({ item }) => {
            const name = user ? conversationDisplayName(item, user.id) : "Conversation";
            return (
              <ConversationItem
                name={name}
                preview="End-to-end encrypted chat"
                timestamp={item.updated_at}
                onPress={() =>
                  router.push({ pathname: "/(app)/chat/[id]", params: { id: item.id } })
                }
              />
            );
          }}
        />
      )}
    </Screen>
  );
}

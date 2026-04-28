import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

import { ConversationApi } from "../../src/api/endpoints";
import { Avatar } from "../../src/components/Avatar";
import { EmptyState } from "../../src/components/EmptyState";
import { Input } from "../../src/components/Input";
import { Screen } from "../../src/components/Screen";
import { useConversationCache } from "../../src/hooks/useConversations";
import { useUserSearch } from "../../src/hooks/useUserSearch";

export default function NewChatScreen(): JSX.Element {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [creatingFor, setCreatingFor] = useState<string | null>(null);
  const search = useUserSearch(query);
  const { prepend } = useConversationCache();

  const startChat = async (userId: string): Promise<void> => {
    setCreatingFor(userId);
    try {
      const res = await ConversationApi.create(userId);
      prepend(res.data);
      router.replace({ pathname: "/(app)/chat/[id]", params: { id: res.data.id } });
    } finally {
      setCreatingFor(null);
    }
  };

  const results = search.data ?? [];
  const hasQuery = query.trim().length > 0;

  return (
    <Screen>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="chevron-back" size={24} color="#5A4E3F" />
        </Pressable>
        <Text className="text-xl font-semibold text-clay-700 dark:text-cream-100">New chat</Text>
      </View>

      <View className="px-4 pb-3">
        <Input
          placeholder="Search by username"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          value={query}
          onChangeText={setQuery}
          leftIcon={<Ionicons name="search" size={18} color="#A89886" />}
          rightSlot={
            query.length > 0 ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color="#A89886" />
              </Pressable>
            ) : undefined
          }
        />
      </View>

      {!hasQuery ? (
        <EmptyState
          icon="search-outline"
          title="Find someone to chat with"
          description="Start typing a username to find friends already on Cipher."
        />
      ) : search.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#D97757" />
        </View>
      ) : results.length === 0 ? (
        <EmptyState
          icon="person-remove-outline"
          title="No matches"
          description={`Nobody found for "${query}". Check the spelling or try a different name.`}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(u) => u.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          ItemSeparatorComponent={() => (
            <View className="ml-[80px] h-px bg-cream-200 dark:bg-clay-700" />
          )}
          renderItem={({ item }) => {
            const isCreating = creatingFor === item.id;
            return (
              <Pressable
                onPress={() => startChat(item.id)}
                disabled={isCreating}
                style={({ pressed }) => [{ opacity: pressed ? 0.65 : 1 }]}
                className="flex-row items-center gap-3 px-5 py-3.5"
              >
                <Avatar name={item.username} size={48} />
                <View className="flex-1">
                  <Text
                    className="text-base font-semibold text-clay-700 dark:text-cream-100"
                    numberOfLines={1}
                  >
                    {item.username}
                  </Text>
                  <Text
                    className="mt-0.5 text-sm text-clay-400 dark:text-clay-200"
                    numberOfLines={1}
                  >
                    {item.email}
                  </Text>
                </View>
                {isCreating ? (
                  <ActivityIndicator color="#D97757" />
                ) : !item.public_key ? (
                  <View className="rounded-full bg-clay-200 px-2 py-0.5 dark:bg-clay-600">
                    <Text className="text-[10px] text-clay-500 dark:text-clay-200">no key</Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#A89886" />
                )}
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}

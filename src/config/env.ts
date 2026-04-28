import Constants from "expo-constants";

type Extra = {
  apiUrl?: string;
  socketUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

const fallbackApi = "http://localhost:3000";

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? fallbackApi,
  socketUrl:
    process.env.EXPO_PUBLIC_SOCKET_URL ??
    extra.socketUrl ??
    process.env.EXPO_PUBLIC_API_URL ??
    extra.apiUrl ??
    fallbackApi,
  apiBase: "/api/v1",
};

export const apiBaseUrl = `${env.apiUrl}${env.apiBase}`;

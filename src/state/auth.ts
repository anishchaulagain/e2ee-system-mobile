import { create } from "zustand";

import { AuthApi, UserApi } from "../api/endpoints";
import { ApiError } from "../api/client";
import { secureStorage, StorageKeys } from "../utils/storage";
import { clearKeyPair, loadOrCreateKeyPair } from "../crypto";
import { connectSocket, disconnectSocket } from "../socket";
import type { UserPublic } from "../types/api";

type Status = "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: Status;
  user: UserPublic | null;
  error: string | null;

  /** Hydrate auth state from secure storage at app startup. */
  bootstrap: () => Promise<void>;

  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  /** Internal — wired to the API client so a hard 401 (refresh failed) clears state. */
  forceLogout: () => Promise<void>;
}

async function persistTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    secureStorage.set(StorageKeys.accessToken, accessToken),
    secureStorage.set(StorageKeys.refreshToken, refreshToken),
  ]);
}

async function clearTokens(): Promise<void> {
  await Promise.all([
    secureStorage.remove(StorageKeys.accessToken),
    secureStorage.remove(StorageKeys.refreshToken),
    secureStorage.remove(StorageKeys.userId),
  ]);
}

/**
 * Ensure the device's E2EE keypair is generated and that the server has our
 * public key on file. Called after every successful login/register so a
 * returning device with a fresh server account still uploads its key.
 */
async function ensureKeyMaterial(currentUser: UserPublic): Promise<void> {
  const kp = await loadOrCreateKeyPair();
  if (currentUser.public_key !== kp.publicKey) {
    await UserApi.updatePublicKey(kp.publicKey);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "loading",
  user: null,
  error: null,

  async bootstrap() {
    try {
      const token = await secureStorage.get(StorageKeys.accessToken);
      if (!token) {
        set({ status: "unauthenticated", user: null });
        return;
      }

      // Prove the token is still valid by hitting /users/me — this also handles
      // the 401-then-refresh path through the API client transparently.
      const me = await UserApi.me();
      await ensureKeyMaterial(me.data);
      connectSocket(token);
      set({ status: "authenticated", user: me.data, error: null });
    } catch (err) {
      // Refresh failed (or network down on cold start) — sit in unauthenticated
      // and let the user log in again. Don't surface a noisy error.
      await clearTokens();
      set({ status: "unauthenticated", user: null, error: null });
      void err;
    }
  },

  async login(identifier, password) {
    set({ error: null });
    try {
      const result = await AuthApi.login({ identifier, password });
      await persistTokens(result.data.accessToken, result.data.refreshToken);
      await secureStorage.set(StorageKeys.userId, result.data.userId);

      const me = await UserApi.me();
      await ensureKeyMaterial(me.data);
      connectSocket(result.data.accessToken);
      set({ status: "authenticated", user: me.data, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      set({ error: msg });
      throw err;
    }
  },

  async register(username, email, password) {
    set({ error: null });
    try {
      // Generate a keypair locally first so we can include the public key in registration.
      const kp = await loadOrCreateKeyPair();
      const result = await AuthApi.register({
        username,
        email,
        password,
        publicKey: kp.publicKey,
      });
      await persistTokens(result.data.accessToken, result.data.refreshToken);
      await secureStorage.set(StorageKeys.userId, result.data.userId);

      const me = await UserApi.me();
      connectSocket(result.data.accessToken);
      set({ status: "authenticated", user: me.data, error: null });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Registration failed";
      set({ error: msg });
      throw err;
    }
  },

  async logout() {
    const refreshToken = await secureStorage.get(StorageKeys.refreshToken);
    disconnectSocket();
    if (refreshToken) {
      // Best-effort revocation; never block logout on network failure.
      try {
        await AuthApi.logout(refreshToken);
      } catch {
        // ignore
      }
    }
    await clearTokens();
    // Note: keypair is intentionally preserved on logout — it's bound to the
    // user account on the server. Clearing it would force a re-key dance on
    // next login, which would invalidate previously delivered ciphertexts.
    void get;
    set({ status: "unauthenticated", user: null, error: null });
  },

  async forceLogout() {
    disconnectSocket();
    await clearTokens();
    await clearKeyPair();
    set({ status: "unauthenticated", user: null, error: null });
  },
}));

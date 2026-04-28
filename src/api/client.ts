import { apiBaseUrl } from "../config/env";
import { secureStorage, StorageKeys } from "../utils/storage";
import type { ApiEnvelope } from "../types/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  auth?: boolean;
  /** Internal: avoid infinite recursion when the refresh call itself 401s. */
  _retry?: boolean;
}

let onUnauthorized: (() => void) | null = null;

/**
 * Register a callback fired when the API returns 401 *after* a refresh attempt.
 * Auth store calls this on mount to wire up logout-on-stale-session behaviour.
 */
export function setUnauthorizedHandler(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

let refreshPromise: Promise<string> | null = null;

/** Refresh the access token. Coalesces concurrent callers onto one in-flight request. */
async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await secureStorage.get(StorageKeys.refreshToken);
    if (!refreshToken) throw new ApiError(401, "No refresh token");

    const res = await fetch(`${apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new ApiError(res.status, "Refresh failed", text);
    }

    const json = (await res.json()) as ApiEnvelope<{
      accessToken: string;
      refreshToken: string;
    }>;

    await Promise.all([
      secureStorage.set(StorageKeys.accessToken, json.data.accessToken),
      secureStorage.set(StorageKeys.refreshToken, json.data.refreshToken),
    ]);

    return json.data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${apiBaseUrl}${path}`);
  if (query) {
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined) url.searchParams.set(key, String(val));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, _retry = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (auth) {
    const token = await secureStorage.get(StorageKeys.accessToken);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // `fetch` throws TypeError on DNS / connection-refused / TLS failure.
    // Turn that into something the UI can actually show the user.
    const msg = err instanceof Error ? err.message : "Network error";
    throw new ApiError(0, `Can't reach server (${apiBaseUrl}). ${msg}`);
  }

  // Try to refresh once on 401 — covers the natural case where the access token
  // expires mid-session. If refresh succeeds, replay the original request.
  if (res.status === 401 && auth && !_retry) {
    try {
      await refreshAccessToken();
      return apiRequest<T>(path, { ...options, _retry: true });
    } catch {
      onUnauthorized?.();
      throw new ApiError(401, "Session expired");
    }
  }

  if (!res.ok) {
    let details: unknown;
    let message = `Request failed (${res.status})`;
    try {
      const json = (await res.json()) as { error?: string; details?: unknown };
      if (json.error) message = json.error;
      details = json.details;
    } catch {
      // non-JSON body — fall back to the default message
    }
    throw new ApiError(res.status, message, details);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

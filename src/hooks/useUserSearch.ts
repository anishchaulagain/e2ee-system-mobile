import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserApi } from "../api/endpoints";

/**
 * Debounced username search. Returns the latest committed query along with
 * its results — callers can show the input value freely and rely on this
 * hook to throttle network traffic.
 */
export function useUserSearch(rawQuery: string, debounceMs = 250) {
  const [debounced, setDebounced] = useState(rawQuery.trim());

  useEffect(() => {
    const t = setTimeout(() => setDebounced(rawQuery.trim()), debounceMs);
    return () => clearTimeout(t);
  }, [rawQuery, debounceMs]);

  return useQuery({
    queryKey: ["user-search", debounced],
    queryFn: async () => (await UserApi.search(debounced)).data,
    enabled: debounced.length > 0,
    staleTime: 30_000,
  });
}

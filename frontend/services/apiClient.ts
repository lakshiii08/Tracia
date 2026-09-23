import { isMockEnabled, getApiBaseUrl } from "@/lib/config";

/**
 * Universal typed API client.
 * When mock data is enabled (NEXT_PUBLIC_USE_MOCK_DATA=true), returns mock data.
 * When mock data is disabled (NEXT_PUBLIC_USE_MOCK_DATA=false), queries real backend directly
 * without falling back to mock data if real data is not present or an error occurs.
 */
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
  mockFallback?: () => T | Promise<T>
): Promise<T> {
  const mockActive = isMockEnabled();

  // Mock data strictly enabled/disabled through env
  if (mockActive && mockFallback) {
    return Promise.resolve(mockFallback());
  }

  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const isInternalApiRoute = cleanEndpoint.startsWith("/api/");
  const fullUrl = endpoint.startsWith("http")
    ? endpoint
    : isInternalApiRoute
    ? cleanEndpoint
    : `${baseUrl}${cleanEndpoint}`;

  const res = await fetch(fullUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${res.statusText}`);
  }

  return (await res.json()) as T;
}

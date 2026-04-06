import type { Env, TokenData, PaginatedResponse } from "./types.js";

const API_BASE = "https://api.prod.whoop.com/developer";
const TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

async function refreshAccessToken(env: Env, userId: string): Promise<string> {
  const raw = await env.WHOOP_TOKENS.get(userId);
  if (!raw) throw new Error("Not authenticated. Please connect your WHOOP account.");

  const tokens: TokenData = JSON.parse(raw);
  if (!tokens.refresh_token) {
    throw new Error("No refresh token available. Please re-authenticate.");
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: env.WHOOP_CLIENT_ID,
      client_secret: env.WHOOP_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    await env.WHOOP_TOKENS.delete(userId);
    throw new Error("Token refresh failed. Please re-authenticate.");
  }

  const data: any = await response.json();
  const newTokens: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
  await env.WHOOP_TOKENS.put(userId, JSON.stringify(newTokens));
  return newTokens.access_token;
}

async function getValidToken(env: Env, userId: string): Promise<string> {
  const raw = await env.WHOOP_TOKENS.get(userId);
  if (!raw) throw new Error("Not authenticated. Please connect your WHOOP account.");

  const tokens: TokenData = JSON.parse(raw);

  if (Date.now() >= tokens.expires_at - 60_000) {
    return refreshAccessToken(env, userId);
  }

  return tokens.access_token;
}

async function whoopFetch(
  env: Env,
  userId: string,
  path: string,
  params?: Record<string, string>
): Promise<any> {
  const token = await getValidToken(env, userId);
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    const newToken = await refreshAccessToken(env, userId);
    const retry = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${newToken}` },
    });
    if (!retry.ok) throw new Error(`WHOOP API error: ${retry.status}`);
    return retry.json();
  }

  if (response.status === 429) {
    throw new Error("Rate limited by WHOOP API. Please wait a moment and try again.");
  }

  if (!response.ok) {
    throw new Error(`WHOOP API error: ${response.status}`);
  }

  return response.json();
}

async function fetchAllPages<T>(
  env: Env,
  userId: string,
  path: string,
  params?: Record<string, string>
): Promise<T[]> {
  const allRecords: T[] = [];
  let nextToken: string | undefined;

  do {
    const queryParams: Record<string, string> = { ...params, limit: "25" };
    if (nextToken) queryParams.nextToken = nextToken;

    const data: PaginatedResponse<T> = await whoopFetch(env, userId, path, queryParams);
    allRecords.push(...data.records);
    nextToken = data.next_token;
  } while (nextToken);

  return allRecords;
}

// --- Public API ---

export async function getProfile(env: Env, userId: string) {
  return whoopFetch(env, userId, "/v2/user/profile/basic");
}

export async function getBodyMeasurement(env: Env, userId: string) {
  return whoopFetch(env, userId, "/v2/user/measurement/body");
}

export async function getRecoveries(env: Env, userId: string, start?: string, end?: string) {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  return fetchAllPages(env, userId, "/v2/recovery", params);
}

export async function getCycles(env: Env, userId: string, start?: string, end?: string) {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  return fetchAllPages(env, userId, "/v2/cycle", params);
}

export async function getSleeps(env: Env, userId: string, start?: string, end?: string) {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  return fetchAllPages(env, userId, "/v2/activity/sleep", params);
}

export async function getSleep(env: Env, userId: string, sleepId: string) {
  return whoopFetch(env, userId, `/v2/activity/sleep/${sleepId}`);
}

export async function getWorkouts(env: Env, userId: string, start?: string, end?: string) {
  const params: Record<string, string> = {};
  if (start) params.start = start;
  if (end) params.end = end;
  return fetchAllPages(env, userId, "/v2/activity/workout", params);
}

export async function getWorkout(env: Env, userId: string, workoutId: string) {
  return whoopFetch(env, userId, `/v2/activity/workout/${workoutId}`);
}

export async function getCycleRecovery(env: Env, userId: string, cycleId: string) {
  return whoopFetch(env, userId, `/v2/cycle/${cycleId}/recovery`);
}

export async function getCycleSleep(env: Env, userId: string, cycleId: string) {
  return whoopFetch(env, userId, `/v2/cycle/${cycleId}/sleep`);
}

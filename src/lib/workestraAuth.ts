export interface WorkestraUser {
  uid: string;
  displayName: string;
  email: string;
  plan: string;
  isPremium: boolean;
  ministryName?: string;
  photoURL?: string | null;
}

export type WorkestraAuthErrorCode =
  | "API_NOT_CONFIGURED"
  | "INVALID_API_URL"
  | "INVALID_CREDENTIALS"
  | "PREMIUM_REQUIRED"
  | "INVALID_TOKEN"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export class WorkestraAuthError extends Error {
  code: WorkestraAuthErrorCode;

  constructor(code: WorkestraAuthErrorCode, message?: string) {
    super(message || code);
    this.name = "WorkestraAuthError";
    this.code = code;
  }
}

export function getWorkestraApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_WORKESTRA_API_URL as string | undefined)?.trim() || "";
  if (!raw) {
    // Use built-in same-origin Vercel / Express API routes (/api/tools/*)
    return "";
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new WorkestraAuthError("INVALID_API_URL");
  }

  const isLocalhost =
    parsed.hostname === "localhost" ||
    parsed.hostname === "127.0.0.1";

  if (parsed.protocol !== "https:" && !(isLocalhost && parsed.protocol === "http:")) {
    throw new WorkestraAuthError("INVALID_API_URL");
  }

  return parsed.origin + parsed.pathname.replace(/\/+$/, "");
}

function isUserPremium(rawUser: Record<string, unknown>): boolean {
  if (rawUser.isPremium === true || rawUser.premium === true) {
    return true;
  }

  const planRaw = String(
    rawUser.plan ?? rawUser.plano ?? rawUser.subscriptionPlan ?? ""
  )
    .trim()
    .toLowerCase();

  return (
    planRaw === "premium" ||
    planRaw === "plano premium" ||
    planRaw.includes("premium")
  );
}

function normalizeUser(rawUser: Record<string, unknown>): WorkestraUser {
  const isPremium = isUserPremium(rawUser);
  const email = String(rawUser.email || "").trim();
  const displayName = String(
    rawUser.displayName || rawUser.name || rawUser.nome || email.split("@")[0] || "Músico"
  ).trim();
  const plan = String(
    rawUser.plan || rawUser.plano || (isPremium ? "Plano Premium" : "Gratuito")
  ).trim();

  const rawPhoto = rawUser.photoURL ?? rawUser.avatarUrl;
  let safePhotoURL: string | null = null;
  if (typeof rawPhoto === "string" && rawPhoto.trim()) {
    try {
      const parsedPhoto = new URL(rawPhoto.trim());
      if (parsedPhoto.protocol === "https:" || parsedPhoto.protocol === "http:") {
        safePhotoURL = parsedPhoto.href;
      }
    } catch {
      safePhotoURL = null;
    }
  }

  return {
    uid: String(rawUser.id || rawUser._id || rawUser.uid || email),
    displayName,
    email,
    plan,
    isPremium,
    ministryName: rawUser.ministryName
      ? String(rawUser.ministryName)
      : rawUser.igreja || rawUser.ministerio
      ? String(rawUser.igreja || rawUser.ministerio)
      : undefined,
    photoURL: safePhotoURL,
  };
}

export async function loginWithWorkestra(
  email: string,
  password: string
): Promise<{ token: string; user: WorkestraUser }> {
  const apiBase = getWorkestraApiBaseUrl();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new WorkestraAuthError("INVALID_CREDENTIALS");
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase}/api/tools/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: cleanEmail,
        password,
      }),
    });
  } catch {
    throw new WorkestraAuthError("NETWORK_ERROR");
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (response.status === 401) {
    throw new WorkestraAuthError(
      "INVALID_CREDENTIALS",
      typeof payload.error === "string" ? payload.error : undefined
    );
  }

  if (response.status === 403) {
    throw new WorkestraAuthError(
      "PREMIUM_REQUIRED",
      typeof payload.error === "string" ? payload.error : undefined
    );
  }

  if (response.status === 503) {
    throw new WorkestraAuthError(
      "API_NOT_CONFIGURED",
      typeof payload.error === "string" ? payload.error : undefined
    );
  }

  if (!response.ok) {
    throw new WorkestraAuthError(
      "UNKNOWN_ERROR",
      typeof payload.error === "string" ? payload.error : `HTTP ${response.status}`
    );
  }

  const rawUser = (payload.user as Record<string, unknown> | undefined) || payload;
  const user = normalizeUser(rawUser);

  if (!user.isPremium) {
    throw new WorkestraAuthError("PREMIUM_REQUIRED");
  }

  const token = typeof payload.token === "string" ? payload.token : "";
  if (!token) {
    throw new WorkestraAuthError("INVALID_TOKEN");
  }

  return { token, user };
}

export async function verifyWorkestraToken(
  token: string
): Promise<{ token: string; user: WorkestraUser }> {
  const apiBase = getWorkestraApiBaseUrl();
  const cleanToken = token.trim();

  if (!cleanToken) {
    throw new WorkestraAuthError("INVALID_TOKEN");
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase}/api/tools/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${cleanToken}`,
      },
      body: JSON.stringify({ token: cleanToken }),
    });
  } catch {
    throw new WorkestraAuthError("NETWORK_ERROR");
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (response.status === 401) {
    throw new WorkestraAuthError(
      "INVALID_TOKEN",
      typeof payload.error === "string" ? payload.error : undefined
    );
  }

  if (response.status === 403) {
    throw new WorkestraAuthError(
      "PREMIUM_REQUIRED",
      typeof payload.error === "string" ? payload.error : undefined
    );
  }

  if (response.status === 503) {
    throw new WorkestraAuthError(
      "API_NOT_CONFIGURED",
      typeof payload.error === "string" ? payload.error : undefined
    );
  }

  if (!response.ok) {
    throw new WorkestraAuthError(
      "UNKNOWN_ERROR",
      typeof payload.error === "string" ? payload.error : `HTTP ${response.status}`
    );
  }

  const rawUser = (payload.user as Record<string, unknown> | undefined) || payload;
  const user = normalizeUser(rawUser);

  if (!user.isPremium) {
    throw new WorkestraAuthError("PREMIUM_REQUIRED");
  }

  const refreshedToken =
    typeof payload.token === "string" && payload.token.trim()
      ? payload.token.trim()
      : cleanToken;

  return { token: refreshedToken, user };
}

export async function logoutWorkestra(token: string | null): Promise<void> {
  if (!token) return;
  try {
    const apiBase = getWorkestraApiBaseUrl();
    await fetch(`${apiBase}/api/tools/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Clearing local in-memory session should always succeed even if API is unreachable
  }
}

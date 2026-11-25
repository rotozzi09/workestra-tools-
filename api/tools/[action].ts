import type { IncomingMessage, ServerResponse } from "node:http";

export interface AuthenticatedWorkestraUser {
  id: string;
  displayName: string;
  email: string;
  plan: string;
  isPremium: boolean;
  ministryName?: string;
  photoURL?: string | null;
}

export interface ApiRequest extends IncomingMessage {
  body?: unknown;
  query?: Record<string, unknown>;
  params?: Record<string, string | undefined>;
}

export interface ApiResponse extends ServerResponse {
  status?: (code: number) => ApiResponse;
  json?: (data: unknown) => void;
}

class AuthApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const DEFAULT_UPSTREAM_URL = "https://workestra.app.br";

function getUpstreamBaseUrl(): string {
  const raw = process.env.WORKESTRA_UPSTREAM_URL?.trim();
  if (!raw) return DEFAULT_UPSTREAM_URL;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch {
    // Fall back to default trusted upstream origin
  }
  return DEFAULT_UPSTREAM_URL;
}

function sendJson(res: ApiResponse, statusCode: number, data: unknown): void {
  if (typeof res.status === "function" && typeof res.json === "function") {
    const withStatus = res.status(statusCode);
    if (typeof withStatus.json === "function") {
      withStatus.json(data);
      return;
    }
  }
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

async function parseJsonBody(req: ApiRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }

  if (typeof req.body === "string") {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    const MAX_BODY_BYTES = 16 * 1024;

    req.on("data", (chunk: Buffer) => {
      totalBytes += chunk.length;
      if (totalBytes <= MAX_BODY_BYTES) {
        chunks.push(chunk);
      }
    });

    req.on("end", () => {
      if (totalBytes > MAX_BODY_BYTES || chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        const parsed = JSON.parse(raw);
        resolve(parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {});
      } catch {
        resolve({});
      }
    });

    req.on("error", () => resolve({}));
  });
}

function resolveAction(req: ApiRequest): string {
  const paramAction = req.params?.action || req.query?.action;
  if (typeof paramAction === "string" && paramAction.trim()) {
    return paramAction.trim().toLowerCase();
  }
  const urlPath = (req.url || "").split("?")[0].replace(/\/+$/, "");
  const segments = urlPath.split("/").filter(Boolean);
  return (segments[segments.length - 1] || "").toLowerCase();
}

function isStatusInactive(statusValue: unknown): boolean {
  const status = String(statusValue ?? "").trim().toLowerCase();
  return (
    status === "inactive" ||
    status === "inativo" ||
    status === "blocked" ||
    status === "bloqueado" ||
    status === "suspended" ||
    status === "suspenso" ||
    status === "canceled" ||
    status === "cancelado"
  );
}

function evaluatePlan(rawUser: Record<string, unknown>): {
  isPremium: boolean;
  planLabel: string;
  ministryName?: string;
} {
  const tenant =
    rawUser.tenant && typeof rawUser.tenant === "object"
      ? (rawUser.tenant as Record<string, unknown>)
      : null;

  const ministryName =
    typeof (tenant?.name || tenant?.nome || rawUser.ministryName || rawUser.igreja) === "string"
      ? String(tenant?.name || tenant?.nome || rawUser.ministryName || rawUser.igreja).trim()
      : undefined;

  if (tenant && isStatusInactive(tenant.status)) {
    return { isPremium: false, planLabel: "Inativo", ministryName };
  }

  if (
    rawUser.isPremium === true ||
    rawUser.premium === true ||
    tenant?.isPremium === true ||
    tenant?.premium === true
  ) {
    const rawLabel =
      tenant?.plan || tenant?.plano || rawUser.plan || rawUser.plano || "Plano Premium";
    return {
      isPremium: true,
      planLabel: typeof rawLabel === "string" && rawLabel.trim() ? rawLabel.trim() : "Plano Premium",
      ministryName,
    };
  }

  const candidates = [
    tenant?.plan,
    tenant?.plano,
    tenant?.subscriptionPlan,
    rawUser.plan,
    rawUser.plano,
    rawUser.subscriptionPlan,
    rawUser.tier,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      const label = candidate.trim();
      const normalized = label.toLowerCase();
      const isPremium =
        normalized === "premium" ||
        normalized === "plano premium" ||
        normalized === "plano_premium" ||
        normalized.includes("premium");
      return { isPremium, planLabel: label, ministryName };
    }
  }

  return { isPremium: false, planLabel: "Gratuito", ministryName };
}

function buildSafeUserResponse(
  rawUser: Record<string, unknown>,
  planInfo: { isPremium: boolean; planLabel: string; ministryName?: string },
  upstreamOrigin: string
): AuthenticatedWorkestraUser {
  const email = String(rawUser.email || rawUser.userEmail || "").trim();
  const displayName = String(
    rawUser.name || rawUser.nome || rawUser.displayName || email.split("@")[0] || "Músico"
  ).trim();

  let photoURL: string | null = null;
  const rawPhoto = rawUser.photoURL || rawUser.avatarUrl || rawUser.avatar || rawUser.foto;
  if (typeof rawPhoto === "string" && rawPhoto.trim()) {
    const trimmedPhoto = rawPhoto.trim();
    try {
      const parsed = trimmedPhoto.startsWith("/")
        ? new URL(trimmedPhoto, upstreamOrigin)
        : new URL(trimmedPhoto);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        photoURL = parsed.href;
      }
    } catch {
      photoURL = null;
    }
  }

  return {
    id: String(rawUser.id || rawUser._id || rawUser.uid || email),
    displayName,
    email,
    plan: planInfo.planLabel,
    isPremium: planInfo.isPremium,
    ministryName: planInfo.ministryName,
    photoURL,
  };
}

function validateAndAuthorizeUser(
  rawUser: unknown,
  upstreamOrigin: string,
  pending?: boolean
): AuthenticatedWorkestraUser {
  if (!rawUser || typeof rawUser !== "object") {
    throw new AuthApiError(401, "INVALID_TOKEN", "Dados de usuário inválidos.");
  }

  const userDoc = rawUser as Record<string, unknown>;

  if (
    userDoc.active === false ||
    userDoc.ativo === false ||
    userDoc.enabled === false ||
    userDoc.blocked === true ||
    userDoc.bloqueado === true ||
    isStatusInactive(userDoc.status)
  ) {
    throw new AuthApiError(403, "PREMIUM_REQUIRED", "Conta inativa ou suspensa.");
  }

  if (pending === true) {
    throw new AuthApiError(
      403,
      "PREMIUM_REQUIRED",
      "Assinatura pendente. Acesso restrito aos assinantes do Plano Premium."
    );
  }

  const planInfo = evaluatePlan(userDoc);
  if (!planInfo.isPremium) {
    throw new AuthApiError(
      403,
      "PREMIUM_REQUIRED",
      "Acesso restrito aos assinantes do Plano Premium."
    );
  }

  return buildSafeUserResponse(userDoc, planInfo, upstreamOrigin);
}

async function handleLogin(body: Record<string, unknown>): Promise<{
  token: string;
  user: AuthenticatedWorkestraUser;
}> {
  if (typeof body.email !== "string" || typeof body.password !== "string") {
    throw new AuthApiError(400, "INVALID_CREDENTIALS", "E-mail e senha inválidos.");
  }

  const email = body.email.trim().toLowerCase();
  const password = body.password;

  if (!email || email.length > 254 || !password || password.length > 256) {
    throw new AuthApiError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
  }

  const upstreamOrigin = getUpstreamBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${upstreamOrigin}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AuthApiError(
      502,
      "UPSTREAM_UNREACHABLE",
      "Não foi possível conectar ao servidor do Workestra. Tente novamente."
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (response.status === 400 || response.status === 401) {
    throw new AuthApiError(
      401,
      "INVALID_CREDENTIALS",
      typeof payload.error === "string" && payload.error
        ? payload.error
        : "E-mail ou senha incorretos."
    );
  }

  if (response.status === 403) {
    throw new AuthApiError(
      403,
      "PREMIUM_REQUIRED",
      typeof payload.error === "string" && payload.error
        ? payload.error
        : "Conta sem permissão ou suspensa."
    );
  }

  if (response.status === 429) {
    throw new AuthApiError(
      429,
      "RATE_LIMITED",
      "Muitas tentativas de login. Aguarde alguns minutos e tente novamente."
    );
  }

  if (!response.ok) {
    throw new AuthApiError(
      502,
      "UPSTREAM_ERROR",
      `Erro ao validar login no Workestra (HTTP ${response.status}).`
    );
  }

  const token = typeof payload.token === "string" ? payload.token.trim() : "";
  if (!token) {
    throw new AuthApiError(401, "INVALID_TOKEN", "Sessão não retornada pelo Workestra.");
  }

  const safeUser = validateAndAuthorizeUser(
    payload.user || payload,
    upstreamOrigin,
    payload.pending === true
  );

  return { token, user: safeUser };
}

async function handleVerify(tokenInput: unknown): Promise<{
  token: string;
  user: AuthenticatedWorkestraUser;
}> {
  if (typeof tokenInput !== "string") {
    throw new AuthApiError(401, "INVALID_TOKEN", "Token ausente.");
  }

  const cleanToken = tokenInput.trim();
  if (!cleanToken || cleanToken.length > 4096 || /[\r\n\0]/.test(cleanToken)) {
    throw new AuthApiError(401, "INVALID_TOKEN", "Token inválido.");
  }

  const upstreamOrigin = getUpstreamBaseUrl();
  let response: Response;
  try {
    response = await fetch(`${upstreamOrigin}/api/auth/profile`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${cleanToken}`,
      },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AuthApiError(
      502,
      "UPSTREAM_UNREACHABLE",
      "Não foi possível validar sua sessão no Workestra."
    );
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = (await response.json()) as Record<string, unknown>;
  } catch {
    payload = {};
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthApiError(
      401,
      "INVALID_TOKEN",
      typeof payload.error === "string" && payload.error
        ? payload.error
        : "Sessão expirada ou inválida."
    );
  }

  if (!response.ok) {
    throw new AuthApiError(
      502,
      "UPSTREAM_ERROR",
      `Erro ao validar sessão no Workestra (HTTP ${response.status}).`
    );
  }

  const safeUser = validateAndAuthorizeUser(
    payload.user || payload,
    upstreamOrigin,
    payload.pending === true
  );

  return { token: cleanToken, user: safeUser };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const action = resolveAction(req);

    if (action === "health" && req.method === "GET") {
      return sendJson(res, 200, {
        ok: true,
        mode: "workestra-api",
        upstream: getUpstreamBaseUrl(),
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendJson(res, 405, { error: "Método não permitido." });
    }

    if (action === "login") {
      const body = await parseJsonBody(req);
      const result = await handleLogin(body);
      return sendJson(res, 200, result);
    }

    if (action === "verify") {
      const authHeader = req.headers.authorization;
      const bearerToken =
        typeof authHeader === "string" && authHeader.startsWith("Bearer ")
          ? authHeader.slice(7).trim()
          : "";
      const body = await parseJsonBody(req);
      const token = bearerToken || body.token;
      const result = await handleVerify(token);
      return sendJson(res, 200, result);
    }

    if (action === "logout") {
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: "Rota não encontrada." });
  } catch (err) {
    if (err instanceof AuthApiError) {
      return sendJson(res, err.status, {
        error: err.message,
        code: err.code,
      });
    }
    const errName = err instanceof Error ? err.name : "Error";
    console.error("[Workestra Auth] Unexpected error:", errName);
    return sendJson(res, 500, {
      error: "Erro interno ao autenticar no Workestra.",
      code: "INTERNAL_ERROR",
    });
  }
}

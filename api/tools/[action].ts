import type { IncomingMessage, ServerResponse } from "node:http";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { Db, Document, MongoClient, ObjectId } from "mongodb";

export interface AuthenticatedWorkestraUser {
  id: string;
  displayName: string;
  email: string;
  plan: string;
  isPremium: boolean;
  ministryName?: string;
  photoURL?: string | null;
}

export class MongoAuthServiceError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
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

const globalForMongo = globalThis as unknown as {
  __workestraMongoClientPromise?: Promise<MongoClient>;
  __workestraJwtFallbackSecret?: string;
};

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

function getJwtSecret(): string {
  const configured =
    process.env.WORKESTRA_JWT_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim();
  if (configured) {
    return configured;
  }
  if (!globalForMongo.__workestraJwtFallbackSecret) {
    globalForMongo.__workestraJwtFallbackSecret = randomBytes(32).toString("hex");
  }
  return globalForMongo.__workestraJwtFallbackSecret;
}

function redactMongoCredentials(text: string): string {
  return text.replace(/mongodb(\+srv)?:\/\/[^@\s]+@/gi, "mongodb$1://***:***@");
}

function classifyMongoError(err: unknown): MongoAuthServiceError {
  if (err instanceof MongoAuthServiceError) return err;
  const msg = err instanceof Error ? err.message : String(err);
  const name = err instanceof Error ? err.name : "";
  const lower = msg.toLowerCase();
  const safeDetail = redactMongoCredentials(msg).slice(0, 120);

  if (
    lower.includes("bad auth") ||
    lower.includes("authentication failed") ||
    lower.includes("auth failed")
  ) {
    return new MongoAuthServiceError(
      502,
      "MONGODB_AUTH_FAILED",
      "Usuário ou senha da MONGODB_URI incorretos no MongoDB Atlas."
    );
  }

  if (
    name.includes("ServerSelection") ||
    name.includes("Network") ||
    name.includes("Topology") ||
    lower.includes("timed out") ||
    lower.includes("etimedout") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("econnreset") ||
    lower.includes("ssl") ||
    lower.includes("tls")
  ) {
    return new MongoAuthServiceError(
      502,
      "MONGODB_NETWORK_ERROR",
      `Não foi possível alcançar o MongoDB Atlas (verifique se 0.0.0.0/0 está liberado em Network Access) [${name || "NetworkError"}].`
    );
  }

  if (
    name.includes("ParseError") ||
    lower.includes("unescaped") ||
    lower.includes("invalid connection string") ||
    lower.includes("invalid scheme") ||
    lower.includes("connection string") ||
    /\buri\b/.test(lower)
  ) {
    return new MongoAuthServiceError(
      503,
      "MONGODB_URI_INVALID",
      `Formato da MONGODB_URI inválido (${name || "ParseError"}: ${safeDetail}).`
    );
  }

  return new MongoAuthServiceError(
    500,
    "DB_ERROR",
    `Erro ao consultar o banco de dados (${name || "MongoError"}).`
  );
}

function encodeUserInfoPartIfNeeded(value: string): string {
  const hasInvalidRawChars = /[@:/?#\[\]\s<>^`"{}|\\]/.test(value);
  const hasInvalidPercent = /%(?![0-9a-fA-F]{2})/.test(value);
  if (hasInvalidRawChars || hasInvalidPercent) {
    return encodeURIComponent(value);
  }
  return value;
}

function normalizeMongoUri(rawEnvValue: string): string {
  const stripped = rawEnvValue.replace(/^["']|["']$/g, "").trim();
  if (!stripped) {
    throw new MongoAuthServiceError(
      503,
      "MONGODB_NOT_CONFIGURED",
      "MONGODB_URI não configurada nas variáveis de ambiente."
    );
  }

  const schemeMatch = /^(mongodb(?:\+srv)?:\/\/)(.+)$/i.exec(stripped);
  if (!schemeMatch) {
    throw new MongoAuthServiceError(
      503,
      "MONGODB_URI_INVALID",
      "MONGODB_URI inválida: deve começar com mongodb+srv:// ou mongodb://."
    );
  }

  const scheme = schemeMatch[1];
  const rest = schemeMatch[2];
  const atIndex = rest.lastIndexOf("@");
  if (atIndex === -1) {
    return stripped;
  }

  const userInfo = rest.slice(0, atIndex);
  const hostAndPath = rest.slice(atIndex + 1);
  const colonIndex = userInfo.indexOf(":");
  if (colonIndex === -1) {
    return stripped;
  }

  const rawUser = userInfo.slice(0, colonIndex);
  const rawPass = userInfo.slice(colonIndex + 1);

  if (
    rawPass === "<db_password>" ||
    rawPass === "<password>" ||
    /^<[^>]+>$/.test(rawPass)
  ) {
    throw new MongoAuthServiceError(
      503,
      "MONGODB_URI_INVALID",
      "Substitua <db_password> pela sua senha real do banco na variável MONGODB_URI da Vercel."
    );
  }

  const safeUser = encodeUserInfoPartIfNeeded(rawUser);
  const safePass = encodeUserInfoPartIfNeeded(rawPass);

  return `${scheme}${safeUser}:${safePass}@${hostAndPath}`;
}

async function getMongoClient(): Promise<MongoClient> {
  const uri = normalizeMongoUri(process.env.MONGODB_URI || "");

  if (!globalForMongo.__workestraMongoClientPromise) {
    try {
      const client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 8000,
      });
      globalForMongo.__workestraMongoClientPromise = client.connect().catch((err) => {
        globalForMongo.__workestraMongoClientPromise = undefined;
        throw classifyMongoError(err);
      });
    } catch (err) {
      globalForMongo.__workestraMongoClientPromise = undefined;
      throw classifyMongoError(err);
    }
  }

  return globalForMongo.__workestraMongoClientPromise;
}

async function resolveDatabase(client: MongoClient): Promise<Db> {
  const explicitDb = process.env.MONGODB_DB_NAME?.trim();
  if (explicitDb) {
    return client.db(explicitDb);
  }

  const defaultDb = client.db();
  if (defaultDb.databaseName === "test") {
    try {
      const collections = await defaultDb.listCollections({}, { nameOnly: true }).toArray();
      if (collections.length === 0) {
        const adminDb = client.db().admin();
        const { databases } = await adminDb.listDatabases();
        const candidate = databases.find(
          (d) =>
            d.name !== "admin" &&
            d.name !== "local" &&
            d.name !== "config" &&
            d.name !== "test"
        );
        if (candidate) {
          return client.db(candidate.name);
        }
      }
    } catch {
      // Ignore listDatabases permission error and keep default DB
    }
  }

  return defaultDb;
}

async function resolveUsersCollectionName(db: Db): Promise<string> {
  const explicit = process.env.MONGODB_USERS_COLLECTION?.trim();
  if (explicit) {
    return explicit;
  }

  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  const names = existing.map((c) => c.name);
  const preferred = [
    "users",
    "usuarios",
    "user",
    "usuario",
    "accounts",
    "contas",
    "clientes",
    "clients",
    "members",
    "membros",
  ];

  for (const candidate of preferred) {
    const exactMatch = names.find((n) => n.toLowerCase() === candidate);
    if (exactMatch) {
      return exactMatch;
    }
  }

  return names[0] || "users";
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function findUserByEmail(db: Db, email: string): Promise<Document | null> {
  const collectionName = await resolveUsersCollectionName(db);
  const collection = db.collection(collectionName);
  const cleanEmail = email.trim().toLowerCase();
  const exactRegex = new RegExp(`^${escapeRegex(cleanEmail)}$`, "i");

  const configuredField = process.env.MONGODB_EMAIL_FIELD?.trim();
  if (configuredField) {
    return collection.findOne({
      $or: [{ [configuredField]: cleanEmail }, { [configuredField]: exactRegex }],
    });
  }

  return collection.findOne({
    $or: [
      { email: cleanEmail },
      { email: exactRegex },
      { correo: exactRegex },
      { userEmail: exactRegex },
      { login: exactRegex },
    ],
  });
}

async function findUserByIdOrEmail(
  db: Db,
  id: string,
  email?: string
): Promise<Document | null> {
  const collectionName = await resolveUsersCollectionName(db);
  const collection = db.collection(collectionName);

  if (ObjectId.isValid(id)) {
    const byObjId = await collection.findOne({ _id: new ObjectId(id) });
    if (byObjId) return byObjId;
  }

  const byStrId = await collection.findOne({ _id: id as unknown as ObjectId });
  if (byStrId) return byStrId;

  if (email) {
    return findUserByEmail(db, email);
  }

  return null;
}

function getNestedValue(doc: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = doc;
  for (const part of parts) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function extractPasswordHash(userDoc: Document): string | null {
  const configured = process.env.MONGODB_PASSWORD_FIELD?.trim();
  const fields = configured
    ? [configured]
    : ["password", "senha", "passwordHash", "senhaHash", "hash", "pass"];

  for (const field of fields) {
    const val = getNestedValue(userDoc, field);
    if (typeof val === "string" && val.length > 0) {
      return val;
    }
  }
  return null;
}

async function verifyPasswordHash(plainPassword: string, storedHash: string): Promise<boolean> {
  if (!plainPassword || !storedHash) return false;

  if (
    storedHash.startsWith("$2a$") ||
    storedHash.startsWith("$2b$") ||
    storedHash.startsWith("$2y$")
  ) {
    const bcryptMod = (await import("bcryptjs")) as unknown as {
      compare?: (s: string, hash: string) => Promise<boolean>;
      default?: { compare?: (s: string, hash: string) => Promise<boolean> };
    };
    const compareFn = bcryptMod.compare || bcryptMod.default?.compare;
    if (typeof compareFn === "function") {
      return compareFn(plainPassword, storedHash);
    }
  }

  if (storedHash.includes(":")) {
    const [salt, expectedHex] = storedHash.split(":");
    if (salt && expectedHex && /^[0-9a-f]+$/i.test(expectedHex)) {
      try {
        const expectedBuf = Buffer.from(expectedHex, "hex");
        const derived = scryptSync(plainPassword, salt, expectedBuf.length);
        return timingSafeEqual(derived, expectedBuf);
      } catch {
        return false;
      }
    }
  }

  if (/^[0-9a-f]{64}$/i.test(storedHash)) {
    const candidate = createHash("sha256").update(plainPassword, "utf8").digest();
    const expected = Buffer.from(storedHash, "hex");
    return timingSafeEqual(candidate, expected);
  }

  return false;
}

function isUserActive(userDoc: Document): boolean {
  if (userDoc.active === false || userDoc.ativo === false || userDoc.enabled === false) {
    return false;
  }
  if (userDoc.blocked === true || userDoc.bloqueado === true || userDoc.deleted === true) {
    return false;
  }
  const status = String(userDoc.status ?? "").trim().toLowerCase();
  if (
    status === "inactive" ||
    status === "inativo" ||
    status === "blocked" ||
    status === "bloqueado" ||
    status === "suspended" ||
    status === "suspenso" ||
    status === "canceled" ||
    status === "cancelado"
  ) {
    return false;
  }
  return true;
}

function evaluatePlanValue(
  rawPlan: unknown,
  rawIsPremium: unknown
): { isPremium: boolean; planLabel: string } | null {
  if (rawIsPremium === true) {
    return {
      isPremium: true,
      planLabel: typeof rawPlan === "string" && rawPlan.trim() ? rawPlan.trim() : "Plano Premium",
    };
  }

  if (typeof rawPlan !== "string" || !rawPlan.trim()) {
    return null;
  }

  const label = rawPlan.trim();
  const normalized = label.toLowerCase();

  const customValues = process.env.MONGODB_PREMIUM_VALUES?.trim();
  if (customValues) {
    const allowed = customValues
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    const matched = allowed.some((val) => normalized === val || normalized.includes(val));
    return { isPremium: matched, planLabel: label };
  }

  const isPremium =
    normalized === "premium" ||
    normalized === "plano premium" ||
    normalized === "plano_premium" ||
    normalized.includes("premium");

  return { isPremium, planLabel: label };
}

function buildIdFilter(refId: unknown): Record<string, unknown> {
  const asString =
    typeof refId === "string"
      ? refId.trim()
      : refId && typeof (refId as { toString?: () => string }).toString === "function"
      ? String(refId).trim()
      : "";

  if (asString && ObjectId.isValid(asString)) {
    return {
      $or: [
        { _id: new ObjectId(asString) },
        { _id: asString as unknown as ObjectId },
      ],
    };
  }
  return { _id: refId as ObjectId };
}

function collectObjectIdCandidates(values: unknown[]): (ObjectId | string)[] {
  const ids: (ObjectId | string)[] = [];
  for (const val of values) {
    if (!val) continue;
    const str = String(val).trim();
    if (!str) continue;
    ids.push(str);
    if (ObjectId.isValid(str)) {
      ids.push(new ObjectId(str));
    }
  }
  return ids;
}

function extractPlanFromDoc(
  doc: Record<string, unknown>
): { isPremium: boolean; planLabel: string; ministryName?: string } | null {
  const ministryName =
    typeof (doc.name || doc.nome) === "string"
      ? String(doc.name || doc.nome).trim()
      : undefined;

  const docStatus = String(doc.status ?? "").trim().toLowerCase();
  if (
    docStatus === "inactive" ||
    docStatus === "inativo" ||
    docStatus === "suspended" ||
    docStatus === "suspenso" ||
    docStatus === "canceled" ||
    docStatus === "cancelado"
  ) {
    return { isPremium: false, planLabel: "Inativo", ministryName };
  }

  const candidates = [
    doc.plano,
    doc.plan,
    doc.subscriptionPlan,
    doc.tipoPlano,
    doc.tier,
    getNestedValue(doc, "subscription.plan"),
    getNestedValue(doc, "subscription.plano"),
    getNestedValue(doc, "assinatura.plano"),
    getNestedValue(doc, "assinatura.plan"),
  ];

  for (const candidate of candidates) {
    const evaluated = evaluatePlanValue(candidate, doc.isPremium ?? doc.premium);
    if (evaluated) {
      return { ...evaluated, ministryName };
    }
  }

  if (doc.isPremium === true || doc.premium === true) {
    return { isPremium: true, planLabel: "Plano Premium", ministryName };
  }

  return null;
}

async function resolveUserPlan(
  db: Db,
  userDoc: Document
): Promise<{ isPremium: boolean; planLabel: string; ministryName?: string }> {
  const configuredField = process.env.MONGODB_PLAN_FIELD?.trim();
  if (configuredField) {
    const directCustom = evaluatePlanValue(
      getNestedValue(userDoc, configuredField),
      userDoc.isPremium ?? userDoc.premium
    );
    if (directCustom) {
      return directCustom;
    }
  }

  const directUserPlan = extractPlanFromDoc(userDoc);
  if (directUserPlan && directUserPlan.isPremium) {
    return directUserPlan;
  }

  if (
    userDoc.tenant &&
    typeof userDoc.tenant === "object" &&
    !(userDoc.tenant instanceof ObjectId) &&
    !("_bsontype" in userDoc.tenant)
  ) {
    const embeddedPlan = extractPlanFromDoc(userDoc.tenant as Record<string, unknown>);
    if (embeddedPlan) {
      return embeddedPlan;
    }
  }

  const singleRefFields = [
    "tenantId",
    "tenant",
    "ministryId",
    "ministerioId",
    "churchId",
    "igrejaId",
    "organizationId",
    "orgId",
    "clientId",
    "clienteId",
    "empresaId",
    "accountId",
  ];
  const arrayRefFields = ["tenantIds", "tenants", "organizationIds", "ministryIds", "churchIds"];

  const rawRefs: unknown[] = [];
  for (const rf of singleRefFields) {
    if (userDoc[rf]) rawRefs.push(userDoc[rf]);
  }
  for (const af of arrayRefFields) {
    const arr = userDoc[af];
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (item && typeof item === "object" && !("_bsontype" in item) && "tenantId" in item) {
          rawRefs.push((item as Record<string, unknown>).tenantId);
        } else {
          rawRefs.push(item);
        }
      }
    }
  }

  const existing = await db.listCollections({}, { nameOnly: true }).toArray();
  const colNames = existing.map((c) => c.name);
  const parentCandidates = [
    "tenants",
    "ministries",
    "ministerios",
    "churches",
    "igrejas",
    "organizations",
    "clients",
    "clientes",
    "empresas",
    "accounts",
    "subscriptions",
    "assinaturas",
  ];

  for (const refId of rawRefs) {
    const idFilter = buildIdFilter(refId);
    for (const candidate of parentCandidates) {
      const colName = colNames.find((n) => n.toLowerCase() === candidate);
      if (!colName) continue;
      const parentDoc = await db.collection(colName).findOne(idFilter);
      if (!parentDoc) continue;

      const evaluated = extractPlanFromDoc(parentDoc);
      if (evaluated?.isPremium) {
        return evaluated;
      }
    }
  }

  const userIds = collectObjectIdCandidates([userDoc._id, userDoc.id]);
  if (userIds.length > 0) {
    const joinCandidates = ["tenantmembers", "tenant_members", "memberships", "user_tenants", "usertenants"];
    for (const joinCand of joinCandidates) {
      const joinCol = colNames.find((n) => n.toLowerCase() === joinCand);
      if (!joinCol) continue;
      const memberships = await db
        .collection(joinCol)
        .find({ $or: [{ userId: { $in: userIds } }, { memberId: { $in: userIds } }] })
        .limit(10)
        .toArray();
      const memberTenantRefs = memberships.map((m) => m.tenantId || m.organizationId || m.churchId).filter(Boolean);
      for (const tRef of memberTenantRefs) {
        const tenantsCol = colNames.find((n) => n.toLowerCase() === "tenants");
        if (!tenantsCol) continue;
        const parentDoc = await db.collection(tenantsCol).findOne(buildIdFilter(tRef));
        if (!parentDoc) continue;
        const evaluated = extractPlanFromDoc(parentDoc);
        if (evaluated?.isPremium) {
          return evaluated;
        }
      }
    }

    const tenantsCol = colNames.find((n) => n.toLowerCase() === "tenants");
    if (tenantsCol) {
      const ownedTenant = await db.collection(tenantsCol).findOne({
        $or: [
          { ownerId: { $in: userIds } },
          { adminId: { $in: userIds } },
          { createdBy: { $in: userIds } },
          { userId: { $in: userIds } },
        ],
      });
      if (ownedTenant) {
        const evaluated = extractPlanFromDoc(ownedTenant);
        if (evaluated?.isPremium) {
          return evaluated;
        }
      }
    }
  }

  if (directUserPlan) {
    return directUserPlan;
  }

  return { isPremium: false, planLabel: "Sem Plano Premium" };
}

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function signSessionToken(user: AuthenticatedWorkestraUser): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.displayName,
      plan: user.plan,
      isPremium: user.isPremium,
      iat: now,
      exp: now + 60 * 60 * 24,
    })
  );

  const signature = createHmac("sha256", getJwtSecret())
    .update(`${header}.${payload}`)
    .digest();

  return `${header}.${payload}.${base64UrlEncode(signature)}`;
}

function verifySignedJwt(token: string): { sub: string; email?: string } {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new MongoAuthServiceError(401, "INVALID_TOKEN", "Token inválido.");
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  const expectedSig = createHmac("sha256", getJwtSecret())
    .update(`${headerB64}.${payloadB64}`)
    .digest();
  const expectedB64 = base64UrlEncode(expectedSig);

  const actualBuf = Buffer.from(signatureB64, "utf8");
  const expectedBuf = Buffer.from(expectedB64, "utf8");

  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) {
    throw new MongoAuthServiceError(401, "INVALID_TOKEN", "Assinatura do token inválida.");
  }

  let parsedPayload: { sub?: string; email?: string; exp?: number };
  try {
    parsedPayload = JSON.parse(base64UrlDecode(payloadB64));
  } catch {
    throw new MongoAuthServiceError(401, "INVALID_TOKEN", "Payload do token inválido.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof parsedPayload.exp === "number" && parsedPayload.exp < now) {
    throw new MongoAuthServiceError(401, "INVALID_TOKEN", "Sessão expirada.");
  }

  const sub = String(parsedPayload.sub || parsedPayload.email || "").trim();
  if (!sub) {
    throw new MongoAuthServiceError(401, "INVALID_TOKEN", "Identificador ausente no token.");
  }

  return {
    sub,
    email: typeof parsedPayload.email === "string" ? parsedPayload.email : undefined,
  };
}

function buildSafeUserResponse(
  userDoc: Document,
  planInfo: { isPremium: boolean; planLabel: string; ministryName?: string }
): AuthenticatedWorkestraUser {
  const email = String(
    userDoc.email || userDoc.correo || userDoc.userEmail || ""
  ).trim();
  const displayName = String(
    userDoc.name ||
      userDoc.nome ||
      userDoc.displayName ||
      email.split("@")[0] ||
      "Músico"
  ).trim();

  let photoURL: string | null = null;
  const rawPhoto = userDoc.photoURL || userDoc.avatarUrl || userDoc.avatar || userDoc.foto;
  if (typeof rawPhoto === "string" && rawPhoto.trim()) {
    try {
      const parsed = new URL(rawPhoto.trim());
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        photoURL = parsed.href;
      }
    } catch {
      photoURL = null;
    }
  }

  return {
    id: String(userDoc._id),
    displayName,
    email,
    plan: planInfo.planLabel,
    isPremium: planInfo.isPremium,
    ministryName:
      planInfo.ministryName ||
      (typeof (userDoc.ministryName || userDoc.igreja || userDoc.ministerio) === "string"
        ? String(userDoc.ministryName || userDoc.igreja || userDoc.ministerio)
        : undefined),
    photoURL,
  };
}

async function authenticateWithCredentials(
  emailInput: unknown,
  passwordInput: unknown
): Promise<{ token: string; user: AuthenticatedWorkestraUser }> {
  if (typeof emailInput !== "string" || typeof passwordInput !== "string") {
    throw new MongoAuthServiceError(400, "INVALID_CREDENTIALS", "E-mail e senha inválidos.");
  }

  const email = emailInput.trim().toLowerCase();
  const password = passwordInput;

  if (!email || email.length > 254 || !password || password.length > 256) {
    throw new MongoAuthServiceError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
  }

  const client = await getMongoClient();
  const db = await resolveDatabase(client);
  const userDoc = await findUserByEmail(db, email);

  if (!userDoc) {
    throw new MongoAuthServiceError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
  }

  const storedHash = extractPasswordHash(userDoc);
  if (!storedHash) {
    throw new MongoAuthServiceError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
  }

  const passwordValid = await verifyPasswordHash(password, storedHash);
  if (!passwordValid) {
    throw new MongoAuthServiceError(401, "INVALID_CREDENTIALS", "E-mail ou senha inválidos.");
  }

  if (!isUserActive(userDoc)) {
    throw new MongoAuthServiceError(403, "PREMIUM_REQUIRED", "Conta inativa ou bloqueada.");
  }

  const planInfo = await resolveUserPlan(db, userDoc);
  if (!planInfo.isPremium) {
    throw new MongoAuthServiceError(
      403,
      "PREMIUM_REQUIRED",
      "Acesso restrito aos assinantes do Plano Premium."
    );
  }

  const user = buildSafeUserResponse(userDoc, planInfo);
  const token = signSessionToken(user);

  return { token, user };
}

async function verifySessionWithMongo(
  tokenInput: unknown
): Promise<{ token: string; user: AuthenticatedWorkestraUser }> {
  if (typeof tokenInput !== "string" || !tokenInput.trim()) {
    throw new MongoAuthServiceError(401, "INVALID_TOKEN", "Token ausente.");
  }

  const cleanToken = tokenInput.trim();
  const claims = verifySignedJwt(cleanToken);

  const client = await getMongoClient();
  const db = await resolveDatabase(client);
  const userDoc = await findUserByIdOrEmail(db, claims.sub, claims.email);

  if (!userDoc || !isUserActive(userDoc)) {
    throw new MongoAuthServiceError(401, "INVALID_TOKEN", "Usuário não encontrado ou inativo.");
  }

  const planInfo = await resolveUserPlan(db, userDoc);
  if (!planInfo.isPremium) {
    throw new MongoAuthServiceError(
      403,
      "PREMIUM_REQUIRED",
      "Acesso restrito aos assinantes do Plano Premium."
    );
  }

  const user = buildSafeUserResponse(userDoc, planInfo);
  const refreshedToken = signSessionToken(user);

  return { token: refreshedToken, user };
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

export default async function handler(req: ApiRequest, res: ApiResponse) {
  try {
    const action = resolveAction(req);

    if (action === "health" && req.method === "GET") {
      return sendJson(res, 200, {
        ok: true,
        mongoConfigured: Boolean(process.env.MONGODB_URI?.trim()),
      });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return sendJson(res, 405, { error: "Método não permitido." });
    }

    if (action === "login") {
      const body = await parseJsonBody(req);
      const result = await authenticateWithCredentials(body.email, body.password);
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
      const result = await verifySessionWithMongo(token);
      return sendJson(res, 200, result);
    }

    if (action === "logout") {
      return sendJson(res, 200, { ok: true });
    }

    return sendJson(res, 404, { error: "Rota não encontrada." });
  } catch (err) {
    const classified =
      err instanceof MongoAuthServiceError ? err : classifyMongoError(err);
    if (classified.code !== "DB_ERROR" || err instanceof MongoAuthServiceError) {
      return sendJson(res, classified.status, {
        error: classified.message,
        code: classified.code,
      });
    }
    const errName = err instanceof Error ? err.name : "Error";
    console.error("[Workestra Auth] Error:", err instanceof Error ? err.message : "unknown");
    return sendJson(res, 500, {
      error: `Erro interno ao autenticar (${errName}).`,
      code: "DB_ERROR",
    });
  }
}

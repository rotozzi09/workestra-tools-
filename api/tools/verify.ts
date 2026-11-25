import { MongoAuthServiceError, verifySessionWithMongo } from "../_lib/mongoAuth";
import { ApiRequest, ApiResponse, parseJsonBody, sendJson } from "../_lib/http";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Método não permitido." });
  }

  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      typeof authHeader === "string" && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : "";

    const body = await parseJsonBody(req);
    const token = bearerToken || body.token;

    const result = await verifySessionWithMongo(token);
    return sendJson(res, 200, result);
  } catch (err) {
    if (err instanceof MongoAuthServiceError) {
      return sendJson(res, err.status, {
        error: err.message,
        code: err.code,
      });
    }
    console.error("[Workestra Auth] Verify error:", err instanceof Error ? err.message : "unknown");
    return sendJson(res, 500, {
      error: "Erro ao verificar sessão no banco de dados.",
      code: "DB_ERROR",
    });
  }
}

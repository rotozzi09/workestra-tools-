import { authenticateWithCredentials, MongoAuthServiceError } from "../_lib/mongoAuth";
import { ApiRequest, ApiResponse, parseJsonBody, sendJson } from "../_lib/http";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Método não permitido." });
  }

  try {
    const body = await parseJsonBody(req);
    const result = await authenticateWithCredentials(body.email, body.password);
    return sendJson(res, 200, result);
  } catch (err) {
    if (err instanceof MongoAuthServiceError) {
      return sendJson(res, err.status, {
        error: err.message,
        code: err.code,
      });
    }
    console.error("[Workestra Auth] Login error:", err instanceof Error ? err.message : "unknown");
    return sendJson(res, 500, {
      error: "Erro ao consultar o banco de dados.",
      code: "DB_ERROR",
    });
  }
}

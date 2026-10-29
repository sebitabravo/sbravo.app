import { corsHeaders, parseThread, safeEqual, sqliteToIso, validateComment } from "./rules";

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
  /** secretos: wrangler secret put */
  TURNSTILE_SECRET_KEY: string;
  ADMIN_TOKEN: string;
  IP_SALT: string;
}

interface CommentRow {
  id: string;
  parent_id: string | null;
  name: string;
  body: string;
  is_author: number;
  created_at: string;
}

const RATE = { perMinute: 3, perDay: 30 } as const;

function toComment(row: CommentRow) {
  return {
    id: row.id,
    parentId: row.parent_id,
    name: row.name,
    body: row.body,
    createdAt: sqliteToIso(row.created_at),
    isAuthor: row.is_author === 1,
  };
}

function json(data: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(data === null ? null : JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isAuthor(request: Request, env: Env): boolean {
  const header = request.headers.get("Authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token !== "" && env.ADMIN_TOKEN !== undefined && safeEqual(token, env.ADMIN_TOKEN);
}

async function verifyTurnstile(token: string, ip: string, env: Env): Promise<boolean> {
  const form = new FormData();
  form.append("secret", env.TURNSTILE_SECRET_KEY);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const result = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const outcome = (await result.json()) as { success?: boolean };
  return outcome.success === true;
}

async function listComments(thread: string, env: Env, cors: Record<string, string>): Promise<Response> {
  const { results } = await env.DB.prepare(
    "SELECT id, parent_id, name, body, is_author, created_at FROM comments WHERE thread = ? AND deleted = 0 ORDER BY created_at",
  )
    .bind(thread)
    .all<CommentRow>();
  return json({ comments: results.map(toComment) }, 200, cors);
}

async function createComment(thread: string, request: Request, env: Env, cors: Record<string, string>) {
  let input: Record<string, unknown>;
  try {
    input = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_body" }, 400, cors);
  }

  const author = isAuthor(request, env);
  const checked = validateComment(input, { author });
  if (!checked.ok) {
    // al bot del honeypot se le responde como si hubiera funcionado, para no enseñarle la trampa
    if (checked.error === "spam") return json(null, 204, cors);
    return json({ error: checked.error }, 400, cors);
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  // se guarda solo un hash con sal: sirve para limitar abusos sin almacenar la IP
  const ipHash = ip ? await sha256(`${env.IP_SALT}:${ip}`) : null;

  if (!author) {
    const token = typeof input.turnstileToken === "string" ? input.turnstileToken : "";
    if (!token) return json({ error: "missing_token" }, 400, cors);
    if (!(await verifyTurnstile(token, ip, env))) return json({ error: "turnstile_failed" }, 403, cors);

    if (ipHash) {
      const counts = await env.DB.prepare(
        `SELECT
           SUM(created_at > datetime('now', '-1 minute')) AS minute,
           SUM(created_at > datetime('now', '-1 day')) AS day
         FROM comments WHERE ip_hash = ?`,
      )
        .bind(ipHash)
        .first<{ minute: number | null; day: number | null }>();
      if ((counts?.minute ?? 0) >= RATE.perMinute || (counts?.day ?? 0) >= RATE.perDay) {
        return json({ error: "rate_limited" }, 429, cors);
      }
    }
  }

  const parentId = typeof input.parentId === "string" && input.parentId ? input.parentId : null;
  if (parentId) {
    // una sola capa de respuestas: el padre tiene que ser un comentario raíz vivo del mismo hilo
    const parent = await env.DB.prepare(
      "SELECT id FROM comments WHERE id = ? AND thread = ? AND parent_id IS NULL AND deleted = 0",
    )
      .bind(parentId, thread)
      .first();
    if (!parent) return json({ error: "invalid_parent" }, 400, cors);
  }

  const row: CommentRow = {
    id: crypto.randomUUID(),
    parent_id: parentId,
    name: checked.name || (author ? "sbravo" : ""),
    body: checked.body,
    is_author: author ? 1 : 0,
    // formato de SQLite datetime() para que las comparaciones del rate limit funcionen
    created_at: new Date().toISOString().replace("T", " ").slice(0, 19),
  };
  await env.DB.prepare(
    "INSERT INTO comments (id, thread, parent_id, name, body, is_author, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  )
    .bind(row.id, thread, row.parent_id, row.name, row.body, row.is_author, ipHash, row.created_at)
    .run();

  return json({ comment: toComment(row) }, 201, cors);
}

async function deleteComment(id: string, request: Request, env: Env, cors: Record<string, string>) {
  if (!isAuthor(request, env)) return json({ error: "unauthorized" }, 401, cors);
  await env.DB.prepare("UPDATE comments SET deleted = 1 WHERE id = ? OR parent_id = ?").bind(id, id).run();
  return json(null, 204, cors);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request.headers.get("Origin"), env.ALLOWED_ORIGINS.split(","));
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    const { pathname } = new URL(request.url);
    const threadMatch = pathname.match(/^\/threads\/([^/]+)\/comments$/);
    const deleteMatch = pathname.match(/^\/comments\/([0-9a-f-]{36})$/);

    try {
      if (threadMatch) {
        const thread = parseThread(threadMatch[1]);
        if (!thread) return json({ error: "invalid_thread" }, 400, cors);
        if (request.method === "GET") return await listComments(thread, env, cors);
        if (request.method === "POST") return await createComment(thread, request, env, cors);
      }
      if (deleteMatch && request.method === "DELETE") return await deleteComment(deleteMatch[1], request, env, cors);
      return json({ error: "not_found" }, 404, cors);
    } catch (error) {
      console.error(error);
      return json({ error: "server_error" }, 500, cors);
    }
  },
};

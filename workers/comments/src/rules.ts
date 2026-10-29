export const LIMITS = { name: 40, bodyMin: 2, bodyMax: 2000 } as const;

export type ValidationError = "invalid_name" | "invalid_body" | "spam";

export type ValidationResult = { ok: true; name: string; body: string } | { ok: false; error: ValidationError };

// caracteres de control salvo salto de línea; evitan texto invisible o que rompa el render
const CONTROL = /[\u0000-\u0009\u000b-\u001f\u007f]/g;
const THREAD = /^app:[a-z0-9]+(?:-[a-z0-9]+)*$/;
// solo el autor puede firmar con la marca; evita que alguien se haga pasar por él
const RESERVED = /s\s*b\s*r\s*a\s*v\s*o|sebita/i;

export function normalizeName(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL, "").replace(/\s+/g, " ").trim();
}

export function normalizeBody(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function validateComment(
  input: { name?: unknown; body?: unknown; website?: unknown },
  options: { author?: boolean } = {},
): ValidationResult {
  // el honeypot está oculto para personas: si trae algo, lo llenó un bot
  if (typeof input.website === "string" && input.website.trim() !== "") return { ok: false, error: "spam" };

  const name = normalizeName(input.name);
  if (name.length > LIMITS.name) return { ok: false, error: "invalid_name" };
  if (!options.author && RESERVED.test(name)) return { ok: false, error: "invalid_name" };

  if (typeof input.body !== "string") return { ok: false, error: "invalid_body" };
  const body = normalizeBody(input.body);
  if (body.length < LIMITS.bodyMin || body.length > LIMITS.bodyMax) return { ok: false, error: "invalid_body" };

  return { ok: true, name, body };
}

export function parseThread(raw: string): string | null {
  try {
    const thread = decodeURIComponent(raw);
    return THREAD.test(thread) ? thread : null;
  } catch {
    return null;
  }
}

export function corsHeaders(origin: string | null, allowed: readonly string[]): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
  if (origin && allowed.includes(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}

/** Comparación en tiempo constante para el token de autor */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** SQLite guarda "YYYY-MM-DD HH:MM:SS" en UTC; Safari no parsea ese formato sin la T y la Z */
export function sqliteToIso(value: string): string {
  return `${value.replace(" ", "T")}Z`;
}

// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildCommentPayload,
  commentThreadUrl,
  initAdminComments,
  initComments,
  mapCommentApiError,
  type Comment,
} from "../src/scripts/comments";

const messages: Record<string, string> = {
  "comments.anonymous": "Anónimo",
  "comments.author": "Autor",
  "comments.reply": "Responder",
  "comments.empty": "Sin comentarios todavía.",
  "comments.retry": "Reintentar",
  "comments.sending": "Enviando…",
  "comments.sent": "Publicado.",
  "comments.error.generic": "Error general.",
  "comments.error.invalidName": "Nombre inválido.",
  "comments.error.invalidBody": "Comentario inválido.",
  "comments.error.invalidParent": "Respuesta inválida.",
  "comments.error.missingToken": "Falta verificación.",
  "comments.error.turnstileFailed": "Falló verificación.",
  "comments.error.rateLimited": "Espera antes de comentar.",
};

const rootComment: Comment = {
  id: "root-1",
  parentId: null,
  name: "Ada",
  body: "Comentario raíz",
  createdAt: "2026-01-02T03:04:05.000Z",
  isAuthor: false,
};

const authorReply: Comment = {
  id: "reply-1",
  parentId: "root-1",
  name: "sbravo",
  body: "<b>Respuesta del autor</b>",
  createdAt: "2026-01-03T03:04:05.000Z",
  isAuthor: true,
};

let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;
type TurnstileRender = (container: HTMLElement, options: Record<string, unknown>) => string;
type TurnstileReset = (widgetId: string) => void;
let turnstileRender: ReturnType<typeof vi.fn<TurnstileRender>>;
let turnstileReset: ReturnType<typeof vi.fn<TurnstileReset>>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function commentsFixture(options: { messages?: Record<string, string>; siteKey?: string; locale?: string } = {}): HTMLFormElement {
  document.body.innerHTML = `
    <section data-comments-root data-term="app:demo" data-locale="${options.locale ?? "es"}"
      data-site-key="${options.siteKey ?? "site-key"}" data-messages='${JSON.stringify(options.messages ?? messages)}'>
      <div data-comments-list aria-live="polite" aria-busy="true"></div>
      <div class="form-card">
        <form data-comments-form novalidate>
          <input type="hidden" name="parentId" value="">
          <input name="name" maxlength="40">
          <textarea name="body" minlength="2" maxlength="2000"></textarea>
          <output data-counter>0/2000</output>
          <div aria-hidden="true"><input name="website" type="text" tabindex="-1" autocomplete="off"></div>
          <div data-turnstile></div>
          <button type="submit">Publicar</button>
          <button type="button" data-cancel-reply hidden>Cancelar</button>
          <p data-comments-status role="status" aria-live="polite"></p>
        </form>
      </div>
    </section>`;
  return document.querySelector<HTMLFormElement>("[data-comments-form]")!;
}

function adminFixture(): HTMLFormElement {
  document.body.innerHTML = `
    <main data-admin-comments data-messages='${JSON.stringify(messages)}'>
      <form data-admin-form>
        <input name="adminToken" type="password">
        <input name="thread" value="app:">
        <button type="submit">Cargar</button>
        <p data-admin-status role="status" aria-live="polite"></p>
      </form>
      <div data-admin-list></div>
    </main>`;
  return document.querySelector<HTMLFormElement>("[data-admin-form]")!;
}

function submit(form: HTMLFormElement): void {
  form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
}

function stubConfirm(value: boolean): ReturnType<typeof vi.fn> {
  const confirm = vi.fn(() => value);
  Object.defineProperty(window, "confirm", { configurable: true, value: confirm });
  return confirm;
}

beforeEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
  fetchMock = vi.fn<typeof fetch>();
  vi.stubGlobal("fetch", fetchMock);
  turnstileRender = vi.fn<TurnstileRender>((_container, options) => {
    (options.callback as (token: string) => void)("turnstile-token");
    return "widget-1";
  });
  turnstileReset = vi.fn<TurnstileReset>();
  window.turnstile = { render: turnstileRender, reset: turnstileReset };
  vi.stubGlobal("IntersectionObserver", class {
    private callback: IntersectionObserverCallback;
    constructor(callback: IntersectionObserverCallback) { this.callback = callback; }
    observe(target: Element): void {
      this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    disconnect(): void {}
    unobserve(): void {}
    takeRecords(): IntersectionObserverEntry[] { return []; }
    root = null;
    rootMargin = "200px";
    thresholds = [0];
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.replaceChildren();
  Reflect.deleteProperty(window, "confirm");
  window.turnstile = undefined;
});

describe("commentThreadUrl", () => {
  it("encodes the complete thread term as one path segment", () => {
    expect(commentThreadUrl("app:hello world/ñ", "https://comments.example/"))
      .toBe("https://comments.example/threads/app%3Ahello%20world%2F%C3%B1/comments");
  });
});

describe("buildCommentPayload", () => {
  it("always sends the honeypot and keeps optional name and parent fields optional", () => {
    expect(buildCommentPayload({ body: "A useful note", turnstileToken: "token", website: "" })).toEqual({
      body: "A useful note",
      turnstileToken: "token",
      website: "",
    });
  });

  it("includes a supplied name and reply parent", () => {
    expect(buildCommentPayload({
      name: "Ada",
      body: "A reply",
      parentId: "parent-1",
      turnstileToken: "token",
      website: "bot-value",
    })).toEqual({
      name: "Ada",
      body: "A reply",
      parentId: "parent-1",
      turnstileToken: "token",
      website: "bot-value",
    });
  });
});

describe("mapCommentApiError", () => {
  it.each([
    ["invalid_name", "comments.error.invalidName"],
    ["invalid_body", "comments.error.invalidBody"],
    ["invalid_parent", "comments.error.invalidParent"],
    ["missing_token", "comments.error.missingToken"],
    ["turnstile_failed", "comments.error.turnstileFailed"],
    ["rate_limited", "comments.error.rateLimited"],
  ])("maps %s to its localized message key", (code, key) => {
    expect(mapCommentApiError(code)).toBe(key);
  });

  it("uses the generic message for unknown and malformed API errors", () => {
    expect(mapCommentApiError("unexpected_error")).toBe("comments.error.generic");
    expect(mapCommentApiError(undefined)).toBe("comments.error.generic");
  });
});

describe("comments DOM client", () => {
  it("loads top-level comments and one reply with author badge and plain-text bodies", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [rootComment, authorReply] }));
    commentsFixture();

    initComments();

    await vi.waitFor(() => expect(document.querySelectorAll("[data-comment-id]")).toHaveLength(2));
    const root = document.querySelector<HTMLElement>('[data-comment-id="root-1"]')!;
    const reply = document.querySelector<HTMLElement>('[data-comment-id="reply-1"]')!;
    expect(root.textContent).toContain("Comentario raíz");
    expect(reply.querySelector("[class*=text-sand]")?.textContent).toBe("Autor");
    expect(reply.querySelector("p")?.textContent).toBe("<b>Respuesta del autor</b>");
    expect(reply.querySelector("b")).toBeNull();
    expect(document.querySelector("[data-comments-list]")?.getAttribute("aria-busy")).toBeNull();
    expect(turnstileRender).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({
      sitekey: "site-key",
      theme: "dark",
      appearance: "interaction-only",
    }));
    expect(fetchMock).toHaveBeenCalledWith(commentThreadUrl("app:demo"));
  });

  it("renders the localized empty state", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [] }));
    commentsFixture();
    initComments();

    await vi.waitFor(() => expect(document.querySelector("[data-comments-list]")?.textContent).toContain(messages["comments.empty"]));
  });

  it("shows a GET error and retries successfully", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: "unexpected" }, 500));
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [] }));
    commentsFixture();
    initComments();

    await vi.waitFor(() => expect(document.querySelector("[data-comments-list]")?.textContent).toContain(messages["comments.error.generic"]));
    document.querySelector<HTMLButtonElement>("[data-comments-list] button")!.click();
    await vi.waitFor(() => expect(document.querySelector("[data-comments-list]")?.textContent).toContain(messages["comments.empty"]));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("updates the live character counter", () => {
    commentsFixture({ siteKey: "" });
    initComments();
    const body = document.querySelector<HTMLTextAreaElement>("[name=body]")!;
    body.value = "Hola";
    body.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelector("[data-counter]")?.textContent).toBe("4/2000");
  });

  it("opens the same form inline for a reply and restores it when canceled", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [rootComment] }));
    const form = commentsFixture();
    initComments();
    await vi.waitFor(() => expect(document.querySelector("[data-reply-id='root-1']")).not.toBeNull());
    const originalParent = form.parentElement;

    document.querySelector<HTMLButtonElement>("[data-reply-id='root-1']")!.click();

    expect(document.querySelector('[data-comment-id="root-1"] [data-reply-form] form')).toBe(form);
    expect((form.elements.namedItem("parentId") as HTMLInputElement).value).toBe("root-1");
    expect(form.querySelector<HTMLButtonElement>("[data-cancel-reply]")?.hidden).toBe(false);
    form.querySelector<HTMLButtonElement>("[data-cancel-reply]")!.click();
    expect(form.parentElement).toBe(originalParent);
    expect((form.elements.namedItem("parentId") as HTMLInputElement).value).toBe("");
  });

  it("posts the honeypot and appends the returned comment without refetching", async () => {
    const saved: Comment = { ...rootComment, id: "new-1", body: "My new comment", name: "Mina" };
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [] }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ comment: saved }, 201));
    const form = commentsFixture();
    initComments();
    await vi.waitFor(() => expect(document.querySelector("[data-comments-list]")?.textContent).toContain(messages["comments.empty"]));
    (form.elements.namedItem("body") as HTMLTextAreaElement).value = "My new comment";
    (form.elements.namedItem("name") as HTMLInputElement).value = "Mina";
    (form.elements.namedItem("website") as HTMLInputElement).value = "hidden-honeypot";
    submit(form);

    await vi.waitFor(() => expect(document.querySelector("[data-comment-id='new-1']")?.textContent).toContain("My new comment"));
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({
      name: "Mina",
      body: "My new comment",
      turnstileToken: "turnstile-token",
      website: "hidden-honeypot",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(turnstileReset).toHaveBeenCalledWith("widget-1");
    expect(document.querySelector("[data-comments-status]")?.textContent).toBe(messages["comments.sent"]);
  });

  it.each([
    ["invalid_name", messages["comments.error.invalidName"]],
    ["invalid_body", messages["comments.error.invalidBody"]],
    ["invalid_parent", messages["comments.error.invalidParent"]],
    ["missing_token", messages["comments.error.missingToken"]],
    ["turnstile_failed", messages["comments.error.turnstileFailed"]],
    ["rate_limited", messages["comments.error.rateLimited"]],
    ["unknown_code", messages["comments.error.generic"]],
  ])("shows the localized POST error for %s", async (code, expected) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [] }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ code }, 400));
    const form = commentsFixture();
    initComments();
    await vi.waitFor(() => expect(document.querySelector("[data-comments-list]")?.textContent).toContain(messages["comments.empty"]));
    (form.elements.namedItem("body") as HTMLTextAreaElement).value = "Valid body";
    submit(form);

    await vi.waitFor(() => expect(document.querySelector("[data-comments-status]")?.textContent).toBe(expected));
    expect(turnstileReset).toHaveBeenCalledWith("widget-1");
  });

  it("reports a missing local Turnstile token without posting", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [] }));
    const form = commentsFixture();
    turnstileRender.mockImplementation(() => "widget-1");
    initComments();
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    (form.elements.namedItem("body") as HTMLTextAreaElement).value = "Valid body";
    submit(form);

    expect(document.querySelector("[data-comments-status]")?.textContent).toBe(messages["comments.error.missingToken"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("admin comments DOM client", () => {
  it("loads and saves the token, then loads a thread with a Bearer header", async () => {
    localStorage.setItem("sb-admin-token", "stored-token");
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [rootComment] }));
    const form = adminFixture();
    initAdminComments();
    const token = form.elements.namedItem("adminToken") as HTMLInputElement;
    expect(token.value).toBe("stored-token");
    token.value = "new-token";
    token.dispatchEvent(new Event("change", { bubbles: true }));
    expect(localStorage.getItem("sb-admin-token")).toBe("new-token");
    (form.elements.namedItem("thread") as HTMLInputElement).value = "app:demo";
    submit(form);

    await vi.waitFor(() => expect(document.querySelector("[data-admin-list]")?.textContent).toContain("Comentario raíz"));
    expect(fetchMock).toHaveBeenCalledWith(commentThreadUrl("app:demo"), { headers: { Authorization: "Bearer new-token" } });
  });

  it("tolerates localStorage read and write exceptions", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("storage denied"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("storage denied"); });
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [] }));
    const form = adminFixture();
    initAdminComments();
    const token = form.elements.namedItem("adminToken") as HTMLInputElement;
    expect(token.value).toBe("");
    token.value = "session-token";
    submit(form);

    await vi.waitFor(() => expect(document.querySelector("[data-admin-status]")?.textContent).toBe("Comentarios cargados."));
  });

  it("deletes a selected comment with the Bearer token and reloads the thread", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [rootComment] }));
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [] }));
    const form = adminFixture();
    stubConfirm(true);
    initAdminComments();
    (form.elements.namedItem("adminToken") as HTMLInputElement).value = "admin-token";
    submit(form);
    await vi.waitFor(() => expect(document.querySelector("[data-admin-list] button")?.textContent).toBe("Eliminar"));
    document.querySelector<HTMLButtonElement>("[data-admin-list] button")!.click();

    await vi.waitFor(() => expect(document.querySelector("[data-admin-status]")?.textContent).toBe("Comentario eliminado."));
    expect(fetchMock.mock.calls[1][0]).toBe("https://comments.sbravo.app/comments/root-1");
    expect(fetchMock.mock.calls[1][1]).toEqual({ method: "DELETE", headers: { Authorization: "Bearer admin-token" } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not send a DELETE request when confirmation is canceled", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [rootComment] }));
    const form = adminFixture();
    const confirm = stubConfirm(false);
    initAdminComments();
    (form.elements.namedItem("adminToken") as HTMLInputElement).value = "admin-token";
    submit(form);
    await vi.waitFor(() => expect(document.querySelector("[data-admin-list] button")?.textContent).toBe("Eliminar"));

    document.querySelector<HTMLButtonElement>("[data-admin-list] button")!.click();

    expect(confirm).toHaveBeenCalledWith("¿Eliminar este comentario?");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("posts an authenticated author reply without a Turnstile token", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [rootComment] }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ comment: authorReply }, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse({ comments: [rootComment, authorReply] }));
    const form = adminFixture();
    initAdminComments();
    (form.elements.namedItem("adminToken") as HTMLInputElement).value = "admin-token";
    submit(form);
    await vi.waitFor(() => expect(document.querySelector("[data-admin-list] input[name=reply]")).not.toBeNull());
    const replyForm = document.querySelector<HTMLFormElement>("[data-admin-list] form")!;
    (replyForm.elements.namedItem("reply") as HTMLInputElement).value = "Author response";
    submit(replyForm);

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1][0]).toBe(commentThreadUrl("app:"));
    expect(fetchMock.mock.calls[1][1]).toEqual({
      method: "POST",
      headers: { Authorization: "Bearer admin-token", "Content-Type": "application/json" },
      body: JSON.stringify({ body: "Author response", parentId: "root-1", name: "sbravo", website: "" }),
    });
  });

  it("shows a visible localized error for unauthorized thread loading", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: "unexpected" }, 401));
    const form = adminFixture();
    initAdminComments();
    (form.elements.namedItem("adminToken") as HTMLInputElement).value = "bad-token";
    submit(form);

    await vi.waitFor(() => expect(document.querySelector("[data-admin-status]")?.textContent).toBe(messages["comments.error.generic"]));
    expect(document.querySelector("[data-admin-status]")?.getAttribute("aria-live")).toBe("polite");
  });
});

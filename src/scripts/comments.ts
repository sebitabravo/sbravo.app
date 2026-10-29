export const COMMENTS_API = import.meta.env.PUBLIC_COMMENTS_API ?? "https://comments.sbravo.app";

export interface Comment {
  id: string;
  parentId: string | null;
  name: string;
  body: string;
  createdAt: string;
  isAuthor: boolean;
}

export interface CommentPayload {
  name?: string;
  body: string;
  parentId?: string;
  turnstileToken: string;
  website: string;
}

export function commentThreadUrl(term: string, apiBase = COMMENTS_API): string {
  return `${apiBase.replace(/\/$/, "")}/threads/${encodeURIComponent(term)}/comments`;
}

export function buildCommentPayload(payload: CommentPayload): CommentPayload {
  return {
    ...(payload.name ? { name: payload.name } : {}),
    body: payload.body,
    ...(payload.parentId ? { parentId: payload.parentId } : {}),
    turnstileToken: payload.turnstileToken,
    website: payload.website,
  };
}

const errorKeys: Record<string, string> = {
  invalid_name: "comments.error.invalidName",
  invalid_body: "comments.error.invalidBody",
  invalid_parent: "comments.error.invalidParent",
  missing_token: "comments.error.missingToken",
  turnstile_failed: "comments.error.turnstileFailed",
  rate_limited: "comments.error.rateLimited",
};

export function mapCommentApiError(code: unknown): string {
  return typeof code === "string" && errorKeys[code] ? errorKeys[code] : "comments.error.generic";
}

type Messages = Record<string, string>;
type TurnstileWidget = string;

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => TurnstileWidget;
      reset: (widgetId: TurnstileWidget) => void;
    };
  }
}

interface ThreadState {
  root: HTMLElement;
  term: string;
  locale: string;
  messages: Messages;
  comments: Comment[];
  list: HTMLElement;
  form: HTMLFormElement;
  status: HTMLElement;
  replyTarget: HTMLInputElement;
  originalFormParent: HTMLElement;
  turnstileToken: string;
  widgetId?: TurnstileWidget;
  siteKey: string;
}

function message(state: Pick<ThreadState, "messages">, key: string): string {
  return state.messages[key] ?? key;
}

function readMessages(root: HTMLElement): Messages {
  try {
    const value = JSON.parse(root.dataset.messages ?? "{}");
    return value && typeof value === "object" ? value as Messages : {};
  } catch {
    return {};
  }
}

function setStatus(state: ThreadState, key: string): void {
  state.status.textContent = message(state, key);
}

function safeDate(date: string, locale: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(parsed);
  } catch {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(parsed);
  }
}

function createElement<K extends keyof HTMLElementTagNameMap>(tag: K, className = ""): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (className) element.className = className;
  return element;
}

function renderComment(state: ThreadState, comment: Comment, parent: HTMLElement): void {
  const article = createElement("article", `rounded-card border border-line p-5 sm:p-6 ${comment.isAuthor ? "bg-surface/80" : "bg-surface"}`);
  article.dataset.commentId = comment.id;
  const header = createElement("div", "flex flex-wrap items-center gap-x-3 gap-y-2");
  const name = createElement("strong", "text-sm font-medium text-fg");
  name.textContent = comment.name || message(state, "comments.anonymous");
  header.appendChild(name);
  if (comment.isAuthor) {
    const badge = createElement("span", "rounded-full bg-sand/15 px-2.5 py-1 text-xs text-sand");
    badge.textContent = message(state, "comments.author");
    header.appendChild(badge);
  }
  const date = createElement("time", "ml-auto font-mono text-xs tabular-nums text-muted");
  date.dateTime = comment.createdAt;
  date.textContent = safeDate(comment.createdAt, state.locale);
  header.appendChild(date);

  const body = createElement("p", "mt-4 whitespace-pre-line wrap-anywhere text-sm leading-relaxed text-fg");
  body.textContent = comment.body;
  article.appendChild(header);
  article.appendChild(body);

  if (!comment.parentId) {
    const actions = createElement("div", "mt-4");
    const reply = createElement("button", "eyebrow min-h-11 rounded px-2 text-sand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand hover:text-fg");
    reply.type = "button";
    reply.dataset.replyId = comment.id;
    reply.textContent = message(state, "comments.reply");
    actions.appendChild(reply);
    article.appendChild(actions);
  }

  parent.appendChild(article);
}

function renderComments(state: ThreadState): void {
  state.list.replaceChildren();
  const roots = state.comments.filter((comment) => !comment.parentId);
  if (roots.length === 0) {
    const empty = createElement("p", "rounded-card border border-line bg-surface p-6 text-sm text-muted");
    empty.textContent = message(state, "comments.empty");
    state.list.appendChild(empty);
    return;
  }

  for (const comment of roots) {
    const group = createElement("div", "grid gap-3");
    renderComment(state, comment, group);
    const replies = state.comments.filter((candidate) => candidate.parentId === comment.id);
    if (replies.length > 0) {
      const replyList = createElement("div", "ml-4 grid gap-3 border-l border-line pl-4 sm:ml-8 sm:pl-6");
      for (const reply of replies) renderComment(state, reply, replyList);
      group.appendChild(replyList);
    }
    state.list.appendChild(group);
  }
}

async function readApiError(response: Response): Promise<string> {
  try {
    const data = await response.json() as { code?: unknown; error?: unknown };
    return mapCommentApiError(data.code ?? data.error);
  } catch {
    return mapCommentApiError(undefined);
  }
}

async function loadComments(state: ThreadState): Promise<void> {
  state.list.setAttribute("aria-busy", "true");
  try {
    const response = await fetch(commentThreadUrl(state.term));
    if (!response.ok) throw new Error(await readApiError(response));
    const data = await response.json() as { comments?: Comment[] };
    if (!Array.isArray(data.comments)) throw new Error(mapCommentApiError(undefined));
    state.comments = data.comments;
    renderComments(state);
  } catch (error) {
    const key = error instanceof Error && error.message.startsWith("comments.error.")
      ? error.message
      : "comments.error.generic";
    const failure = createElement("div", "rounded-card border border-line bg-surface p-6");
    const text = createElement("p", "text-sm text-muted");
    text.textContent = message(state, key);
    const retry = createElement("button", "btn mt-4");
    retry.type = "button";
    retry.textContent = message(state, "comments.retry");
    retry.addEventListener("click", () => void loadComments(state));
    failure.appendChild(text);
    failure.appendChild(retry);
    state.list.replaceChildren(failure);
  } finally {
    state.list.removeAttribute("aria-busy");
  }
}

let turnstilePromise: Promise<void> | undefined;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstilePromise) return turnstilePromise;
  turnstilePromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => window.turnstile ? resolve() : reject(new Error("Turnstile unavailable"));
    script.onerror = () => reject(new Error("Turnstile unavailable"));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    turnstilePromise = undefined;
    throw error;
  });
  return turnstilePromise;
}

function setupTurnstile(state: ThreadState): void {
  if (!state.siteKey) return;
  const target = state.root.querySelector<HTMLElement>("[data-turnstile]");
  if (!target) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    void loadTurnstile().then(() => {
      if (!window.turnstile || !target.isConnected) return;
      state.widgetId = window.turnstile.render(target, {
        sitekey: state.siteKey,
        theme: "dark",
        appearance: "interaction-only",
        callback: (token: string) => { state.turnstileToken = token; },
        "expired-callback": () => { state.turnstileToken = ""; },
        "error-callback": () => { state.turnstileToken = ""; },
      });
    }).catch(() => setStatus(state, "comments.error.generic"));
  }, { rootMargin: "200px" });
  observer.observe(state.root);
}

function returnFormToOriginal(state: ThreadState): void {
  state.replyTarget.value = "";
  const cancel = state.form.querySelector<HTMLButtonElement>("[data-cancel-reply]");
  if (cancel) cancel.hidden = true;
  state.originalFormParent.appendChild(state.form);
}

function setupReplyActions(state: ThreadState): void {
  state.root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const reply = target.closest<HTMLButtonElement>("[data-reply-id]");
    if (!reply) return;
    const comment = reply.closest<HTMLElement>("[data-comment-id]");
    if (!comment) return;
    const slot = createElement("div", "mt-4");
    slot.dataset.replyForm = "";
    comment.appendChild(slot);
    slot.appendChild(state.form);
    state.replyTarget.value = reply.dataset.replyId ?? "";
    const cancel = state.form.querySelector<HTMLButtonElement>("[data-cancel-reply]");
    if (cancel) cancel.hidden = false;
    state.form.querySelector<HTMLTextAreaElement>("[name=body]")?.focus();
  });
  state.form.querySelector<HTMLButtonElement>("[data-cancel-reply]")?.addEventListener("click", () => returnFormToOriginal(state));
}

function setupSubmission(state: ThreadState): void {
  const body = state.form.querySelector<HTMLTextAreaElement>("[name=body]");
  const counter = state.form.querySelector<HTMLElement>("[data-counter]");
  body?.addEventListener("input", () => {
    if (counter && body) counter.textContent = `${body.value.length}/2000`;
  });

  state.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const resetVerification = () => {
      state.turnstileToken = "";
      if (state.widgetId && window.turnstile) window.turnstile.reset(state.widgetId);
    };
    if (!body || body.value.trim().length < 2 || body.value.length > 2000) {
      setStatus(state, "comments.error.invalidBody");
      body?.focus();
      resetVerification();
      return;
    }
    if (!state.turnstileToken) {
      setStatus(state, "comments.error.missingToken");
      resetVerification();
      return;
    }

    const submit = state.form.querySelector<HTMLButtonElement>("[type=submit]");
    const name = state.form.querySelector<HTMLInputElement>("[name=name]")?.value.trim();
    const website = state.form.querySelector<HTMLInputElement>("[name=website]")?.value ?? "";
    const payload = buildCommentPayload({
      ...(name ? { name } : {}),
      body: body.value,
      ...(state.replyTarget.value ? { parentId: state.replyTarget.value } : {}),
      turnstileToken: state.turnstileToken,
      website,
    });
    if (submit) submit.disabled = true;
    setStatus(state, "comments.sending");
    try {
      const response = await fetch(commentThreadUrl(state.term), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(await readApiError(response));
      const data = await response.json() as { comment?: Comment };
      if (!data.comment) throw new Error(mapCommentApiError(undefined));
      state.comments.push(data.comment);
      renderComments(state);
      state.form.reset();
      state.turnstileToken = "";
      const counter = state.form.querySelector<HTMLElement>("[data-counter]");
      if (counter) counter.textContent = "0/2000";
      returnFormToOriginal(state);
      setStatus(state, "comments.sent");
    } catch (error) {
      const key = error instanceof Error && error.message.startsWith("comments.error.")
        ? error.message
        : "comments.error.generic";
      setStatus(state, key);
    } finally {
      resetVerification();
      if (submit) submit.disabled = false;
    }
  });
}

export function initComments(): void {
  document.querySelectorAll<HTMLElement>("[data-comments-root]").forEach((root) => {
    if (root.dataset.initialized) return;
    root.dataset.initialized = "true";
    const list = root.querySelector<HTMLElement>("[data-comments-list]");
    const form = root.querySelector<HTMLFormElement>("[data-comments-form]");
    const status = root.querySelector<HTMLElement>("[data-comments-status]");
    const replyTarget = root.querySelector<HTMLInputElement>("[name=parentId]");
    if (!list || !form || !status || !replyTarget) return;
    const state: ThreadState = {
      root,
      term: root.dataset.term ?? "",
      locale: root.dataset.locale ?? "en",
      messages: readMessages(root),
      comments: [],
      list,
      form,
      status,
      replyTarget,
      originalFormParent: form.parentElement ?? root,
      turnstileToken: "",
      siteKey: root.dataset.siteKey ?? "",
    };
    setupReplyActions(state);
    setupSubmission(state);
    setupTurnstile(state);
    void loadComments(state);
  });
}

interface AdminState {
  root: HTMLElement;
  messages: Messages;
  comments: Comment[];
  list: HTMLElement;
  tokenInput: HTMLInputElement;
  termInput: HTMLInputElement;
  form: HTMLFormElement;
  status: HTMLElement;
}

function adminHeaders(state: AdminState, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${state.tokenInput.value}`,
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

function persistAdminToken(value: string): void {
  try {
    localStorage.setItem("sb-admin-token", value);
  } catch {
    // Storage may be blocked; the token remains usable for this page view.
  }
}

async function loadAdminComments(state: AdminState): Promise<void> {
  const token = state.tokenInput.value;
  const term = state.termInput.value.trim();
  if (!token || !term) return;
  try {
    const response = await fetch(commentThreadUrl(term), { headers: adminHeaders(state) });
    if (!response.ok) throw new Error(message(state, await readApiError(response)));
    const data = await response.json() as { comments?: Comment[] };
    state.comments = Array.isArray(data.comments) ? data.comments : [];
    state.list.replaceChildren();
    for (const comment of state.comments) {
      const row = createElement("div", "grid gap-3 rounded-card border border-line bg-surface p-5");
      const author = createElement("strong", "text-sm text-fg");
      author.textContent = comment.name || "Anónimo";
      const body = createElement("p", "whitespace-pre-line text-sm text-muted");
      body.textContent = comment.body;
      const controls = createElement("div", "flex flex-wrap gap-3");
      const del = createElement("button", "btn");
      del.type = "button";
      del.textContent = "Eliminar";
      del.addEventListener("click", () => {
        if (window.confirm("¿Eliminar este comentario?")) void deleteAdminComment(state, comment.id);
      });
      controls.appendChild(del);
      if (!comment.parentId) {
        const replyForm = createElement("form", "grid gap-3 sm:grid-cols-[1fr_auto]");
        const replyInput = createElement("input", "min-h-11 rounded-card border border-line bg-ink px-4 text-base text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand");
        replyInput.name = "reply";
        replyInput.required = true;
        replyInput.minLength = 2;
        replyInput.maxLength = 2000;
        replyInput.setAttribute("aria-label", "Respuesta como autor");
        replyInput.placeholder = "Escribe tu respuesta";
        const send = createElement("button", "btn btn-primary");
        send.type = "submit";
        send.textContent = "Responder como autor";
        replyForm.appendChild(replyInput);
        replyForm.appendChild(send);
        replyForm.addEventListener("submit", (event) => {
          event.preventDefault();
          void replyAsAuthor(state, comment.id, replyInput.value);
          replyForm.reset();
        });
        controls.appendChild(replyForm);
      }
      row.appendChild(author);
      row.appendChild(body);
      row.appendChild(controls);
      state.list.appendChild(row);
    }
    state.status.textContent = "Comentarios cargados.";
  } catch (error) {
    state.status.textContent = error instanceof Error ? error.message : "No se pudieron cargar los comentarios.";
  }
}

async function deleteAdminComment(state: AdminState, id: string): Promise<void> {
  try {
    const response = await fetch(`${COMMENTS_API.replace(/\/$/, "")}/comments/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: adminHeaders(state),
    });
    if (!response.ok) throw new Error(message(state, await readApiError(response)));
    state.comments = state.comments.filter((comment) => comment.id !== id && comment.parentId !== id);
    await loadAdminComments(state);
    state.status.textContent = "Comentario eliminado.";
  } catch (error) {
    state.status.textContent = error instanceof Error ? error.message : "No se pudo eliminar el comentario.";
  }
}

async function replyAsAuthor(state: AdminState, parentId: string, body: string): Promise<void> {
  try {
    const response = await fetch(commentThreadUrl(state.termInput.value.trim()), {
      method: "POST",
      headers: adminHeaders(state, true),
      body: JSON.stringify({ body, parentId, name: "sbravo", website: "" }),
    });
    if (!response.ok) throw new Error(message(state, await readApiError(response)));
    await loadAdminComments(state);
  } catch (error) {
    state.status.textContent = error instanceof Error ? error.message : "No se pudo responder.";
  }
}

export function initAdminComments(): void {
  document.querySelectorAll<HTMLElement>("[data-admin-comments]").forEach((root) => {
    if (root.dataset.initialized) return;
    root.dataset.initialized = "true";
    const tokenInput = root.querySelector<HTMLInputElement>("[name=adminToken]");
    const termInput = root.querySelector<HTMLInputElement>("[name=thread]");
    const form = root.querySelector<HTMLFormElement>("[data-admin-form]");
    const list = root.querySelector<HTMLElement>("[data-admin-list]");
    const status = root.querySelector<HTMLElement>("[data-admin-status]");
    if (!tokenInput || !termInput || !form || !list || !status) return;
    try {
      tokenInput.value = localStorage.getItem("sb-admin-token") ?? "";
    } catch {
      // Storage may be unavailable; keep the password field empty.
    }
    const state: AdminState = { root, messages: readMessages(root), comments: [], list, tokenInput, termInput, form, status };
    tokenInput.addEventListener("change", () => persistAdminToken(tokenInput.value));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      persistAdminToken(tokenInput.value);
      void loadAdminComments(state);
    });
  });
}

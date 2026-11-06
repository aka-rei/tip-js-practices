export class ApiError extends Error {
  constructor(message, {
    kind,
    status = null,
    code = null,
    details = null,
    url = null,
    cause,
  } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

// Создаёт URL относительно baseUrl и добавляет непустые параметры query.
// Значения кодируются средствами URL и URLSearchParams, а не вручную.
export function buildUrl(baseUrl, path, query = {}) {
  let base;
  try { base = new URL(baseUrl); } catch { throw new TypeError("baseUrl должен быть абсолютным HTTP URL."); }
  if (!["http:", "https:"].includes(base.protocol) || base.search || base.hash) {
    throw new TypeError("baseUrl должен использовать HTTP(S) без query и hash.");
  }
  if (typeof path !== "string" || !path.trim() || /^[a-z][a-z\d+.-]*:/i.test(path)
    || path.includes("?") || path.includes("#") || path.includes("\\")) {
    throw new TypeError("Нужен непустой относительный путь без query и hash.");
  }
  if (!query || Object.getPrototypeOf(query) !== Object.prototype) throw new TypeError("query должен быть обычным объектом.");
  const relative = path.replace(/^\/+|\/+$/g, "");
  if (!relative || relative.split("/").some((part) => [".", ".."].includes(decodeURIComponent(part)))) {
    throw new TypeError("Путь должен оставаться внутри API.");
  }
  const url = new URL(`${base.href.replace(/\/+$/g, "")}/${relative}`);
  for (const [name, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(name, String(value));
  }
  return url.href;
}

// fetchFn передаётся явно, чтобы модуль можно было проверить без реальной сети.
// Возвращаемый объект: { requestJson(path, { query, signal, timeoutMs } = {}) }.
export function createApiClient({
  baseUrl,
  fetchFn = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  buildUrl(baseUrl, "/health");
  const validTimeout = (value) => Number.isSafeInteger(value) && value > 0 && value <= 2147483647;
  if (typeof fetchFn !== "function" || !validTimeout(timeoutMs)) throw new TypeError("Некорректные fetchFn или timeoutMs.");
  const defaultTimeout = timeoutMs;
  return {
    async requestJson(path, { method = "GET", body, query = {}, signal, timeoutMs = defaultTimeout } = {}) {
      if (typeof method !== "string") throw new TypeError("Метод должен быть строкой.");
      method = method.toUpperCase();
      if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) throw new TypeError("Недопустимый HTTP-метод.");
      if (method === "GET" && body !== undefined) throw new TypeError("GET не допускает body.");
      const serialized = body === undefined ? undefined : JSON.stringify(body);
      if (!validTimeout(timeoutMs)) throw new TypeError("timeoutMs должен быть положительным целым числом.");
      const url = buildUrl(baseUrl, path, query);
      const controller = new AbortController();
      let abortKind;
      const abort = (kind) => {
        if (controller.signal.aborted) return;
        abortKind = kind;
        controller.abort(new DOMException(kind, "AbortError"));
      };
      const onAbort = () => abort("aborted");
      if (signal?.aborted) onAbort();
      else signal?.addEventListener("abort", onAbort, { once: true });
      const timer = setTimeout(() => abort("timeout"), timeoutMs);
      const failure = (cause, fallback) => new ApiError(
        abortKind === "timeout" ? "Превышено время ожидания сервера."
          : abortKind === "aborted" ? "Запрос отменён." : "Не удалось получить корректный ответ API.",
        { kind: abortKind ?? fallback, url, cause },
      );
      const headers = { Accept: "application/json" };
      const request = { method, headers, signal: controller.signal };
      if (serialized !== undefined) {
        headers["Content-Type"] = "application/json";
        request.body = serialized;
      }
      try {
        let response;
        try {
          controller.signal.throwIfAborted();
          response = await fetchFn(url, request);
          controller.signal.throwIfAborted();
        } catch (cause) {
          throw failure(cause, "network");
        }
        if (!(response instanceof Response)) throw failure(undefined, "invalid-response");
        if (!response.ok) {
          let payload;
          try { payload = await response.json(); } catch { /* HTTP-статус сохраняется даже без JSON. */ }
          const error = payload?.error;
          throw new ApiError(typeof error?.message === "string" ? error.message : `HTTP ${response.status}`, {
            kind: "http", status: response.status, code: error?.code ?? null,
            details: error?.details ?? null, url,
          });
        }
        if (response.status === 204) return null;
        const mime = response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
        if (mime !== "application/json" && !/^application\/[\w.+-]+\+json$/.test(mime ?? "")) {
          throw failure(undefined, "invalid-response");
        }
        try {
          const payload = await response.json();
          controller.signal.throwIfAborted();
          return payload;
        } catch (cause) {
          throw failure(cause, "invalid-response");
        }
      } finally {
        clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
      }
    },
  };
}

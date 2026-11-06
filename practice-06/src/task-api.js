import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

export function isTask(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.title === "string"
    && value.title.trim().length >= 1
    && value.title.trim().length <= 100
    && typeof value.completed === "boolean"
    && ALLOWED_PRIORITIES.has(value.priority)
    && isPositiveSafeInteger(value.categoryId),
  );
}

export function isCategory(value) {
  return Boolean(
    value
    && typeof value === "object"
    && isPositiveSafeInteger(value.id)
    && typeof value.name === "string"
    && value.name.trim().length >= 1
    && value.name.trim().length <= 100,
  );
}

// client — объект, созданный createApiClient.
// Контракт результата:
// getTasks(filters) -> Promise<{ tasks, meta }>
// getTaskById(id) -> Promise<task>
// getCategories() -> Promise<category[]>
// loadInitialData(filters) -> Promise<{ tasks, categories, meta }>
export function createTaskApi(client) {
  if (!client || typeof client.requestJson !== "function") throw new TypeError("Нужен клиент с requestJson.");
  function normalizeFilters(filters) {
    if (!filters || Object.getPrototypeOf(filters) !== Object.prototype) throw new TypeError("Фильтры должны быть объектом.");
    const query = {};
    for (const [name, value] of Object.entries(filters)) {
      if (!ALLOWED_FILTERS.has(name)) throw new TypeError(`Неизвестный фильтр: ${name}`);
      if (value === undefined || value === null || value === "") continue;
      if (name === "completed" && typeof value !== "boolean"
        || name === "priority" && !ALLOWED_PRIORITIES.has(value)
        || name === "categoryId" && !isPositiveSafeInteger(value)
        || name === "q" && (typeof value !== "string" || value.trim().length > 100)) {
        throw new TypeError(`Некорректный фильтр: ${name}`);
      }
      const normalized = name === "q" ? value.trim() : value;
      if (normalized !== "") query[name] = normalized;
    }
    return query;
  }
  function collection(payload, predicate) {
    if (!Array.isArray(payload?.data) || !payload.data.every(predicate)
      || new Set(payload.data.map((item) => item.id)).size !== payload.data.length
      || payload.meta?.total !== payload.data.length) throw invalidResponse("Неверная схема коллекции API.");
    return payload.data;
  }
  function requireId(id) {
    if (!isPositiveSafeInteger(id)) throw new TypeError("ID должен быть положительным безопасным целым.");
  }
  function taskResult(payload) {
    if (!isTask(payload?.data)) throw invalidResponse("Неверная схема задачи API.");
    return payload.data;
  }
  async function getTasks(filters = {}, options = {}) {
    const payload = await client.requestJson("/tasks", { ...options, query: normalizeFilters(filters) });
    return { tasks: collection(payload, isTask), meta: payload.meta };
  }
  async function getTaskById(id, options = {}) {
    requireId(id);
    return taskResult(await client.requestJson(`/tasks/${id}`, options));
  }
  async function getCategories(options = {}) {
    return collection(await client.requestJson("/categories", options), isCategory);
  }
  async function loadInitialData(filters = {}, options = {}) {
    const [result, categories] = await Promise.all([getTasks(filters, options), getCategories(options)]);
    return { ...result, categories };
  }
  async function createTask(draft, options = {}) {
    return taskResult(await client.requestJson("/tasks", { ...options, method: "POST", body: draft }));
  }
  async function updateTask(id, changes, options = {}) {
    requireId(id);
    return taskResult(await client.requestJson(`/tasks/${id}`, { ...options, method: "PATCH", body: changes }));
  }
  async function setTaskCompleted(id, completed, options = {}) {
    if (typeof completed !== "boolean") throw new TypeError("Статус должен быть boolean.");
    return updateTask(id, { completed }, options);
  }
  async function deleteTask(id, options = {}) {
    requireId(id);
    const result = await client.requestJson(`/tasks/${id}`, { ...options, method: "DELETE" });
    if (result !== null) throw invalidResponse("Ожидался пустой ответ удаления.");
    return null;
  }
  async function resetDemoData(options = {}) {
    const result = await client.requestJson("/debug/reset", { ...options, method: "POST" });
    if (result?.data?.reset !== true || !Number.isSafeInteger(result.data.total) || result.data.total < 0) {
      throw invalidResponse("Неверное подтверждение сброса API.");
    }
    return result.data;
  }
  return { getTasks, getTaskById, getCategories, loadInitialData, createTask, updateTask,
    setTaskCompleted, deleteTask, resetDemoData };
}

import { ApiError } from "./api-client.js";

const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);
const ALLOWED_FILTERS = new Set(["completed", "priority", "categoryId", "q"]);

function invalidResponse(message) {
  return new ApiError(message, { kind: "invalid-response" });
}

function isPositiveSafeInteger(value) {
  return Number.isSafeInteger(value) && value > 0;
}

function isTask(value) {
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

function isCategory(value) {
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
  async function getTasks(filters = {}) {
    const payload = await client.requestJson("/tasks", { query: normalizeFilters(filters) });
    return { tasks: collection(payload, isTask), meta: payload.meta };
  }
  async function getTaskById(id) {
    requireId(id);
    return taskResult(await client.requestJson(`/tasks/${id}`));
  }
  async function getCategories() {
    return collection(await client.requestJson("/categories"), isCategory);
  }
  async function loadInitialData(filters = {}) {
    const [result, categories] = await Promise.all([getTasks(filters), getCategories()]);
    return { ...result, categories };
  }
  return { getTasks, getTaskById, getCategories, loadInitialData };
}

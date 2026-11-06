const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Возвращает { valid, value, errors }.
// value содержит нормализованные title, priority и числовой categoryId.
export function validateTaskDraft(draft, categories) {
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  const priority = draft?.priority;
  const rawCategory = draft?.categoryId;
  const categoryId = typeof rawCategory === "number" || typeof rawCategory === "string" ? Number(rawCategory) : NaN;
  const errors = {};
  if (title.length < 1 || title.length > 100) errors.title = "Название должно содержать от 1 до 100 символов.";
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите допустимый приоритет.";
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !categories.some((category) => category.id === categoryId)) {
    errors.categoryId = "Выберите существующую категорию.";
  }
  return Object.keys(errors).length
    ? { valid: false, value: null, errors }
    : { valid: true, value: { title, priority, categoryId }, errors: {} };
}

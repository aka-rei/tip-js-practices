const ALLOWED_PRIORITIES = new Set(["low", "medium", "high"]);

// Чистая проверка данных формы. DOM и показ сообщений выполняются в main.js.
// draft: { id, title, priority }; editingId: null либо id редактируемой задачи.
export function validateTaskDraft(draft, tasks, editingId = null) {
  const errors = {};
  const rawId = editingId === null ? draft?.id : editingId;
  const id = editingId !== null ? editingId
    : typeof rawId === "string" || typeof rawId === "number" ? Number(rawId) : NaN;
  const title = typeof draft?.title === "string" ? draft.title.trim() : "";
  const priority = draft?.priority;
  if (!Number.isSafeInteger(id) || id <= 0) {
    errors.id = "Укажите положительный целый безопасный ID.";
  } else if (editingId === null && tasks.some((task) => task.id === id)) {
    errors.id = "Задача с таким ID уже существует.";
  } else if (editingId !== null && !tasks.some((task) => task.id === id)) {
    errors.id = "Редактируемая задача не найдена.";
  }
  if (title.length < 1 || title.length > 100) errors.title = "Название должно содержать от 1 до 100 символов.";
  if (!ALLOWED_PRIORITIES.has(priority)) errors.priority = "Выберите допустимый приоритет.";
  return Object.keys(errors).length
    ? { ok: false, errors }
    : { ok: true, value: { id, title, priority } };
}

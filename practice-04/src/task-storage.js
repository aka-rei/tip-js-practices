export const STORAGE_VERSION = 1;
const copyTasks = (tasks) => tasks.map((task) => ({ ...task }));

// Все функции принимают объект storage явно, чтобы их можно было проверить
// без обращения к глобальному window.localStorage.

export function isValidTaskList(value) {
  if (!Array.isArray(value)) return false;
  const ids = new Set();
  return value.every((task) => {
    if (!task || typeof task !== "object" || Array.isArray(task)
      || !Number.isSafeInteger(task.id) || task.id <= 0 || ids.has(task.id)
      || typeof task.title !== "string" || task.title !== task.title.trim()
      || task.title.length < 1 || task.title.length > 100
      || typeof task.completed !== "boolean"
      || !["low", "medium", "high"].includes(task.priority)) return false;
    ids.add(task.id);
    return true;
  });
}

export function loadTasks(storage, key, fallbackTasks) {
  const fallback = copyTasks(fallbackTasks);
  try {
    const raw = storage.getItem(key);
    if (raw === null) return { ok: true, source: "initial", tasks: fallback };
    const payload = JSON.parse(raw);
    if (!payload || payload.version !== STORAGE_VERSION || !isValidTaskList(payload.tasks)) {
      throw new Error("Неверная версия или схема сохранённых задач.");
    }
    return { ok: true, source: "storage", tasks: copyTasks(payload.tasks) };
  } catch (error) {
    return { ok: false, source: "fallback", tasks: fallback, error: `Не удалось прочитать сохранённые задачи: ${error.message}` };
  }
}

export function saveTasks(storage, key, tasks) {
  if (!isValidTaskList(tasks)) return { ok: false, error: "Некорректный список задач не сохранён." };
  try {
    storage.setItem(key, JSON.stringify({ version: STORAGE_VERSION, tasks }));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось сохранить задачи: ${error.message}` };
  }
}

export function removeSavedTasks(storage, key) {
  try {
    storage.removeItem(key);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: `Не удалось удалить сохранённые задачи: ${error.message}` };
  }
}

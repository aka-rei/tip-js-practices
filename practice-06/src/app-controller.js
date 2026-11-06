import { ApiError } from "./api-client.js";
import { validateTaskDraft } from "./form-validation.js";

export function messageForError(error) {
  if (!(error instanceof ApiError)) return "Не удалось выполнить операцию.";
  if (error.kind === "timeout") return "Сервер не ответил вовремя. Попробуйте ещё раз.";
  if (error.kind === "network") return "Нет соединения с учебным API. Проверьте, запущен ли npm start.";
  if (error.kind === "invalid-response") return "Сервер вернул ответ неожиданного формата.";
  if (error.kind === "http" && error.status === 404) return "Запись уже отсутствует на сервере. Обновите список.";
  if (error.kind === "http") return error.message || `Сервер вернул ошибку ${error.status}.`;
  return "Не удалось выполнить операцию.";
}

// view — адаптер из dom-app.js. Контроллер не должен обращаться к document.
// Обязательные методы результата:
// start, applyFilters, refresh, submit, beginEdit, cancelEdit,
// toggleTask, deleteTask, resetData и destroy.
export function createAppController({ api, view, validateDraft = validateTaskDraft } = {}) {
  const apiMethods = ["loadInitialData", "getTasks", "createTask", "updateTask", "setTaskCompleted", "deleteTask", "resetDemoData"];
  const viewMethods = ["setListState", "setTasks", "setCategories", "setTotal", "setFormTask", "showFormErrors", "setMutationPending", "notify"];
  if (!apiMethods.every((name) => typeof api?.[name] === "function")
    || !viewMethods.every((name) => typeof view?.[name] === "function")
    || typeof validateDraft !== "function") throw new TypeError("Нужны API, представление и валидатор.");
  let tasks = [];
  let categories = [];
  let categoriesLoaded = false;
  let filters = {};
  let editingId = null;
  let activeLoad;
  let loadNumber = 0;
  let mutationPending = false;
  let destroyed = false;

  async function load() {
    if (destroyed) return;
    const number = ++loadNumber;
    activeLoad?.abort();
    const controller = new AbortController();
    activeLoad = controller;
    view.setListState("loading");
    try {
      const result = categoriesLoaded
        ? await api.getTasks({ ...filters }, { signal: controller.signal })
        : await api.loadInitialData({ ...filters }, { signal: controller.signal });
      if (destroyed || number !== loadNumber || controller.signal.aborted) return;
      if (!categoriesLoaded) {
        categories = result.categories;
        categoriesLoaded = true;
        view.setCategories(categories);
      }
      tasks = result.tasks;
      view.setTasks(tasks, categories);
      view.setTotal(result.meta.total);
      view.setListState(tasks.length ? "ready" : "empty");
      // Новые карточки тоже блокируются, пока операция ещё выполняется.
      if (mutationPending) view.setMutationPending(true);
    } catch (error) {
      if (destroyed || number !== loadNumber || controller.signal.aborted || error?.kind === "aborted") return;
      tasks = [];
      view.setTasks([], categories);
      view.setTotal(0);
      view.setListState("error", messageForError(error));
    } finally {
      if (number === loadNumber) activeLoad = null;
    }
  }
  function cancelEdit() {
    editingId = null;
    view.showFormErrors({});
    view.setFormTask(null);
  }
  async function mutate(action, message, afterSuccess = () => {}) {
    if (destroyed || mutationPending) return;
    mutationPending = true;
    // Не даём загрузке, начатой до изменения, отрисовать старый список.
    ++loadNumber;
    activeLoad?.abort();
    view.setMutationPending(true);
    try {
      await action();
      if (destroyed) return;
      afterSuccess();
      view.notify(message, "success");
      await load();
    } catch (error) {
      if (!destroyed && error?.kind !== "aborted") view.notify(messageForError(error), "error");
    } finally {
      mutationPending = false;
      if (!destroyed) view.setMutationPending(false);
    }
  }
  function findTask(id) {
    const task = tasks.find((task) => task.id === id);
    if (!task) view.notify("Задача отсутствует в текущем списке. Обновите данные.", "error");
    return task;
  }
  return {
    start(initialFilters = {}) {
      filters = { ...initialFilters };
      return load();
    },
    applyFilters(nextFilters = {}) {
      filters = { ...nextFilters };
      return load();
    },
    refresh: load,
    async submit(draft) {
      if (destroyed || mutationPending) return;
      const result = validateDraft(draft, categories);
      view.showFormErrors(result.errors);
      if (!result.valid) return;
      const id = editingId;
      return mutate(() => id === null ? api.createTask(result.value) : api.updateTask(id, result.value),
        "Задача сохранена.", cancelEdit);
    },
    beginEdit(id) {
      if (destroyed || mutationPending) return;
      const task = findTask(id);
      if (!task) return;
      editingId = id;
      view.showFormErrors({});
      view.setFormTask(task);
    },
    cancelEdit,
    toggleTask(id) {
      const task = findTask(id);
      if (!task) return Promise.resolve();
      return mutate(() => api.setTaskCompleted(id, !task.completed), "Статус изменён.");
    },
    deleteTask(id) {
      if (!findTask(id)) return Promise.resolve();
      return mutate(() => api.deleteTask(id), "Задача удалена.", () => {
        if (editingId === id) cancelEdit();
      });
    },
    resetData() {
      return mutate(() => api.resetDemoData(), "Исходные данные восстановлены.", cancelEdit);
    },
    destroy() {
      destroyed = true;
      ++loadNumber;
      activeLoad?.abort();
    },
  };
}

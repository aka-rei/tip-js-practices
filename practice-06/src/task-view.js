const PRIORITY_LABELS = Object.freeze({
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
});

export function createTaskElement(task, category) {
  const item = document.createElement("li");
  item.className = "task-card";
  item.classList.toggle("is-completed", task.completed);
  item.dataset.taskId = String(task.id);
  function textNode(tag, className, text) {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }
  const title = textNode("h3", "task-title", task.title);
  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.append(
    textNode("span", "task-status", task.completed ? "Выполнена" : "В работе"),
    textNode("span", "task-priority", PRIORITY_LABELS[task.priority]),
    textNode("span", "task-category", category?.name ?? "Неизвестная категория"),
  );
  const actions = document.createElement("div");
  actions.className = "task-actions";
  for (const [action, label] of [["toggle", task.completed ? "Вернуть в работу" : "Выполнена"], ["edit", "Изменить"], ["delete", "Удалить"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.action = action;
    if (action === "toggle") button.setAttribute("aria-pressed", String(task.completed));
    button.append(textNode("span", "action-label", label));
    actions.append(button);
  }
  item.append(title, meta, actions);
  return item;
}

export function renderTaskList(list, tasks, categories) {
  const byId = new Map(categories.map((category) => [category.id, category]));
  list.replaceChildren(...tasks.map((task) => createTaskElement(task, byId.get(task.categoryId))));
}

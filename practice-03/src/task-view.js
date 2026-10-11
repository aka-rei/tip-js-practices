import { getTaskStats } from "./task-service.js";

// Здесь создаётся DOM, но не изменяется состояние приложения.
// Контракт карточки, селекторы и тексты описаны в методичке.
export function createTaskElement(task) {
  const card = document.createElement("li");
  card.classList.add("task-card");
  card.dataset.taskId = String(task.id);

  if (task.completed) {
    card.classList.add("is-completed");
  }

  const title = document.createElement("h3");
  title.classList.add("task-title");
  title.textContent = task.title;

  const status = document.createElement("span");
  status.classList.add("task-status");
  status.textContent = task.completed
    ? "Выполнена"
    : "В работе";

  const priority = document.createElement("span");
  priority.classList.add("task-priority");

  const priorityNames = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };

  priority.textContent = priorityNames[task.priority];

  const actions = document.createElement("div");
  actions.classList.add("task-actions");

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.dataset.action = "toggle";
  toggleButton.setAttribute(
    "aria-pressed",
    String(task.completed)
  );

  const toggleLabel = document.createElement("span");
  toggleLabel.classList.add("action-label");
  toggleLabel.textContent = "Выполнена";
  toggleButton.append(toggleLabel);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.dataset.action = "delete";

  const deleteLabel = document.createElement("span");
  deleteLabel.classList.add("action-label");
  deleteLabel.textContent = "Удалить";
  deleteButton.append(deleteLabel);

  actions.append(toggleButton, deleteButton);

  card.append(title, status, priority, actions);

  return card;
}

export function renderTaskList(listElement, tasks) {
  const cards = tasks.map((task) => createTaskElement(task));

  listElement.replaceChildren(...cards);
}


export function renderSummary(summaryElement, tasks, visibleCount) {
  const stats = getTaskStats(tasks);

  summaryElement.querySelector('[data-stat="total"]').textContent =
    String(stats.total);

  summaryElement.querySelector('[data-stat="completed"]').textContent =
    String(stats.completed);

  summaryElement.querySelector('[data-stat="pending"]').textContent =
    String(stats.pending);

  summaryElement.querySelector('[data-stat="progress"]').textContent =
    `${stats.progress.toFixed(1)}%`;

  summaryElement.querySelector('[data-stat="visible"]').textContent =
    String(visibleCount);
}



export function renderEmptyState(messageElement, total, visibleCount) {
  if (total === 0) {
    messageElement.textContent = "Список задач пуст.";
    messageElement.hidden = false;
    return;
  }

  if (visibleCount === 0) {
    messageElement.textContent =
      "Нет задач по выбранному фильтру.";
    messageElement.hidden = false;
    return;
  }

  messageElement.textContent = "";
  messageElement.hidden = true;
}


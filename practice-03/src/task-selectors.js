// Новый модуль ПР3. Вход: корректный массив задач и фильтр all/pending/completed.
// Результат: новый массив, исходный порядок и объекты сохраняются.

export function getVisibleTasks(tasks, filter = "all") {
  switch (filter) {
    case "pending":
      return tasks.filter((task) => task.completed === false);

    case "completed":
      return tasks.filter((task) => task.completed === true);

    case "all":
    default:
      return [...tasks];
  }
}


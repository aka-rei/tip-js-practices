// Заготовка модуля. throw ниже отмечает отсутствие реализации,
// а не способ обработки некорректных данных в готовом решении.
// Для предусмотренных ошибок необходимо возвращать { ok: false, error: "..." }.
// console.log(), prompt(), document и чтение внешнего состояния здесь не нужны.

export function createTask(id, title, priority = "medium") {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return {
      ok: false,
      error: "ID должен быть положительным безопасным целым числом",
    };
  }

  if (typeof title !== "string") {
    return {
      ok: false,
      error: "Название задачи должно быть строкой",
    };
  }

  const trimmedTitle = title.trim();

  if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
    return {
      ok: false,
      error: "Название задачи должно содержать от 1 до 100 символов",
    };
  }

  const allowedPriorities = ["low", "medium", "high"];

  if (!allowedPriorities.includes(priority)) {
    return {
      ok: false,
      error: "Приоритет должен быть low, medium или high",
    };
  }

  return {
    ok: true,
    task: {
      id,
      title: trimmedTitle,
      completed: false,
      priority,
    },
  };
}


export function findTaskById(tasks, id) {
  return tasks.find((task) => task.id === id);
}

export function getPendingTasks(tasks) {
  return tasks.filter((task) => task.completed === false);
}

export function getTaskTitles(tasks) {
  return tasks.map((task) => task.title);
}

export function getTaskStats(tasks) {
   const total = tasks.length;

  let completed = 0;

  for (const task of tasks) {
    if (task.completed === true) {
      completed += 1;
    }
  }

  const pending = total - completed;
  const progress = total > 0
    ? (completed / total) * 100
    : 0;

  return {
    total,
    completed,
    pending,
    progress,
  };
}

export function addTask(tasks, id, title, priority = "medium") {const creationResult = createTask(id, title, priority);

  if (!creationResult.ok) {
    return creationResult;
  }

  const taskExists = tasks.some((task) => task.id === id);

  if (taskExists) {
    return {
      ok: false,
      error: "Задача с таким ID уже существует",
    };
  }

  return {
    ok: true,
    tasks: [...tasks, creationResult.task],
  };
}

export function setTaskCompleted(tasks, id, completed) {
    if (!Number.isSafeInteger(id) || id <= 0) {
    return {
      ok: false,
      error: "ID должен быть положительным безопасным целым числом",
    };
  }

  if (typeof completed !== "boolean") {
    return {
      ok: false,
      error: "Статус completed должен быть логическим значением",
    };
  }

  const taskExists = tasks.some((task) => task.id === id);

  if (!taskExists) {
    return {
      ok: false,
      error: "Задача не найдена",
    };
  }

  const newTasks = tasks.map((task) =>
    task.id === id
      ? { ...task, completed }
      : task
  );

  return {
    ok: true,
    tasks: newTasks,
  };
}

export function renameTask(tasks, id, title) {
 if (!Number.isSafeInteger(id) || id <= 0) {
    return {
      ok: false,
      error: "ID должен быть положительным безопасным целым числом",
    };
  }

  if (typeof title !== "string") {
    return {
      ok: false,
      error: "Название задачи должно быть строкой",
    };
  }

  const trimmedTitle = title.trim();

  if (trimmedTitle.length < 1 || trimmedTitle.length > 100) {
    return {
      ok: false,
      error: "Название задачи должно содержать от 1 до 100 символов",
    };
  }

  const taskExists = tasks.some((task) => task.id === id);

  if (!taskExists) {
    return {
      ok: false,
      error: "Задача не найдена",
    };
  }

  const newTasks = tasks.map((task) =>
    task.id === id
      ? { ...task, title: trimmedTitle }
      : task
  );

  return {
    ok: true,
    tasks: newTasks,
  };
}

export function removeTask(tasks, id) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return {
      ok: false,
      error: "ID должен быть положительным безопасным целым числом",
    };
  }

  const taskExists = tasks.some((task) => task.id === id);

  if (!taskExists) {
    return {
      ok: false,
      error: "Задача не найдена",
    };
  }

  const newTasks = tasks.filter((task) => task.id !== id);

  return {
    ok: true,
    tasks: newTasks,
  };
}
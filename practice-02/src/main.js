import { demoTasks, variantNumber, variantTasks } from "./data.js";
import {
  createTask,
  findTaskById,
  getPendingTasks,
  getTaskTitles,
  getTaskStats,
  addTask,
  setTaskCompleted,
  renameTask,
  removeTask,
} from "./task-service.js";

function showStats(tasks) {
  const { total, completed, pending, progress } = getTaskStats(tasks);

  console.log(
    `Всего: ${total}; выполнено: ${completed}; осталось: ${pending}`
  );

  if (total === 0) {
    console.log("Задач пока нет");
  } else {
    console.log(`Прогресс: ${progress.toFixed(1)}%`);
  }
}

console.log("=== Общий сценарий ===");

console.log("\nИсходные задачи:");
console.table(demoTasks);

console.log("Названия задач:");
console.log(getTaskTitles(demoTasks));

console.log("Невыполненные задачи:");
console.table(getPendingTasks(demoTasks));

console.log("Исходная сводка:");
showStats(demoTasks);

let currentTasks = demoTasks;

// Добавление id = 20
console.log("\n=== Добавление id = 20 ===");

let result = addTask(
  currentTasks,
  20,
  "Добавить проверку",
  "high"
);

if (result.ok) {
  currentTasks = result.tasks;
  showStats(currentTasks);
} else {
  console.error(`Ошибка: ${result.error}`);
}

// Выполнение id = 4
console.log("\n=== Выполнение id = 4 ===");

result = setTaskCompleted(currentTasks, 4, true);

if (result.ok) {
  currentTasks = result.tasks;
  showStats(currentTasks);
} else {
  console.error(`Ошибка: ${result.error}`);
}

// Переименование id = 10
console.log("\n=== Переименование id = 10 ===");

result = renameTask(
  currentTasks,
  10,
  "Подготовить инструкцию запуска"
);

if (result.ok) {
  currentTasks = result.tasks;
  showStats(currentTasks);
} else {
  console.error(`Ошибка: ${result.error}`);
}

// Удаление id = 7
console.log("\n=== Удаление id = 7 ===");

result = removeTask(currentTasks, 7);

if (result.ok) {
  currentTasks = result.tasks;
  showStats(currentTasks);
} else {
  console.error(`Ошибка: ${result.error}`);
}

// Намеренная ошибка
console.log("\n=== Проверка ошибки ===");

result = addTask(
  currentTasks,
  20,
  "Повторная задача",
  "medium"
);

if (result.ok) {
  currentTasks = result.tasks;
} else {
  console.error(`Ошибка: ${result.error}`);
}

// Итог
console.log("\n=== Итоговые задачи ===");
console.table(currentTasks);

console.log(
  "Итоговые ID:",
  currentTasks.map((task) => task.id)
);

// Проверяем, что исходный массив не изменился
console.log("\n=== Проверка исходного demoTasks ===");
console.table(demoTasks);
console.log("Количество задач demoTasks:", demoTasks.length);

console.log("\n=== Собственные проверки ===");

// Проверка 1: добавление после удаления
let testTasks1 = demoTasks;

let testResult = removeTask(testTasks1, 7);

if (testResult.ok) {
  testTasks1 = testResult.tasks;
}

testResult = addTask(
  testTasks1,
  30,
  "Задача после удаления",
  "low"
);

console.log(
  "1. Добавление после удаления:",
  testResult.ok &&
    testResult.tasks.some((task) => task.id === 30)
    ? "OK"
    : "FAIL"
);


// Проверка 2: изменение первой задачи
let testTasks2 = demoTasks;

testResult = renameTask(
  testTasks2,
  1,
  "Новое название первой задачи"
);

console.log(
  "2. Изменение первой задачи:",
  testResult.ok &&
    findTaskById(testResult.tasks, 1).title ===
      "Новое название первой задачи"
    ? "OK"
    : "FAIL"
);


// Проверка 3: последовательное изменение нескольких задач
let testTasks3 = demoTasks;

testResult = setTaskCompleted(testTasks3, 4, true);

if (testResult.ok) {
  testTasks3 = testResult.tasks;
}

testResult = setTaskCompleted(testTasks3, 7, true);

if (testResult.ok) {
  testTasks3 = testResult.tasks;
}

const testStats = getTaskStats(testTasks3);

console.log(
  "3. Последовательное изменение нескольких задач:",
  testStats.completed === 4
    ? "OK"
    : "FAIL"
);

console.log("\n=== Индивидуальный вариант ===");
console.log("Вариант:", variantNumber);

console.log("\nИсходные задачи варианта:");
console.table(variantTasks);

console.log("Исходная сводка:");
showStats(variantTasks);

let variantCurrentTasks = variantTasks;

// 1. Добавление id = 80
console.log("\n=== Добавление id = 80 ===");

let variantResult = addTask(
  variantCurrentTasks,
  80,
  "Провести итоговую репетицию",
  "medium"
);

if (variantResult.ok) {
  variantCurrentTasks = variantResult.tasks;
  showStats(variantCurrentTasks);
} else {
  console.error(`Ошибка: ${variantResult.error}`);
}

// 2. Установка completed = true для id = 11
console.log("\n=== Выполнение id = 11 ===");

variantResult = setTaskCompleted(
  variantCurrentTasks,
  11,
  true
);

if (variantResult.ok) {
  variantCurrentTasks = variantResult.tasks;
  showStats(variantCurrentTasks);
} else {
  console.error(`Ошибка: ${variantResult.error}`);
}

// 3. Переименование id = 23
console.log("\n=== Переименование id = 23 ===");

variantResult = renameTask(
  variantCurrentTasks,
  23,
  "Составить подробный план выступления"
);

if (variantResult.ok) {
  variantCurrentTasks = variantResult.tasks;
  showStats(variantCurrentTasks);
} else {
  console.error(`Ошибка: ${variantResult.error}`);
}

// 4. Удаление id = 37
console.log("\n=== Удаление id = 37 ===");

variantResult = removeTask(
  variantCurrentTasks,
  37
);

if (variantResult.ok) {
  variantCurrentTasks = variantResult.tasks;
  showStats(variantCurrentTasks);
} else {
  console.error(`Ошибка: ${variantResult.error}`);
}

// 5. Повторная попытка добавить id = 80
console.log("\n=== Повторное добавление id = 80 ===");

variantResult = addTask(
  variantCurrentTasks,
  80,
  "Повторная задача",
  "medium"
);

if (variantResult.ok) {
  variantCurrentTasks = variantResult.tasks;
} else {
  console.error(`Ожидаемая ошибка: ${variantResult.error}`);
}

// Итог
console.log("\n=== Итог варианта ===");
console.table(variantCurrentTasks);

console.log(
  "Итоговые ID:",
  variantCurrentTasks.map((task) => task.id)
);

console.log("Итоговая сводка:");
showStats(variantCurrentTasks);

// Проверяем исходный variantTasks
console.log("\n=== Проверка исходного variantTasks ===");
console.table(variantTasks);
console.log("Исходных задач:", variantTasks.length);
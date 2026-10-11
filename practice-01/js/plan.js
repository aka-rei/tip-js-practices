"use strict";

const totalTasks = 15;
const completedTasks = 0;
const dailyLimit = 4;


const tasksAreValid =
  Number.isFinite(totalTasks) &&
  Number.isFinite(completedTasks) &&
  Number.isInteger(totalTasks) &&
  Number.isInteger(completedTasks) &&
  totalTasks >= 0 &&
  totalTasks <= 1000 &&
  completedTasks >= 0 &&
  completedTasks <= totalTasks;

const dailyLimitIsValid =
  Number.isFinite(dailyLimit) &&
  Number.isInteger(dailyLimit) &&
  dailyLimit >= 1 &&
  dailyLimit <= 1000;

if (!tasksAreValid) {
  console.log("Ошибка: некорректное количество задач");
} else if (!dailyLimitIsValid) {
  console.log("Ошибка: некорректная дневная норма");
} else {
  let remainingTasks = totalTasks - completedTasks;
  let day = 0;

  console.log(`Осталось задач: ${remainingTasks}`);

  if (remainingTasks === 0) {
    console.log("Все задачи уже выполнены");
    console.log("Потребуется дней: 0");
  } else {
    while (remainingTasks > 0) {
      day += 1;

      const tasksToday = Math.min(dailyLimit, remainingTasks);
      remainingTasks -= tasksToday;

      console.log(
        `День ${day}: выполнено ${tasksToday}, осталось ${remainingTasks}`
      );
    }

    console.log(`Потребуется дней: ${day}`);
  }
}
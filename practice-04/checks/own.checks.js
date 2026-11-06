import assert from "node:assert/strict";
import { validateTaskDraft } from "../src/form-validation.js";
import { loadTasks, saveTasks, isValidTaskList } from "../src/task-storage.js";
import { updateTask } from "../src/task-service.js";

const tasks = [{ id: 1, title: "Доклад", completed: true, priority: "high" }];
const storage = new Map();
const adapter = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
};
const valid = validateTaskDraft({ id: "75", title: ` ${"я".repeat(100)} `, priority: "low" }, tasks);
assert.equal(valid.ok, true);
assert.equal(valid.value.title.length, 100);
assert.equal(validateTaskDraft({ id: "75", title: "я".repeat(101), priority: "low" }, tasks).ok, false);
assert.equal(validateTaskDraft({ title: "Доклад", priority: "high" }, tasks, "1").ok, false);
assert.equal(updateTask(tasks, 1, "Доклад", undefined).ok, false);
console.log("OK: граница 100/101 символ после trim для кириллицы");

assert.equal(saveTasks(adapter, "demo", []).ok, true);
const reloaded = loadTasks(adapter, "demo", tasks);
assert.equal(reloaded.source, "storage");
assert.deepEqual(reloaded.tasks, []);
assert.deepEqual(tasks.map((task) => task.id), [1]);
console.log("OK: сохранённый пустой список восстанавливается, исходные задачи не возвращаются");

storage.set("demo", JSON.stringify({ version: 1, tasks: [{ ...tasks[0], title: " Доклад " }] }));
assert.equal(isValidTaskList([{ ...tasks[0], title: " Доклад " }]), false);
const fallback = loadTasks(adapter, "demo", tasks);
assert.equal(fallback.source, "fallback");
fallback.tasks[0].title = "Изменено";
assert.equal(tasks[0].title, "Доклад");
console.log("OK: ненормализованная запись отклоняется целиком; fallback независим");
console.log("Собственные проверки: 3/3.");

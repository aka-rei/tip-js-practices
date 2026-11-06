import assert from "node:assert/strict";
import { createAppController } from "../src/app-controller.js";

const task = { id: 4, title: "Доклад", completed: true, priority: "high", categoryId: 2 };
const initial = { tasks: [task], categories: [{ id: 2, name: "Проект" }], meta: { total: 1 } };
function viewDouble() {
  return {
    renders: [], notices: [],
    setTasks(tasks) { this.renders.push(tasks); },
    notify(...args) { this.notices.push(args); },
    setCategories() {}, setTotal() {}, setListState() {}, setFormTask() {},
    showFormErrors() {}, setMutationPending() {},
  };
}
function apiDouble(changes = {}) {
  return {
    async loadInitialData() { return initial; },
    async getTasks() { return initial; },
    async createTask() { return task; }, async updateTask() { return task; },
    async setTaskCompleted() { return task; }, async deleteTask() { return null; },
    async resetDemoData() { return { reset: true, total: 12 }; },
    ...changes,
  };
}

let finish;
let calls = 0;
const pending = new Promise((resolve) => { finish = resolve; });
const view = viewDouble();
const controller = createAppController({ api: apiDouble({ createTask() { calls += 1; return pending; } }), view });
await controller.start();
const draft = { title: "Новая", priority: "medium", categoryId: "2" };
const first = controller.submit(draft);
await controller.submit(draft);
assert.equal(calls, 1);
finish(task);
await first;
console.log("OK: два быстрых submit создают ровно один запрос");

let resolveLoad;
let signal;
const closingView = viewDouble();
const closing = createAppController({
  api: apiDouble({ loadInitialData(_filters, options) {
    signal = options.signal;
    return new Promise((resolve) => { resolveLoad = resolve; });
  } }), view: closingView,
});
const loading = closing.start();
closing.destroy();
assert.equal(signal.aborted, true);
resolveLoad(initial);
await loading;
assert.equal(closingView.renders.length, 0);
assert.equal(closingView.notices.length, 0);
console.log("OK: destroy отменяет загрузку и игнорирует поздний успешный ответ");
console.log("Собственные проверки: 2/2.");

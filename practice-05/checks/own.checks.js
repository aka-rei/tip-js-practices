import assert from "node:assert/strict";
import { once } from "node:events";
import { createApiServer } from "../api/server.mjs";
import { createApiClient, buildUrl } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { variantFilters } from "../src/variant.js";

const server = createApiServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const baseUrl = `http://127.0.0.1:${server.address().port}/api`;
const client = createApiClient({ baseUrl });
const api = createTaskApi(client);
try {
  const query = Object.freeze({ completed: true, priority: "high", categoryId: 2, q: " API & ошибки " });
  assert.equal(new URL(buildUrl(baseUrl, "/tasks", query)).searchParams.get("q"), query.q);
  const result = await api.getTasks(query);
  assert.deepEqual(result.tasks, []);
  assert.equal(result.meta.filters.q, "API & ошибки");
  console.log("OK: собственная комбинация четырёх фильтров, кириллица и амперсанд");

  await assert.rejects(() => client.requestJson("/categories/999"), (error) =>
    error.kind === "http" && error.status === 404 && error.code === "CATEGORY_NOT_FOUND");
  console.log("OK: отсутствующая категория даёт HTTP 404 CATEGORY_NOT_FOUND");

  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  const fake = createApiClient({ baseUrl, fetchFn: async () => { calls += 1; return new Response(); } });
  await assert.rejects(() => fake.requestJson("/tasks", { signal: controller.signal }), (error) => error.kind === "aborted");
  assert.equal(calls, 0);
  console.log("OK: заранее отменённый сигнал не вызывает fetch");

  const variant = await api.getTasks(variantFilters);
  assert.deepEqual(variant.tasks.map((task) => task.id), [1, 10, 16, 25, 31]);
  assert.equal(variant.meta.total, 5);
  console.log("OK: индивидуальный вариант 2, completed=true, пять ожидаемых id");
  console.log("Собственные проверки: 4/4.");
} finally {
  await new Promise((resolve) => server.close(resolve));
}

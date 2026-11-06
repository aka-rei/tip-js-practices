// Воспроизводимый HTTP-протокол и измерения; API запускается на свободном порту.
import { once } from "node:events";
import { spawn } from "node:child_process";
import { createApiServer } from "../api/server.mjs";
import { createApiClient, buildUrl } from "../src/api-client.js";
import { createTaskApi } from "../src/task-api.js";
import { variantFilters } from "../src/variant.js";

let server = createApiServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/api`;
const client = createApiClient({ baseUrl });
const api = createTaskApi(client);
const report = { baseUrl, observations: [], errors: [], sequential: [], parallel: [] };
async function recordError(name, action) {
  try { await action(); throw new Error("Ожидалась ошибка"); }
  catch (error) {
    if (!error.kind) throw error;
    report.errors.push({ name, kind: error.kind, status: error.status, code: error.code, details: error.details, url: error.url });
  }
}
async function runClient() {
  const child = spawn(process.execPath, [new URL("../src/main.js", import.meta.url).pathname.replace(/^\/(\w:)/, "$1")], {
    env: { ...process.env, API_URL: baseUrl }, stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  const [code] = await once(child, "close");
  return { code, output };
}
try {
  for (const path of ["/health", "/tasks", "/tasks?completed=false&priority=high", "/tasks/25", "/tasks/999", "/categories"]) {
    const response = await fetch(`${baseUrl}${path}`);
    report.observations.push({ path, method: "GET", status: response.status, ok: response.ok,
      contentType: response.headers.get("content-type"), payload: await response.json() });
  }
  report.domain = {
    all: await api.getTasks(),
    pendingHigh: await api.getTasks({ completed: false, priority: "high" }),
    task25: await api.getTaskById(25),
    initial: await api.loadInitialData({ completed: false, priority: "high" }),
    variantUrl: buildUrl(baseUrl, "/tasks", variantFilters),
    variant: await api.getTasks(variantFilters),
  };
  for (const path of ["/tasks/999", "/debug/error", "/debug/invalid-json", "/debug/text"]) {
    await recordError(path, () => client.requestJson(path));
  }
  await recordError("completed=yes", () => client.requestJson("/tasks", { query: { completed: "yes" } }));
  await recordError("timeout", () => client.requestJson("/debug/delay", { query: { ms: 150 }, timeoutMs: 20 }));
  const controller = new AbortController();
  const pending = client.requestJson("/debug/delay", { query: { ms: 150 }, signal: controller.signal });
  controller.abort();
  await recordError("abort", () => pending);
  for (let i = 0; i < 3; i += 1) {
    let started = performance.now();
    await client.requestJson("/debug/delay", { query: { ms: 150 } });
    await client.requestJson("/debug/delay", { query: { ms: 150 } });
    report.sequential.push(Number((performance.now() - started).toFixed(1)));
    started = performance.now();
    await Promise.all([client.requestJson("/debug/delay", { query: { ms: 150 } }), client.requestJson("/debug/delay", { query: { ms: 150 } })]);
    report.parallel.push(Number((performance.now() - started).toFixed(1)));
  }
  report.client = await runClient();
  await new Promise((resolve) => server.close(resolve));
  await recordError("offline", () => client.requestJson("/health"));
  report.clientOffline = await runClient();
  server = createApiServer();
  server.listen(port, "127.0.0.1");
  await once(server, "listening");
  report.clientRestarted = await runClient();
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (server.listening) await new Promise((resolve) => server.close(resolve));
}

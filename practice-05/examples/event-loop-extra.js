// Прогноз до запуска: A, B, C, D, E, G, F.
// G зарегистрирована после двух первых микрозадач, но до выполнения таймера.
import "./event-loop.js";
Promise.resolve().then(() => console.log("G: дополнительный обработчик Promise"));

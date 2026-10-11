"use strict";

const result1 = "8" + 2;
console.log('1. "8" + 2');
console.log("Результат:", result1);
console.log("Тип результата:", typeof result1);

const result2 = "8" - 2;
console.log('\n2. "8" - 2');
console.log("Результат:", result2);
console.log("Тип результата:", typeof result2);

const result3 = Number("8") + 2;
console.log('\n3. Number("8") + 2');
console.log("Результат:", result3);
console.log("Тип результата:", typeof result3);

const result4 = "12" > "3";
console.log('\n4. "12" > "3"');
console.log("Результат:", result4);
console.log("Тип результата:", typeof result4);

const result5 = 12 === "12";
console.log('\n5. 12 === "12"');
console.log("Результат:", result5);
console.log("Тип результата:", typeof result5);

const result6 = Number("");
console.log('\n6. Number("")');
console.log("Результат:", result6);
console.log("Тип результата:", typeof result6);

const result7 = Number("text");
console.log('\n7. Number("text")');
console.log("Результат:", result7);
console.log("Тип результата:", typeof result7);

const result8 = Boolean("false");
console.log('\n8. Boolean("false")');
console.log("Результат:", result8);
console.log("Тип результата:", typeof result8);

const result9 = typeof null;
console.log("\n9. typeof null");
console.log("Результат выражения typeof null:", result9);
console.log("Тип самого результата:", typeof result9);

const result10 = typeof NaN;
console.log("\n10. typeof NaN");
console.log("Результат выражения typeof NaN:", result10);
console.log("Тип самого результата:", typeof result10);
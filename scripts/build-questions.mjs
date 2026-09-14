import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const SOURCES = [
  "https://raw.githubusercontent.com/Patriasoul/patriasoul/main/question_banks_800.js",
  "https://raw.githubusercontent.com/Patriasoul/patriasoul/main/question_banks_1200.js",
  "https://raw.githubusercontent.com/Patriasoul/patriasoul/main/bastina.js",
];

const root = process.cwd();
const output = path.join(root, "src", "data", "questions.generated.js");

async function loadSource(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Ne mogu dohvatiti ${url}: ${response.status}`);
  return response.text();
}

const window = {};
const context = vm.createContext({ window, console });

for (const url of SOURCES) {
  const source = await loadSource(url);
  vm.runInContext(source, context, { filename: url });
}

const questions = [];
const extra = window.PATRIA_EXTRA_QUESTIONS || {};
for (const bank of Object.values(extra)) {
  if (Array.isArray(bank)) questions.push(...bank);
}
if (Array.isArray(window.PATRIA_BASTINA)) questions.push(...window.PATRIA_BASTINA);
if (Array.isArray(window.PATRIA_QUESTIONS)) questions.push(...window.PATRIA_QUESTIONS);

const unique = new Map();
for (const q of questions) {
  if (!q || q.id == null) continue;
  const normalized = {
    id: String(q.id),
    category: q.category || "opce",
    question: String(q.question || ""),
    answers: Array.isArray(q.answers) ? q.answers.map(String) : [],
    correctIndex: Number(q.correctIndex),
  };
  if (normalized.question && normalized.answers.length === 4 && normalized.correctIndex >= 0 && normalized.correctIndex <= 3) {
    unique.set(normalized.id, normalized);
  }
}

const finalQuestions = [...unique.values()];
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(
  output,
  `// GENERATED FILE. Source: Patr iaSoul/patriasoul canonical question banks.\n// Do not edit manually. Run the quiz build to regenerate.\nexport const QUESTIONS = ${JSON.stringify(finalQuestions, null, 2)};\n`,
  "utf8",
);

console.log(`PatriaSoul pitanja: ${finalQuestions.length}`);
console.log(`Generirano: ${output}`);

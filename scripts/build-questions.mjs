import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const MAIN_REPO = "https://raw.githubusercontent.com/Patriasoul/patriasoul/main";
const SOURCES = [
  `${MAIN_REPO}/question_banks_800.js`,
  `${MAIN_REPO}/question_banks_1200.js`,
  `${MAIN_REPO}/bastina.js`,
];

const root = process.cwd();
const dataDir = path.join(root, "src", "data");
const output = path.join(dataDir, "questions.generated.js");

async function loadSource(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Ne mogu dohvatiti ${url}: ${response.status}`);
  return response.text();
}

function prepareSource(source) {
  let prepared = source.replace(/([,{]\s*)([A-Za-z_$][\w$-]+)\s*:/g, "$1'$2':");
  prepared = prepared.replace(/\[f\[1\]\[0\],\.\.\.f\[1\]\[2\]\]/g, "Array.isArray(f[1][2]) ? [f[1][0], ...f[1][2]] : (Array.isArray(f[1][1]) ? f[1][1] : [])");
  return prepared;
}

const window = {};
const context = vm.createContext({ window, document: { write() {} }, console });

for (const url of SOURCES) {
  const source = prepareSource(await loadSource(url));
  vm.runInContext(source, context, { filename: url });
}

const questions = [];
const extra = window.PATRIA_EXTRA_QUESTIONS || {};
for (const bank of Object.values(extra)) if (Array.isArray(bank)) questions.push(...bank);
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
  if (
    normalized.question &&
    normalized.answers.length === 4 &&
    Number.isInteger(normalized.correctIndex) &&
    normalized.correctIndex >= 0 &&
    normalized.correctIndex <= 3
  ) {
    unique.set(normalized.id, normalized);
  }
}

await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(
  output,
  `// GENERATED FILE. Source: PatriaSoul/patriasoul canonical question banks.\n// Do not edit manually.\nexport const QUESTIONS = ${JSON.stringify([...unique.values()], null, 2)};\n`,
  "utf8",
);

console.log(`Generirano općih pitanja: ${unique.size}`);
console.log(`Generirano: ${output}`);

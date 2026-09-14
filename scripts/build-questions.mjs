import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const MAIN_REPO = "https://raw.githubusercontent.com/Patriasoul/patriasoul/main";
const SOURCES = [
  `${MAIN_REPO}/question_banks_800.js`,
  `${MAIN_REPO}/question_banks_1200.js`,
  `${MAIN_REPO}/bastina.js`,
];

const CITY_SOURCES = [
  `${MAIN_REPO}/patriasoul-city-questions-verified.js`,
  ...Array.from({ length: 126 }, (_, index) => index + 2)
    .filter((id) => id !== 33 && id !== 121)
    .map((id) => `${MAIN_REPO}/patriasoul-city-questions-verified-${id}.js`),
];

const root = process.cwd();
const dataDir = path.join(root, "src", "data");
const output = path.join(dataDir, "questions.generated.js");
const cityOutput = path.join(dataDir, "cityQuestions.generated.js");

async function loadSource(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Ne mogu dohvatiti ${url}: ${response.status}`);
  return response.text();
}

function prepareSource(source) {
  // Some legacy PatriaSoul city banks contain unquoted object keys with
  // hyphens (for example nova-gradiska). Quote those keys before evaluation.
  return source.replace(/([,{]\s*)([A-Za-z_$][\w$-]*-[\w$-]+)\s*:/g, "$1'$2':");
}

function createContext() {
  const window = {};
  const document = { write() {} };
  return { window, context: vm.createContext({ window, document, console }) };
}

const { window, context } = createContext();

for (const url of SOURCES) {
  const source = prepareSource(await loadSource(url));
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

const finalQuestions = [...unique.values()];

const cityQuestions = [];
for (const url of CITY_SOURCES) {
  const source = prepareSource(await loadSource(url));
  vm.runInContext(source, context, { filename: url });

  for (const [key, value] of Object.entries(window)) {
    if (!/^PatriaCityVerified\d*$/.test(key) || !value) continue;
    if (typeof value.all !== "function") continue;
    const rows = value.all();
    if (Array.isArray(rows)) cityQuestions.push(...rows);
  }
}

const uniqueCities = new Map();
for (const q of cityQuestions) {
  if (!q || q.id == null || !q.cityId) continue;
  const answers = Array.isArray(q.answers) ? q.answers.map(String) : [];
  const normalized = {
    id: String(q.id),
    cityId: String(q.cityId),
    citySource: q.citySource || "verified",
    category: q.category || "gradovi",
    question: String(q.question || ""),
    answers,
    correctIndex: Number(q.correctIndex),
    sourceUrl: q.sourceUrl || null,
  };
  if (
    normalized.question &&
    answers.length === 4 &&
    Number.isInteger(normalized.correctIndex) &&
    normalized.correctIndex >= 0 &&
    normalized.correctIndex <= 3
  ) {
    uniqueCities.set(normalized.id, normalized);
  }
}

const finalCityQuestions = [...uniqueCities.values()];

await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(
  output,
  `// GENERATED FILE. Source: PatriaSoul/patriasoul canonical question banks.\n// Do not edit manually. Run the quiz build to regenerate.\nexport const QUESTIONS = ${JSON.stringify(finalQuestions, null, 2)};\n`,
  "utf8",
);

await fs.writeFile(
  cityOutput,
  `// GENERATED FILE. Source: PatriaSoul/patriasoul verified Brani svoj grad layers.\n// Do not edit manually. Run the quiz build to regenerate.\nexport const CITY_QUESTIONS = ${JSON.stringify(finalCityQuestions, null, 2)};\n`,
  "utf8",
);

const cityCounts = {};
for (const q of finalCityQuestions) cityCounts[q.cityId] = (cityCounts[q.cityId] || 0) + 1;

console.log(`PatriaSoul pitanja: ${finalQuestions.length}`);
console.log(`Brani svoj grad pitanja: ${finalCityQuestions.length}`);
console.log(`Gradova s pitanjima: ${Object.keys(cityCounts).length}`);
console.log(`Generirano: ${output}`);
console.log(`Generirano: ${cityOutput}`);

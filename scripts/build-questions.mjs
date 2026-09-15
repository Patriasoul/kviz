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
  let prepared = source.replace(/([,{]\s*)([A-Za-z_$][\w$-]*-[\w$-]+)\s*:/g, "$1'$2':");

  prepared = prepared.replace(
    /\[f\[1\]\[0\],\.\.\.f\[1\]\[2\]\]/g,
    "Array.isArray(f[1][2]) ? [f[1][0], ...f[1][2]] : (Array.isArray(f[1][1]) ? f[1][1] : [])",
  );

  return prepared;
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
const skippedCitySources = [];
for (const url of CITY_SOURCES) {
  try {
    const source = prepareSource(await loadSource(url));
    const beforeKeys = new Set(Object.keys(window));
    vm.runInContext(source, context, { filename: url });

    const cityMatch = source.match(/(?:const|let|var)\s+city\s*=\s*['"]([^'"]+)['"]/);
    const sourceCity = cityMatch?.[1] || null;
    const layerKeys = Object.keys(window).filter(
      (key) => /^PatriaCityVerified\d*$/.test(key) && (!beforeKeys.has(key) || key === "PatriaCityVerified"),
    );

    if (!layerKeys.length) {
      throw new Error("City layer nije registrirao PatriaCityVerified objekt.");
    }

    for (const key of layerKeys) {
      const value = window[key];
      if (!value) continue;

      const rows = typeof value.all === "function"
        ? value.all()
        : typeof value.forCity === "function"
          ? value.forCity(sourceCity)
          : [];

      if (Array.isArray(rows)) cityQuestions.push(...rows);
    }
  } catch (error) {
    skippedCitySources.push({ url, message: error instanceof Error ? error.message : String(error) });
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
    uniqueCities.set(`${normalized.cityId}::${normalized.id}`, normalized);
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
console.log(`Gradova s tocno 75 pitanja: ${Object.values(cityCounts).filter((count) => count === 75).length}`);
console.log(`Gradova s manje od 75 pitanja: ${Object.values(cityCounts).filter((count) => count < 75).length}`);
console.log(`Gradova s vise od 75 pitanja: ${Object.values(cityCounts).filter((count) => count > 75).length}`);
if (skippedCitySources.length) {
  console.warn(`Preskoceno neispravnih city layera: ${skippedCitySources.length}`);
  for (const item of skippedCitySources) console.warn(`- ${item.url}: ${item.message}`);
}
console.log(`Generirano: ${output}`);
console.log(`Generirano: ${cityOutput}`);

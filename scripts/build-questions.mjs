import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const MAIN_REPO = "https://raw.githubusercontent.com/Patriasoul/patriasoul/main";
const SOURCES = [
  `${MAIN_REPO}/question_banks_800.js`,
  `${MAIN_REPO}/question_banks_1200.js`,
  `${MAIN_REPO}/bastina.js`,
];
const CITY_REGISTRY_SOURCE = `${MAIN_REPO}/gradovi.js`;
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
const auditOutput = path.join(dataDir, "cityQuestions.audit.json");
const TARGET_PER_CITY = 75;
const TARGET_CITIES = 127;
const TARGET_TOTAL = TARGET_CITIES * TARGET_PER_CITY;

async function loadSource(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Ne mogu dohvatiti ${url}: ${response.status}`);
  return response.text();
}

function prepareSource(source) {
  let prepared = source.replace(/([,{]\s*)([A-Za-z_$][\w$-]*-[\w$-]+)\s*:/g, "$1'$2':");
  prepared = prepared.replace(/\[f\[1\]\[0\],\.\.\.f\[1\]\[2\]\]/g, "Array.isArray(f[1][2]) ? [f[1][0], ...f[1][2]] : (Array.isArray(f[1][1]) ? f[1][1] : [])");
  return prepared;
}

function createContext() {
  const window = {};
  const document = { write() {} };
  const context = vm.createContext({ window, document, console });
  return { window, context };
}

const { window: mainWindow, context: mainContext } = createContext();
for (const url of SOURCES) {
  const source = prepareSource(await loadSource(url));
  vm.runInContext(source, mainContext, { filename: url });
}

const questions = [];
const extra = mainWindow.PATRIA_EXTRA_QUESTIONS || {};
for (const bank of Object.values(extra)) if (Array.isArray(bank)) questions.push(...bank);
if (Array.isArray(mainWindow.PATRIA_BASTINA)) questions.push(...mainWindow.PATRIA_BASTINA);
if (Array.isArray(mainWindow.PATRIA_QUESTIONS)) questions.push(...mainWindow.PATRIA_QUESTIONS);

const unique = new Map();
for (const q of questions) {
  if (!q || q.id == null) continue;
  const normalized = {
    id: String(q.id), category: q.category || "opce", question: String(q.question || ""),
    answers: Array.isArray(q.answers) ? q.answers.map(String) : [], correctIndex: Number(q.correctIndex),
  };
  if (normalized.question && normalized.answers.length === 4 && Number.isInteger(normalized.correctIndex) && normalized.correctIndex >= 0 && normalized.correctIndex <= 3) unique.set(normalized.id, normalized);
}
const finalQuestions = [...unique.values()];

const registrySource = prepareSource(await loadSource(CITY_REGISTRY_SOURCE));
vm.runInContext(registrySource, mainContext, { filename: CITY_REGISTRY_SOURCE });
const cityRegistry = Array.isArray(mainWindow.PATRIA_CITY_DATA) ? mainWindow.PATRIA_CITY_DATA : [];

const cityCandidates = new Map();
const skippedCitySources = [];

for (const url of CITY_SOURCES) {
  try {
    const { window, context } = createContext();
    const source = prepareSource(await loadSource(url));
    vm.runInContext(source, context, { filename: url });
    const layers = new Map(Object.entries(window).filter(([key]) => /^PatriaCityVerified\d*$/.test(key)));
    for (const [layerKey, layer] of layers) {
      if (!layer || typeof layer.forCity !== "function") continue;
      for (const city of cityRegistry) {
        const rowsById = new Map();
        for (const lookup of [city.slug, city.name]) {
          let rows = [];
          try { rows = layer.forCity(lookup); } catch (_) { rows = []; }
          if (!Array.isArray(rows)) continue;
          for (const row of rows) {
            if (!row || row.cityId !== city.slug || row.citySource !== "verified" || row.id == null) continue;
            rowsById.set(String(row.id), row);
          }
        }
        const rows = [...rowsById.values()];
        if (!rows.length) continue;
        if (!cityCandidates.has(city.slug)) cityCandidates.set(city.slug, []);
        cityCandidates.get(city.slug).push({ url, layerKey, rows });
      }
    }
  } catch (error) {
    skippedCitySources.push({ url, message: error instanceof Error ? error.message : String(error) });
  }
}

function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("hr-HR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function questionSignature(row) {
  return JSON.stringify([
    normalizeText(row.question),
    Array.isArray(row.answers) ? row.answers.map(normalizeText) : [],
    Number(row.correctIndex),
  ]);
}

function questionTextSignature(row) {
  return normalizeText(row.question);
}

function assembleCity(city, candidates) {
  const byId = new Map();
  const byText = new Map();
  const provenance = new Map();

  // First pass: every verified question is retained. Same ID is one question;
  // same question text with equivalent answers is also one question.
  for (const candidate of candidates) {
    for (const row of candidate.rows) {
      const id = String(row.id);
      const signature = questionSignature(row);
      const textSignature = questionTextSignature(row);
      const existingById = byId.get(id);
      if (existingById) {
        provenance.get(id)?.push(candidate.layerKey);
        continue;
      }
      const duplicateId = [...byId.entries()].find(([, existing]) => questionSignature(existing) === signature)?.[0];
      if (duplicateId) {
        provenance.get(duplicateId)?.push(candidate.layerKey);
        continue;
      }
      // A question with the same wording but different answer data is NOT
      // silently discarded. It remains a distinct candidate for manual audit.
      byId.set(id, row);
      provenance.set(id, [candidate.layerKey]);
      if (!byText.has(textSignature)) byText.set(textSignature, []);
      byText.get(textSignature).push(id);
    }
  }

  const all = [...byId.values()];
  const exactDuplicates = all.filter((row) => (provenance.get(String(row.id)) || []).length > 1);
  const textCollisions = [...byText.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([text, ids]) => ({ text, ids, questions: ids.map((id) => byId.get(id)) }));

  // If the assembled verified pool is already exactly 75, use it untouched.
  // If it is below/above 75, fail with a complete audit instead of silently
  // choosing arbitrary questions. This protects the source bank from loss.
  return {
    city: { slug: city.slug, name: city.name },
    count: all.length,
    questions: all,
    exactDuplicates: exactDuplicates.map((row) => ({ id: row.id, layers: provenance.get(String(row.id)) })),
    textCollisions,
    layers: candidates.map((candidate) => ({ layer: candidate.layerKey, count: candidate.rows.length, url: candidate.url })),
  };
}

const audit = [];
for (const city of cityRegistry) {
  audit.push(assembleCity(city, cityCandidates.get(city.slug) || []));
}

const completeAudits = audit.filter((entry) => entry.count === TARGET_PER_CITY);
const incompleteAudits = audit.filter((entry) => entry.count < TARGET_PER_CITY);
const oversizedAudits = audit.filter((entry) => entry.count > TARGET_PER_CITY);

console.log(`PatriaSoul pitanja: ${finalQuestions.length}`);
console.log(`Gradova u registru: ${cityRegistry.length}`);
console.log(`Gradova s tocno 75 nakon deduplikacije: ${completeAudits.length}`);
console.log(`Gradova ispod 75: ${incompleteAudits.length}`);
console.log(`Gradova iznad 75: ${oversizedAudits.length}`);
if (incompleteAudits.length) console.log(`ISPOD: ${incompleteAudits.map((x) => `${x.city.slug}=${x.count}`).join(", ")}`);
if (oversizedAudits.length) console.log(`IZNAD: ${oversizedAudits.map((x) => `${x.city.slug}=${x.count}`).join(", ")}`);

for (const entry of audit.filter((x) => x.city.slug === "omis" || x.city.slug === "sinj" || x.city.slug === "sibenik" || x.city.slug === "trilj")) {
  console.log(`AUDIT ${entry.city.name}: ${entry.count}/75; slojevi=${entry.layers.map((x) => `${x.layer}:${x.count}`).join(",")}; istiID=${entry.exactDuplicates.length}; tekstualniSukobi=${entry.textCollisions.length}`);
}

await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(auditOutput, JSON.stringify({
  targetCities: TARGET_CITIES,
  targetPerCity: TARGET_PER_CITY,
  targetTotal: TARGET_TOTAL,
  generatedAt: new Date().toISOString(),
  skippedCitySources,
  cities: audit,
}, null, 2), "utf8");

// Never generate a partial city bank. The build stops until every city has an
// auditable 75-question canonical set. Existing source questions are untouched.
if (cityRegistry.length !== TARGET_CITIES || skippedCitySources.length || completeAudits.length !== TARGET_CITIES || incompleteAudits.length || oversizedAudits.length) {
  throw new Error(`City audit nije zavrsen: ${completeAudits.length}/${TARGET_CITIES} gradova ima tocno 75 nakon deduplikacije. Detaljan audit: ${auditOutput}`);
}

const finalCityQuestions = audit.flatMap((entry) => entry.questions);
if (finalCityQuestions.length !== TARGET_TOTAL) {
  throw new Error(`City audit nije zavrsen: ocekivano ${TARGET_TOTAL}, dobiveno ${finalCityQuestions.length}.`);
}

await fs.writeFile(output, `// GENERATED FILE. Source: PatriaSoul/patriasoul canonical question banks.\n// Do not edit manually. Run the quiz build to regenerate.\nexport const QUESTIONS = ${JSON.stringify(finalQuestions, null, 2)};\n`, "utf8");
await fs.writeFile(cityOutput, `// GENERATED FILE. Source: PatriaSoul/patriasoul verified Brani svoj grad layers.\n// Do not edit manually. Run the quiz build to regenerate.\nexport const CITY_QUESTIONS = ${JSON.stringify(finalCityQuestions, null, 2)};\n`, "utf8");
console.log(`Generirano: ${output}`);
console.log(`Generirano: ${cityOutput}`);
console.log(`Generiran audit: ${auditOutput}`);

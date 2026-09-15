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
const registrySlugs = new Set(cityRegistry.map((city) => String(city.slug)));

// Load every verified source independently. Some historical layers implement
// forCity() with exact lowercase slugs while others normalize display names.
// Query both canonical slug and display name, then deduplicate within each layer.
const cityCandidates = new Map();
const skippedCitySources = [];

for (const url of CITY_SOURCES) {
  try {
    const { window, context } = createContext();
    const source = prepareSource(await loadSource(url));
    vm.runInContext(source, context, { filename: url });

    const layerEntries = Object.entries(window).filter(([key]) => /^PatriaCityVerified\d*$/.test(key));
    const layers = new Map(layerEntries);

    for (const [layerKey, layer] of layers) {
      if (!layer || typeof layer.forCity !== "function") continue;
      for (const city of cityRegistry) {
        const lookups = [city.slug, city.name];
        const rowsById = new Map();
        for (const lookup of lookups) {
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
        const key = city.slug;
        if (!cityCandidates.has(key)) cityCandidates.set(key, []);
        cityCandidates.get(key).push({ url, layerKey, rows });
      }
    }
  } catch (error) {
    skippedCitySources.push({ url, message: error instanceof Error ? error.message : String(error) });
  }
}

function questionSignature(row) {
  return JSON.stringify([
    String(row.question || "").trim().toLocaleLowerCase("hr-HR"),
    Array.isArray(row.answers) ? row.answers.map((answer) => String(answer).trim()) : [],
    Number(row.correctIndex),
  ]);
}

function candidateSignature(candidate) {
  return JSON.stringify(candidate.rows.map(questionSignature).sort());
}

const finalCityQuestions = [];
const selectedCityLayers = new Map();
const missingCanonicalCities = [];
const ambiguousCanonicalCities = [];

for (const city of cityRegistry) {
  const candidates = cityCandidates.get(city.slug) || [];
  const completeCandidates = candidates.filter((candidate) => candidate.rows.length === 75);
  const completeGroups = new Map();
  for (const candidate of completeCandidates) {
    const signature = candidateSignature(candidate);
    if (!completeGroups.has(signature)) completeGroups.set(signature, []);
    completeGroups.get(signature).push(candidate);
  }

  let rows = [];
  let selected = [];

  if (completeGroups.size === 1) {
    // One canonical 75-question set may appear in more than one file. Keep the
    // first copy; identical question content does not need to be duplicated.
    selected = [...completeGroups.values()][0];
    rows = selected[0].rows;
  } else if (completeGroups.size > 1) {
    ambiguousCanonicalCities.push(`${city.slug}=${completeGroups.size}`);
    continue;
  } else {
    // No complete layer exists for this city. Only then combine all verified
    // incremental rows and require the result to resolve to exactly 75.
    const uniqueRows = new Map();
    for (const candidate of candidates) {
      for (const row of candidate.rows) {
        const id = String(row.id);
        if (!uniqueRows.has(id)) uniqueRows.set(id, row);
      }
    }
    rows = [...uniqueRows.values()];
    selected = candidates;
  }

  if (rows.length !== 75) {
    missingCanonicalCities.push(`${city.slug}=${rows.length}${candidates.length ? `/${candidates.map((candidate) => candidate.rows.length).join("/")}` : ""}`);
    continue;
  }

  selectedCityLayers.set(city.slug, selected.map((candidate) => candidate.layerKey).join(","));
  finalCityQuestions.push(...rows);
}

const cityCounts = {};
for (const q of finalCityQuestions) cityCounts[q.cityId] = (cityCounts[q.cityId] || 0) + 1;
const completeCities = Object.entries(cityCounts).filter(([, count]) => count === 75);
const incompleteCities = Object.entries(cityCounts).filter(([, count]) => count < 75);
const oversizedCities = Object.entries(cityCounts).filter(([, count]) => count > 75);
const nonCanonicalCities = Object.keys(cityCounts).filter((slug) => !registrySlugs.has(slug));

console.log(`PatriaSoul pitanja: ${finalQuestions.length}`);
console.log(`Brani svoj grad pitanja: ${finalCityQuestions.length}`);
console.log(`Gradova u registru: ${cityRegistry.length}`);
console.log(`Gradova s pitanjima: ${Object.keys(cityCounts).length}`);
console.log(`Gradova s tocno 75 pitanja: ${completeCities.length}`);
console.log(`Gradova s manje od 75 pitanja: ${incompleteCities.length}`);
console.log(`Gradova s vise od 75 pitanja: ${oversizedCities.length}`);
if (missingCanonicalCities.length) console.log(`NEMA KANONSKOG SLOJA: ${missingCanonicalCities.join(", ")}`);
if (ambiguousCanonicalCities.length) console.log(`DVIJE RAZLICITE KOMPLETNE BANKE: ${ambiguousCanonicalCities.join(", ")}`);
if (nonCanonicalCities.length) console.log(`NEKANONSKI GRADOVI: ${nonCanonicalCities.join(", ")}`);
if (incompleteCities.length) console.log(`NEDOSTAJU: ${incompleteCities.map(([city,count]) => `${city}=${count}`).join(", ")}`);
if (oversizedCities.length) console.log(`VIŠAK: ${oversizedCities.map(([city,count]) => `${city}=${count}`).join(", ")}`);

if (skippedCitySources.length) {
  console.warn(`Preskoceno neispravnih city layera: ${skippedCitySources.length}`);
  for (const item of skippedCitySources) console.warn(`- ${item.url}: ${item.message}`);
}

if (cityRegistry.length !== 127 || skippedCitySources.length || missingCanonicalCities.length || ambiguousCanonicalCities.length || nonCanonicalCities.length || Object.keys(cityCounts).length !== 127 || finalCityQuestions.length !== 9525 || completeCities.length !== 127 || incompleteCities.length !== 0 || oversizedCities.length !== 0) {
  throw new Error(`City audit nije prosao: ocekivano 127 gradova i 9525 pitanja (75 po gradu), dobiveno ${Object.keys(cityCounts).length} gradova i ${finalCityQuestions.length} pitanja.`);
}

await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(output, `// GENERATED FILE. Source: PatriaSoul/patriasoul canonical question banks.\n// Do not edit manually. Run the quiz build to regenerate.\nexport const QUESTIONS = ${JSON.stringify(finalQuestions, null, 2)};\n`, "utf8");
await fs.writeFile(cityOutput, `// GENERATED FILE. Source: PatriaSoul/patriasoul verified Brani svoj grad layers.\n// Do not edit manually. Run the quiz build to regenerate.\nexport const CITY_QUESTIONS = ${JSON.stringify(finalCityQuestions, null, 2)};\n`, "utf8");
console.log(`Generirano: ${output}`);
console.log(`Generirano: ${cityOutput}`);

import vm from "node:vm";
import { createClient } from "@supabase/supabase-js";

const MAIN_REPO = "https://raw.githubusercontent.com/Patriasoul/patriasoul/main";
const registryUrl = `${MAIN_REPO}/gradovi.js`;
const citySources = [
  `${MAIN_REPO}/patriasoul-city-questions-verified.js`,
  ...Array.from({ length: 126 }, (_, index) => index + 2)
    .filter((id) => id !== 33 && id !== 121)
    .map((id) => `${MAIN_REPO}/patriasoul-city-questions-verified-${id}.js`),
];

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) throw new Error("Postavi VITE_SUPABASE_URL (ili SUPABASE_URL) i SUPABASE_SERVICE_ROLE_KEY prije importa.");

const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

async function load(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function prepare(source) {
  return source
    .replace(/([,{]\s*)([A-Za-z_$][\w$-]+)\s*:/g, "$1'$2':")
    .replace(/\[f\[1\]\[0\],\.\.\.f\[1\]\[2\]\]/g, "Array.isArray(f[1][2]) ? [f[1][0], ...f[1][2]] : (Array.isArray(f[1][1]) ? f[1][1] : [])");
}

function context() {
  const window = {};
  return { window, context: vm.createContext({ window, document: { write() {} }, console }) };
}

const registryContext = context();
vm.runInContext(prepare(await load(registryUrl)), registryContext.context, { filename: registryUrl });
const cities = Array.isArray(registryContext.window.PATRIA_CITY_DATA) ? registryContext.window.PATRIA_CITY_DATA : [];
if (!cities.length) throw new Error("gradovi.js nije dao PATRIA_CITY_DATA.");

const cityRows = cities.map((city) => ({ slug: String(city.slug), name: String(city.name), county: String(city.county || ""), active: true }));

const { data: dbCities, error: dbCityError } = await supabase.from("cities").select("id,slug,name");
if (dbCityError) throw dbCityError;

const cityIdBySlug = new Map((dbCities || []).map((city) => [String(city.slug), city.id]));
const missingCities = cityRows.filter((city) => !cityIdBySlug.has(city.slug));
if (missingCities.length) throw new Error(`Nedostaju gradovi u public.cities: ${missingCities.map((city) => city.slug).join(", ")}`);

// Collect every verified question first. The source files are layered over time;
// the latest layer is the final 75-question bank for a city. Keeping the last
// 75 encountered prevents older/test layers from being imported alongside it.
const questionMap = new Map();
let duplicateQuestionRows = 0;
let sourceFailures = 0;

for (const url of citySources) {
  try {
    const { window, context: sourceContext } = context();
    vm.runInContext(prepare(await load(url)), sourceContext, { filename: url });
    const layers = Object.entries(window).filter(([key]) => /^PatriaCityVerified\d*$/.test(key));

    for (const [, layer] of layers) {
      if (!layer || typeof layer.forCity !== "function") continue;
      for (const city of cities) {
        if (!cityIdBySlug.has(city.slug)) continue;
        for (const lookup of [city.slug, city.name]) {
          let rows = [];
          try { rows = layer.forCity(lookup); } catch { rows = []; }
          if (!Array.isArray(rows)) continue;

          for (const row of rows) {
            if (!row || row.cityId !== city.slug || row.citySource !== "verified" || row.id == null) continue;
            if (!Array.isArray(row.answers) || row.answers.length !== 4) continue;
            const correctIndex = Number(row.correctIndex);
            if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) continue;
            const question = String(row.question || "").trim();
            if (!question) continue;

            const key = `${city.slug}:${question}`;
            if (questionMap.has(key)) {
              duplicateQuestionRows += 1;
              continue;
            }

            questionMap.set(key, {
              city_slug: city.slug,
              city_id: cityIdBySlug.get(city.slug),
              question,
              answer_a: String(row.answers[0]),
              answer_b: String(row.answers[1]),
              answer_c: String(row.answers[2]),
              answer_d: String(row.answers[3]),
              correct_index: correctIndex,
              category: row.category || "gradovi",
              source_url: row.sourceUrl || null,
              active: true,
            });
          }
        }
      }
    }
  } catch (error) {
    sourceFailures += 1;
    console.warn(`Preskačem izvor: ${url} — ${error.message}`);
  }
}

const grouped = new Map();
for (const row of questionMap.values()) {
  if (!grouped.has(row.city_slug)) grouped.set(row.city_slug, []);
  grouped.get(row.city_slug).push(row);
}

const rows = [];
const underfilledCities = [];
for (const city of cityRows) {
  const cityRowsAll = grouped.get(city.slug) || [];
  const finalRows = cityRowsAll.slice(-75);
  if (finalRows.length !== 75) underfilledCities.push(`${city.slug}:${finalRows.length}`);
  rows.push(...finalRows);
}

if (!rows.length) throw new Error("Nije pronađeno nijedno verificirano gradsko pitanje.");

for (let offset = 0; offset < rows.length; offset += 500) {
  const chunk = rows.slice(offset, offset + 500).map(({ city_slug, ...row }) => row);
  const { error } = await supabase.from("city_questions").upsert(chunk, { onConflict: "city_id,question" });
  if (error) throw error;
  console.log(`Uvezeno ${Math.min(offset + chunk.length, rows.length)} / ${rows.length} pitanja`);
}

console.log(`Gradova u registru: ${cityRows.length}`);
console.log(`Gradova u Supabaseu: ${dbCities.length}`);
console.log(`Pitanja nakon odabira zadnjih 75 po gradu: ${rows.length}`);
console.log(`Duplikata preskočeno: ${duplicateQuestionRows}`);
console.log(`Neuspjelih izvora: ${sourceFailures}`);
console.log(`Gradovi ispod 75: ${underfilledCities.length ? underfilledCities.join(", ") : "nijedan"}`);
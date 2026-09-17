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

if (!supabaseUrl || !serviceKey) {
  throw new Error("Postavi VITE_SUPABASE_URL (ili SUPABASE_URL) i SUPABASE_SERVICE_ROLE_KEY prije importa.");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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
const cities = Array.isArray(registryContext.window.PATRIA_CITY_DATA)
  ? registryContext.window.PATRIA_CITY_DATA
  : [];

if (!cities.length) throw new Error("gradovi.js nije dao PATRIA_CITY_DATA.");

const cityRows = cities.map((city) => ({
  slug: String(city.slug),
  name: String(city.name),
  active: true,
}));

const { error: cityError } = await supabase
  .from("cities")
  .upsert(cityRows, { onConflict: "slug" });

if (cityError) throw cityError;

const questionMap = new Map();
let sourceFailures = 0;

for (const url of citySources) {
  try {
    const { window, context: sourceContext } = context();
    vm.runInContext(prepare(await load(url)), sourceContext, { filename: url });
    const layers = Object.entries(window).filter(([key]) => /^PatriaCityVerified\d*$/.test(key));

    for (const [, layer] of layers) {
      if (!layer || typeof layer.forCity !== "function") continue;
      for (const city of cities) {
        for (const lookup of [city.slug, city.name]) {
          let rows = [];
          try { rows = layer.forCity(lookup); } catch { rows = []; }
          if (!Array.isArray(rows)) continue;

          for (const row of rows) {
            if (!row || row.cityId !== city.slug || row.citySource !== "verified" || row.id == null) continue;
            if (!Array.isArray(row.answers) || row.answers.length !== 4) continue;
            const sourceKey = String(row.id);
            questionMap.set(`${city.slug}:${sourceKey}`, {
              city_slug: city.slug,
              source_key: sourceKey,
              question: String(row.question || ""),
              answers: row.answers.map(String),
              correct_index: Number(row.correctIndex),
              category: row.category || "gradovi",
              source_url: row.sourceUrl || null,
              source_type: "verified",
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

const rows = [...questionMap.values()].filter((row) =>
  row.question &&
  Number.isInteger(row.correct_index) &&
  row.correct_index >= 0 &&
  row.correct_index <= 3,
);

for (let offset = 0; offset < rows.length; offset += 500) {
  const chunk = rows.slice(offset, offset + 500);
  const { error } = await supabase
    .from("city_questions")
    .upsert(chunk, { onConflict: "city_slug,source_key" });
  if (error) throw error;
  console.log(`Uvezeno ${Math.min(offset + chunk.length, rows.length)} / ${rows.length} pitanja`);
}

console.log(`Gradova: ${cityRows.length}`);
console.log(`Pitanja: ${rows.length}`);
console.log(`Neuspjelih izvora: ${sourceFailures}`);

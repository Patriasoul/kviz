import vm from "node:vm";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Postavi SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY prije uvoza.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const SOURCES = [
  ["800", "https://raw.githubusercontent.com/Patriasoul/patriasoul/main/question_banks_800.js"],
  ["1200", "https://raw.githubusercontent.com/Patriasoul/patriasoul/main/question_banks_1200.js"],
];

const CATEGORY_MAP = {
  opce: "opce",
  "opće": "opce",
  povijest: "povijest",
  "domovinski-rat": "domovinski_rat",
  domovinski_rat: "domovinski_rat",
  geografija: "geografija",
  priroda: "priroda",
  kultura: "bastina",
  bastina: "bastina",
  glagoljica: "glagoljica",
  vjera: "vjera",
  sport: "sport",
  znanost: "znanost",
};

function normalizeCategory(value) {
  const key = String(value || "").trim().toLowerCase();
  return CATEGORY_MAP[key] || key.replaceAll("-", "_");
}

async function loadSource(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Ne mogu dohvatiti ${url}: HTTP ${response.status}`);
  return response.text();
}

function evaluateBank(source) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { timeout: 5000 });
  return sandbox.window.PATRIA_EXTRA_QUESTIONS || {};
}

function normalizeQuestions(bank, sourceName) {
  const rows = [];
  for (const [rawCategory, questions] of Object.entries(bank)) {
    const category = normalizeCategory(rawCategory);
    for (const q of questions || []) {
      if (!q?.question || !Array.isArray(q.answers) || q.answers.length !== 4) continue;
      const correctIndex = Number(q.correctIndex);
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) continue;
      rows.push({
        source_key: `${sourceName}:${q.id}`,
        category,
        question: String(q.question),
        answer_a: String(q.answers[0]),
        answer_b: String(q.answers[1]),
        answer_c: String(q.answers[2]),
        answer_d: String(q.answers[3]),
        correct_index: correctIndex,
        source_url: "https://github.com/Patriasoul/patriasoul/blob/main/" + (sourceName === "800" ? "question_banks_800.js" : "question_banks_1200.js"),
        active: true,
      });
    }
  }
  return rows;
}

async function main() {
  let all = [];
  for (const [name, url] of SOURCES) {
    const source = await loadSource(url);
    const bank = evaluateBank(source);
    const rows = normalizeQuestions(bank, name);
    console.log(`${name}: ${rows.length} pitanja`);
    all.push(...rows);
  }

  const unique = [...new Map(all.map((row) => [row.source_key, row])).values()];
  console.log(`Ukupno za uvoz: ${unique.length}`);

  for (let i = 0; i < unique.length; i += 500) {
    const chunk = unique.slice(i, i + 500);
    const { error } = await supabase.from("quiz_questions").upsert(chunk, { onConflict: "source_key" });
    if (error) throw error;
    console.log(`Uvezeno: ${Math.min(i + chunk.length, unique.length)}/${unique.length}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

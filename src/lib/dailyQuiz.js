import { fetchMainQuizQuestions } from "./mainQuiz";

const DAILY_TIME_ZONE = "Europe/Zagreb";

function getDailyKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function hash(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function fetchDailyQuizQuestions(date = new Date()) {
  const dailyKey = getDailyKey(date);
  const all = await fetchMainQuizQuestions();

  if (all.length < 10) {
    throw new Error("Za Dnevni kviz trenutno nema dovoljno aktivnih pitanja.");
  }

  const byCategory = new Map();
  for (const question of all) {
    const list = byCategory.get(question.category) ?? [];
    list.push(question);
    byCategory.set(question.category, list);
  }

  const selected = [];
  const usedIds = new Set();

  // Jedno pitanje iz svake od 10 glavnih kategorija, deterministički za taj dan.
  for (const [category, questions] of byCategory) {
    if (selected.length >= 10) break;
    const candidates = [...questions].sort((a, b) => hash(`${dailyKey}:${a.id}`) - hash(`${dailyKey}:${b.id}`));
    const question = candidates.find((item) => !usedIds.has(item.id));
    if (question) {
      selected.push(question);
      usedIds.add(question.id);
    }
  }

  // Ako neka kategorija nema aktivno pitanje, popuni ostatak iz cijele baze.
  if (selected.length < 10) {
    const remaining = all
      .filter((question) => !usedIds.has(question.id))
      .sort((a, b) => hash(`${dailyKey}:fill:${a.id}`) - hash(`${dailyKey}:fill:${b.id}`));

    selected.push(...remaining.slice(0, 10 - selected.length));
  }

  if (selected.length < 10) {
    throw new Error("Dnevni kviz trenutno nema 10 dostupnih pitanja.");
  }

  return selected
    .sort((a, b) => hash(`${dailyKey}:order:${a.id}`) - hash(`${dailyKey}:order:${b.id}`))
    .slice(0, 10);
}

export function getDailyQuizKey(date = new Date()) {
  return getDailyKey(date);
}

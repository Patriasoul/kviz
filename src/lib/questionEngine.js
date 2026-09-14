const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function hashSeed(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function normalizeQuestion(question) {
  const answers = Array.isArray(question?.answers) ? question.answers : [];
  return {
    ...question,
    id: String(question?.id ?? ""),
    question: String(question?.question ?? ""),
    answers,
    correctIndex: Number(question?.correctIndex),
    category: question?.category || "opce",
  };
}

export function isValidQuestion(question) {
  const q = normalizeQuestion(question);
  return Boolean(
    q.id &&
      q.question &&
      q.answers.length === 4 &&
      q.answers.every((answer) => typeof answer === "string" && answer.trim()) &&
      Number.isInteger(q.correctIndex) &&
      q.correctIndex >= 0 &&
      q.correctIndex <= 3,
  );
}

export function cleanQuestionBank(questions = []) {
  const unique = new Map();
  for (const item of questions) {
    const question = normalizeQuestion(item);
    if (isValidQuestion(question) && !unique.has(question.id)) {
      unique.set(question.id, question);
    }
  }
  return [...unique.values()];
}

export function prepareQuestion(question, random = Math.random) {
  const normalized = normalizeQuestion(question);
  const indexedAnswers = normalized.answers.map((text, index) => ({ text, index }));
  const options = shuffle(indexedAnswers, random);

  return {
    ...normalized,
    options,
    preparedCorrectIndex: options.findIndex(
      (option) => option.index === normalized.correctIndex,
    ),
  };
}

export function pickQuestions(questions, count = 15, { category = null, seed = null } = {}) {
  const bank = cleanQuestionBank(questions);
  const filtered = category ? bank.filter((q) => q.category === category) : bank;
  const pool = filtered.length ? filtered : bank;
  const random = seed === null ? Math.random : seededRandom(seed);
  const selected = shuffle(pool, random).slice(0, clamp(Number(count) || 0, 0, pool.length));

  return selected.map((question) => prepareQuestion(question, random));
}

export function getDailyKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function pickDailyQuestions(questions, count = 10, date = new Date()) {
  return pickQuestions(questions, count, { seed: `daily:${getDailyKey(date)}` });
}

export function pickCityQuestions(questions, citySlug, count = 75) {
  const bank = cleanQuestionBank(questions).filter(
    (q) => q.citySlug === citySlug || q.cityId === citySlug || q.city_id === citySlug,
  );

  return pickQuestions(bank, count, { seed: `city:${citySlug}` });
}

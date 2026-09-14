import { CITY_QUESTIONS } from "../data/cityQuestions.generated";
import { cleanQuestionBank, pickQuestions } from "./questionEngine";

export function getCityQuestions(citySlug) {
  const slug = String(citySlug || "").trim().toLowerCase();
  return cleanQuestionBank(CITY_QUESTIONS).filter(
    (question) => String(question.cityId).toLowerCase() === slug,
  );
}

export function getCityQuestionCount(citySlug) {
  return getCityQuestions(citySlug).length;
}

export function pickCityQuestionsFromBank(citySlug, count = 75) {
  const pool = getCityQuestions(citySlug);
  return pickQuestions(pool, count, { seed: `city:${citySlug}` });
}

export function getCityList() {
  const cities = new Map();
  for (const question of cleanQuestionBank(CITY_QUESTIONS)) {
    if (!cities.has(question.cityId)) {
      cities.set(question.cityId, {
        slug: question.cityId,
        questionCount: 0,
      });
    }
    cities.get(question.cityId).questionCount += 1;
  }
  return [...cities.values()].sort((a, b) => a.slug.localeCompare(b.slug, "hr"));
}

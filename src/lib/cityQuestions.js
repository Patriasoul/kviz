import { supabase } from "../supabase";

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

function normalizeQuestion(row) {
  return {
    id: row.id,
    cityId: row.city_slug,
    citySlug: row.city_slug,
    cityName: row.cities?.name ?? row.city_slug,
    citySource: row.source_type,
    category: row.category,
    question: row.question,
    answers: Array.isArray(row.answers) ? row.answers.map(String) : [],
    correctIndex: Number(row.correct_index),
    sourceUrl: row.source_url ?? "",
  };
}

export async function fetchCityList() {
  if (!supabase) return { data: [], error: new Error("Supabase nije konfiguriran.") };

  const { data, error } = await supabase
    .from("cities")
    .select("slug, name")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) return { data: [], error };
  return { data: data ?? [], error: null };
}

export async function fetchCityQuestions(citySlug) {
  if (!supabase) return { data: [], error: new Error("Supabase nije konfiguriran.") };

  const { data, error } = await supabase
    .from("city_questions")
    .select("id, city_slug, question, answers, correct_index, category, source_url, source_type, cities(name)")
    .eq("city_slug", citySlug)
    .eq("active", true);

  if (error) return { data: [], error };
  return { data: (data ?? []).map(normalizeQuestion), error: null };
}

export function pickCityQuestions(questions, count = 10) {
  return shuffle(questions).slice(0, Math.min(count, questions.length));
}

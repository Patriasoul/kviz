import { supabase } from "./supabase";

export async function fetchCities() {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data, error } = await supabase
    .from("cities")
    .select("id,name,slug,county,flag_url,active")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchCityQuestions(cityId) {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data, error } = await supabase
    .from("city_questions_public")
    .select("id,city_id,question,answer_a,answer_b,answer_c,answer_d,category,source_url")
    .eq("city_id", cityId)
    .eq("active", true)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    question: row.question,
    answers: [row.answer_a, row.answer_b, row.answer_c, row.answer_d],
    sourceUrl: row.source_url,
  }));
}

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

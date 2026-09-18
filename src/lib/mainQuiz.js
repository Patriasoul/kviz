import { supabase } from "./supabase";

const CATEGORY_ALIASES = {
  "domovinski-rat": "domovinski_rat",
};

function resolveCategory(category) {
  return CATEGORY_ALIASES[category] ?? category;
}

export async function fetchMainQuizQuestions(category = null) {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");

  let query = supabase
    .from("quiz_questions_public")
    .select("id,category,question,answer_a,answer_b,answer_c,answer_d,source_url")
    .eq("active", true);

  if (category) query = query.eq("category", resolveCategory(category));

  const { data, error } = await query.order("created_at");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    question: row.question,
    answers: [row.answer_a, row.answer_b, row.answer_c, row.answer_d],
    sourceUrl: row.source_url,
  }));
}

export async function getMainQuizCount(category = null) {
  if (!supabase) return 0;

  let query = supabase
    .from("quiz_questions")
    .select("id", { count: "exact", head: true })
    .eq("active", true);

  if (category) query = query.eq("category", resolveCategory(category));

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

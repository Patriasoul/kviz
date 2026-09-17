import { supabase } from "./supabase";

export async function fetchMainQuizQuestions(category = null) {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");

  let query = supabase
    .from("quiz_questions")
    .select("id,category,question,answer_a,answer_b,answer_c,answer_d,correct_index,source_url")
    .eq("active", true);

  if (category) query = query.eq("category", category);

  const { data, error } = await query.order("created_at");
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    category: row.category,
    question: row.question,
    answers: [row.answer_a, row.answer_b, row.answer_c, row.answer_d],
    correctIndex: row.correct_index,
    sourceUrl: row.source_url,
  }));
}

export async function getMainQuizCount(category = null) {
  if (!supabase) return 0;
  let query = supabase.from("quiz_questions").select("id", { count: "exact", head: true }).eq("active", true);
  if (category) query = query.eq("category", category);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

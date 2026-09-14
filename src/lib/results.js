import { supabase } from "../supabase";

export async function saveQuizResult({
  quizType,
  category = null,
  citySlug = null,
  score,
  total,
  timeSeconds = null,
}) {
  if (!supabase) return { data: null, error: new Error("Supabase nije konfiguriran.") };

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { data: null, error: sessionError };
  if (!sessionData.session?.user) {
    return { data: null, error: new Error("Za spremanje rezultata potrebna je prijava.") };
  }

  const { data, error } = await supabase.rpc("record_quiz_result", {
    p_quiz_type: quizType,
    p_category: category,
    p_city_slug: citySlug,
    p_score: score,
    p_total: total,
    p_time_seconds: timeSeconds,
  });

  return { data, error };
}

export async function fetchLeaderboard(quizType = null, limit = 50) {
  if (!supabase) return { data: [], error: new Error("Supabase nije konfiguriran.") };

  let query = supabase
    .from("quiz_leaderboard")
    .select("*")
    .order("percentage", { ascending: false })
    .order("time_seconds", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (quizType) query = query.eq("quiz_type", quizType);

  const { data, error } = await query;
  return { data: data ?? [], error };
}

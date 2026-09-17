import { supabase } from "./supabase";

export async function saveQuizResult({ quizType, cityId = null, score, total, timeSeconds = null }) {
  if (!supabase) return { saved: false, reason: "Supabase nije konfiguriran." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, reason: "Korisnik nije prijavljen." };

  const { error } = await supabase.from("quiz_results").insert({
    user_id: user.id,
    quiz_type: quizType,
    city_id: cityId,
    score,
    total,
    time_seconds: timeSeconds,
  });

  if (error) throw error;
  return { saved: true };
}

export async function getMyResults(limit = 20) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("quiz_results")
    .select("id,quiz_type,city_id,score,total,time_seconds,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

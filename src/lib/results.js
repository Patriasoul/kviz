import { supabase } from "./supabase";

export async function saveQuizResult({ quizType, cityId = null, citySlug = null, category = null, score, total, timeSeconds = null }) {
  if (!supabase) return { saved: false, reason: "Supabase nije konfiguriran." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, reason: "Korisnik nije prijavljen." };

  const { error } = await supabase.from("quiz_results").insert({
    user_id: user.id,
    quiz_type: quizType,
    category,
    city_slug: citySlug ?? cityId,
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
    .select("id,quiz_type,category,city_slug,score,total,percentage,time_seconds,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function hasPlayedDailyQuiz(userId) {
  if (!supabase || !userId) return false;

  const { data, error } = await supabase
    .from("quiz_results")
    .select("id")
    .eq("user_id", userId)
    .eq("quiz_type", "daily")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Zagreb",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (data ?? []).some((row) => {
    const created = new Date(row.created_at);
    const rowDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Zagreb",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(created);
    return rowDay === today;
  });
}

export async function getLeaderboard(quizType = null, limit = 50) {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("get_leaderboard", {
    p_quiz_type: quizType,
    p_limit: limit,
  });
  if (error) throw error;
  return data ?? [];
}

import { supabase } from "./supabase";

export async function saveQuizResult({ quizType, cityId = null, citySlug = null, category = null, score, total, timeSeconds = null }) {
  if (!supabase) return { saved: false, reason: "Supabase nije konfiguriran." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { saved: false, reason: "Korisnik nije prijavljen." };

  const { error } = await supabase.rpc("record_quiz_result", {
    p_quiz_type: quizType,
    p_category: category,
    p_city_slug: citySlug ?? cityId,
    p_score: Number(score),
    p_total: Number(total),
    p_time_seconds: timeSeconds == null ? null : Number(timeSeconds),
  });

  if (error) throw error;
  return { saved: true };
}

export async function getMyResults(page = 1, pageSize = 20) {
  if (!supabase) return { data: [], count: 0 };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: [], count: 0 };

  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.max(1, Math.min(100, Number(pageSize) || 20));
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  const { data, count, error } = await supabase
    .from("quiz_results")
    .select("id,quiz_type,category,city_slug,score,total,percentage,time_seconds,created_at", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getMyResultStats() {
  if (!supabase) return [];

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("quiz_results")
    .select("quiz_type,score,total,percentage")
    .eq("user_id", user.id);

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

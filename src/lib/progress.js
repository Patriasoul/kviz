import { supabase } from "./supabase";

export async function getMyProgress() {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("player_progress")
    .select("quiz_type,xp,level,quizzes_played,best_percentage,current_streak,best_streak,last_played_date")
    .eq("user_id", user.id);

  if (error) throw error;
  return data ?? [];
}

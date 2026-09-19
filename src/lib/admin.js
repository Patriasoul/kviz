import { supabase } from "./supabase";

export async function getAdminDashboardStats() {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data, error } = await supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  return Array.isArray(data) ? data[0] ?? null : data ?? null;
}

export async function getAdminUsers() {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data, error } = await supabase.rpc("admin_list_users");
  if (error) throw error;
  return data ?? [];
}

export async function getAdminQuizResults() {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data, error } = await supabase.rpc("admin_list_quiz_results");
  if (error) throw error;
  return data ?? [];
}

export async function deleteAdminQuizResult(resultId) {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data, error } = await supabase.rpc("admin_delete_quiz_result", {
    p_result_id: resultId,
  });
  if (error) throw error;
  return data;
}

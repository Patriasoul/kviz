import { supabase } from "./supabase";

export async function getMyProfile() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function saveMyNickname(nickname) {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Moraš biti prijavljen.");

  const clean = String(nickname ?? "").trim();
  if (clean.length < 3 || clean.length > 24) {
    throw new Error("Nadimak mora imati između 3 i 24 znaka.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: clean, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id,display_name")
    .single();

  if (error?.code === "23505") {
    throw new Error("Taj nadimak već postoji. Odaberi drugi.");
  }
  if (error) throw error;
  return data;
}

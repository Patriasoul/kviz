import { supabase } from "./supabase";

export async function getMyProfile() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,role,avatar_url")
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
    .select("id,display_name,avatar_url")
    .single();

  if (error?.code === "23505") {
    throw new Error("Taj nadimak već postoji. Odaberi drugi.");
  }
  if (error) throw error;
  return data;
}

export async function saveMyAvatar(file) {
  if (!supabase) throw new Error("Supabase nije konfiguriran.");
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Moraš biti prijavljen.");
  if (!(file instanceof File)) throw new Error("Odaberi sliku.");
  if (file.size > 2 * 1024 * 1024) throw new Error("Slika može imati najviše 2 MB.");
  if (!["image/png","image/jpeg","image/webp"].includes(file.type)) throw new Error("Dopuštene su PNG, JPG i WebP slike.");
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = user.id + "/" + crypto.randomUUID() + "." + ext;
  const upload = await supabase.storage.from("avatars").upload(path, file, { upsert: false, contentType: file.type });
  if (upload.error) throw upload.error;
  const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatar_url = publicData.publicUrl;
  const { data, error } = await supabase.from("profiles").update({ avatar_url, updated_at: new Date().toISOString() }).eq("id", user.id).select("id,display_name,role,avatar_url").single();
  if (error) throw error;
  return data;
}

import { supabase } from "./supabase";

export async function getCommunityComments() {
  const { data, error } = await supabase
    .from("community_comments")
    .select("id,user_id,parent_id,content,created_at,updated_at,profiles:profiles!community_comments_user_id_fkey(display_name)")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    ...row,
    display_name: row.profiles?.display_name || "PatriaSoul igrač",
    profiles: undefined,
  }));
}

export async function getCommunityMembers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name")
    .not("display_name", "is", null)
    .order("display_name", { ascending: true })
    .limit(100);

  if (error) throw error;
  return (data || []).filter((row) => row.display_name?.trim());
}

export async function createCommunityComment({ content, parentId = null }) {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData?.user) throw new Error("Za komentiranje se moraš prijaviti.");

  const clean = String(content || "").trim();
  if (!clean) throw new Error("Komentar ne može biti prazan.");
  if (clean.length > 1000) throw new Error("Komentar može imati najviše 1000 znakova.");

  const { data, error } = await supabase
    .from("community_comments")
    .insert({
      user_id: userData.user.id,
      parent_id: parentId || null,
      content: clean,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCommunityComment(commentId) {
  const { error } = await supabase
    .from("community_comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
}

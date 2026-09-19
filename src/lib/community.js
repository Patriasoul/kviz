import { supabase } from "./supabase";

export async function getCommunityComments() {
  const { data, error } = await supabase
    .from("community_comments")
    .select("id,user_id,parent_id,content,created_at,updated_at,profiles:profiles!community_comments_user_id_fkey(display_name)")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, display_name: row.profiles?.display_name || "PatriaSoul igrač", profiles: undefined }));
}

export async function getCommunityMembers() {
  const { data, error } = await supabase.from("profiles").select("id,display_name").not("display_name", "is", null).order("display_name", { ascending: true }).limit(100);
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
  const { data, error } = await supabase.from("community_comments").insert({ user_id: userData.user.id, parent_id: parentId || null, content: clean }).select("id").single();
  if (error) throw error;
  return data;
}

export async function createCommunityNotification({ userId, commentId, type = "mention" }) {
  const { data, error } = await supabase.rpc("create_community_notification", {
    p_user_id: userId,
    p_comment_id: commentId,
    p_type: type,
  });
  if (error) throw error;
  return data;
}

export async function getCommunityNotifications() {
  const { data, error } = await supabase
    .from("community_notifications")
    .select("id,user_id,actor_id,comment_id,type,read_at,created_at,comments:community_comments(content),actor:profiles!community_notifications_actor_id_fkey(display_name)")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data || []).map((row) => ({
    ...row,
    actor_name: row.actor?.display_name || "PatriaSoul igrač",
    comment_text: row.comments?.content || "",
  }));
}

export async function markCommunityNotificationRead(id) {
  const { error } = await supabase.from("community_notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

export async function deleteCommunityComment(commentId) {
  const { error } = await supabase.from("community_comments").delete().eq("id", commentId);
  if (error) throw error;
}

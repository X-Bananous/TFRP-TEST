import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

export async function getPendingCharactersCount() {
  const { count, error } = await supabase
    .from("characters")
    .select("*", { count: 'exact', head: true })
    .eq("status", "pending");
  return error ? 0 : (count || 0);
}

export async function getOldestPendingCharacter() {
  const { data } = await supabase
    .from("characters")
    .select("created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getNewValidations() {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .eq("status", "accepted")
    .or('is_notified.is.null,is_notified.eq.false');
  return data || [];
}

export async function getUserAcceptedCharacters(userId) {
  const { data } = await supabase.from("characters").select("*").eq("user_id", userId).eq("status", "accepted");
  return data || [];
}

export async function getAllUserCharacters(userId) {
  const { data } = await supabase.from("characters").select("*").eq("user_id", userId).limit(25);
  return data || [];
}

export async function getCharacterById(charId) {
  const { data } = await supabase.from("characters").select("*").eq("id", charId).maybeSingle();
  return data;
}

export async function getProfile(profileId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  return data;
}

export async function updateProfilePermissions(profileId, permissions) {
  return await supabase.from("profiles").update({ permissions }).eq("id", profileId);
}
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

export async function getTotalCharactersCount() {
  const { count, error } = await supabase
    .from("characters")
    .select("*", { count: 'exact', head: true });
  return error ? 0 : (count || 0);
}

export async function getAcceptedCharactersCount() {
  const { count, error } = await supabase
    .from("characters")
    .select("*", { count: 'exact', head: true })
    .eq("status", "accepted");
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
    .eq('is_notified', false);
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

// SANCTIONS DB LOGIC
export async function createSanction(data) {
  return await supabase.from("sanctions").insert(data).select().single();
}

export async function getActiveSanctions(userId) {
  const { data } = await supabase.from("sanctions")
    .select("*")
    .eq("user_id", userId)
    .or('expires_at.is.null,expires_at.gt.now()')
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getAllSanctions(userId) {
  const { data } = await supabase.from("sanctions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data || [];
}
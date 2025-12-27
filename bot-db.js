
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

/**
 * Récupère le nombre de dossiers en attente
 */
export async function getPendingCharactersCount() {
  const { count, error } = await supabase
    .from("characters")
    .select("*", { count: 'exact', head: true })
    .eq("status", "pending");
  return error ? 0 : (count || 0);
}

/**
 * Récupère les personnages acceptés non notifiés pour le bot
 */
export async function getNewValidations() {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .eq("status", "accepted")
    .or('is_notified.is.null,is_notified.eq.false');
  return data || [];
}

/**
 * Récupère les personnages acceptés d'un utilisateur
 */
export async function getUserAcceptedCharacters(userId) {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "accepted");
  return data || [];
}

/**
 * Récupère tous les personnages d'un utilisateur (limité à 25 pour Discord)
 */
export async function getAllUserCharacters(userId) {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", userId)
    .limit(25);
  return data || [];
}

/**
 * Récupère un personnage spécifique par son ID
 */
export async function getCharacterById(charId) {
  const { data } = await supabase
    .from("characters")
    .select("*")
    .eq("id", charId)
    .maybeSingle();
  return data;
}

/**
 * Création d'un personnage
 */
export async function createCharacter(charData) {
  return await supabase.from("characters").insert([charData]);
}

/**
 * Mise à jour d'un personnage
 */
export async function updateCharacter(charId, charData) {
  return await supabase.from("characters").update(charData).eq("id", charId);
}

/**
 * Récupère le pseudo Discord stocké
 */
export async function getProfile(profileId) {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .maybeSingle();
  return data;
}

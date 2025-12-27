
import { createClient } from "@supabase/supabase-js";

/**
 * Initialisation du client Supabase pour le bot
 */
export const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

/**
 * Marque des personnages comme ayant été notifiés sur Discord
 */
export async function markAsNotified(characterIds) {
  if (!characterIds || characterIds.length === 0) return;
  const { error } = await supabase
    .from("characters")
    .update({ is_notified: true })
    .in("id", characterIds);
  
  if (error) console.error(`[DB ERROR] markAsNotified: ${error.message}`);
}

/**
 * Récupère les nouvelles validations acceptées non notifiées
 */
export async function getNewValidations() {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("status", "accepted")
    .or('is_notified.is.null,is_notified.eq.false');

  if (error) {
    console.error(`[DB ERROR] getNewValidations: ${error.message}`);
    return [];
  }
  return data || [];
}

/**
 * Récupère les personnages acceptés pour un utilisateur spécifique
 */
export async function getUserAcceptedCharacters(userId) {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "accepted");

  if (error) return [];
  return data || [];
}

/**
 * Récupère tous les personnages d'un utilisateur
 */
export async function getAllUserCharacters(userId) {
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", userId);
  return data || [];
}

/**
 * Récupère un profil via son ID
 */
export async function getProfile(profileId) {
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", profileId)
    .maybeSingle();
  return data;
}

/**
 * Configuration globale du bot TFRP
 */
export const BOT_CONFIG = {
  MAIN_SERVER_ID: "1279455759414857759",
  LOG_CHANNEL_ID: "1450962428492775505",
  CUSTOMS_CHANNEL_ID: "1454245706842771690",
  SITE_URL: "https://x-bananous.github.io/tfrp/",
  EMBED_COLOR: 0x00008B, // Bleu foncé
  
  VERIFIED_ROLE_IDS: [
    "1450941712938696845",
    "1445853668246163668"
  ],
  UNVERIFIED_ROLE_ID: "1445853684696223846",
  
  // Mapping Permissions Site -> Noms des Rôles Discord
  // Le bot créera ces rôles s'ils n'existent pas
  PERM_ROLE_MAP: {
    "can_approve_characters": { name: "Staff - Whitelist", color: "#f1c40f" },
    "can_manage_characters": { name: "Staff - Registre Civil", color: "#3498db" },
    "can_manage_economy": { name: "Staff - Économie", color: "#2ecc71" },
    "can_manage_illegal": { name: "Staff - Audit Illégal", color: "#e74c3c" },
    "can_manage_enterprises": { name: "Staff - Réseau Commercial", color: "#e67e22" },
    "can_manage_staff": { name: "Staff - Directoire Administration", color: "#9b59b6" },
    "can_manage_inventory": { name: "Staff - Saisie d'objets", color: "#1abc9c" },
    "can_change_team": { name: "Staff - Mutation Secteur", color: "#34495e" },
    "can_go_onduty": { name: "Staff - Badge Service", color: "#95a5a6" },
    "can_manage_jobs": { name: "Staff - Affectation Métier", color: "#d35400" },
    "can_launch_session": { name: "Staff - Cycle de Session", color: "#2980b9" },
    "can_execute_commands": { name: "Staff - Console ERLC", color: "#c0392b" },
    "can_bypass_login": { name: "Staff - Accès Fondation", color: "#000000" },
    "can_give_wheel_turn": { name: "Staff - Maître des Roues", color: "#f39c12" },
    "can_use_dm": { name: "Staff - Messagerie Bot", color: "#8e44ad" },
    "can_use_say": { name: "Staff - Transmission Bot", color: "#27ae60" }
  }
};
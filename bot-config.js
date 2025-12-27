
/**
 * Configuration globale du bot TFRP
 */
export const BOT_CONFIG = {
  MAIN_SERVER_ID: "1279455759414857759",
  LOG_CHANNEL_ID: "1450962428492775505",
  CUSTOMS_CHANNEL_ID: "1454245706842771690",
  SITE_URL: "https://x-bananous.github.io/tfrp/",
  COLORS: {
    DARK_BLUE: 0x00008B,
    ERROR: 0xCC0000,
    WARNING: 0xFFA500,
    SUCCESS: 0x00FF00,
    PURPLE: 0x9B59B6,
    GREY: 0x2F3136
  },
  VERIFIED_ROLE_IDS: [
    "1450941712938696845",
    "1445853668246163668"
  ],
  UNVERIFIED_ROLE_ID: "1445853684696223846",
  
  // Mapping Permissions Site -> Noms des Rôles (pour création auto et synchro)
  PERM_ROLES: {
    "can_approve_characters": { name: "Staff - Whitelist", color: "#f1c40f" },
    "can_manage_characters": { name: "Staff - Registre", color: "#3498db" },
    "can_manage_economy": { name: "Staff - Economie", color: "#2ecc71" },
    "can_manage_illegal": { name: "Staff - Illegal", color: "#e74c3c" },
    "can_manage_enterprises": { name: "Staff - Entreprises", color: "#e67e22" },
    "can_manage_staff": { name: "Staff - Administration", color: "#9b59b6" },
    "can_manage_inventory": { name: "Staff - Inventaires", color: "#1abc9c" },
    "can_change_team": { name: "Staff - Mutations", color: "#34495e" },
    "can_go_onduty": { name: "Staff - Service", color: "#95a5a6" },
    "can_manage_jobs": { name: "Staff - Metiers", color: "#d35400" },
    "can_launch_session": { name: "Staff - Sessions", color: "#2980b9" },
    "can_execute_commands": { name: "Staff - Console", color: "#c0392b" },
    "can_use_dm": { name: "Staff - Messagerie", color: "#8e44ad" },
    "can_use_say": { name: "Staff - Transmission", color: "#27ae60" }
  },

  PROTECTED_GUILDS: [
    "1445066668018499820", 
    "1450962428492775505", 
    "1447982790967558196"
  ]
};

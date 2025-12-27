
/**
 * Configuration globale du bot TFRP
 */
export const BOT_CONFIG = {
  MAIN_SERVER_ID: "1279455759414857759",
  LOG_CHANNEL_ID: "1450962428492775505",
  SITE_URL: "https://x-bananous.github.io/tfrp/",
  COLORS: {
    DARK_BLUE: 0x00008B,
    ERROR: 0xCC0000,
    WARNING: 0xFFA500,
    SUCCESS: 0x00FF00
  },
  // Rôles accordés aux citoyens vérifiés
  VERIFIED_ROLE_IDS: [
    "1450941712938696845",
    "1445853668246163668"
  ],
  // Rôle temporaire pour les non-vérifiés
  UNVERIFIED_ROLE_ID: "1445853684696223846",
  // Mapping des rôles métiers vers ID Discord (Main Server)
  JOB_ROLES: {
    "leo": "1445853630593761512",
    "lafd": "1445853634653982791",
    "ladot": "1445853641088045107"
  },
  // Serveurs protégés où le kick est automatique sans perso valide
  PROTECTED_GUILDS: [
    "1445066668018499820", 
    "1450962428492775505", 
    "1447982790967558196"
  ]
};

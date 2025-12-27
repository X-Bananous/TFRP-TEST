
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
    GREY: 0x2F3136,
    WHITE: 0xFFFFFF
  },
  VERIFIED_ROLE_IDS: [
    "1450941712938696845",
    "1445853668246163668"
  ],
  UNVERIFIED_ROLE_ID: "1445853684696223846",
  
  // Mapping Permissions Site -> IDs de Rôles Discord
  PERM_ROLE_MAP: {
    "can_approve_characters": "1454483754981392434",
    "can_manage_characters": "1454483756088954930",
    "can_manage_economy": "1454483757137526835",
    "can_manage_illegal": "1454483758156611644",
    "can_manage_enterprises": "1454483759146471465",
    "can_manage_staff": "1454483760115351612",
    "can_manage_inventory": "1454483761084235836",
    "can_change_team": "1454483762057314354",
    "can_go_onduty": "1454483763026202674",
    "can_manage_jobs": "1454483763995217981",
    "can_launch_session": "1454483764964360252",
    "can_execute_commands": "1454483765938225213",
    "can_use_dm": "1454483766911111248",
    "can_use_say": "1454483767884189756"
  },

  PROTECTED_GUILDS: [
    "1445066668018499820", 
    "1450962428492775505", 
    "1447982790967558196"
  ]
};

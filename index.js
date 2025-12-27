import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  PermissionFlagsBits
} from "discord.js";
import { BOT_CONFIG } from "./bot-config.js";
import { 
  getNewValidations,
  getUserAcceptedCharacters
} from "./bot-db.js";
import { 
  updateCustomsStatus,
  performGlobalSync,
  handleUnverified
} from "./bot-services.js";

// Import Command Logic
import { sayCommand } from "./bot/commands/say.js";
import { dmCommand } from "./bot/commands/dm.js";
import { personnagesCommand, handlePersonnagesSelect } from "./bot/commands/personnages.js";
import { verificationCommand } from "./bot/commands/verification.js";
import { statusCommand, ssdDeployCommand } from "./bot/commands/status.js";
import { aideCommand } from "./bot/commands/aide.js";
import { panelCommand } from "./bot/commands/panel.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

async function runScans() {
  console.log("[Système] Lancement du scan SSD/Sync...");
  await performGlobalSync(client);
  await updateCustomsStatus(client);
}

client.once("ready", async () => {
  console.log(`Bot TFRP v6.3 opérationnel : ${client.user.tag}`);

  const commands = [
    personnagesCommand.data.toJSON(),
    verificationCommand.data.toJSON(),
    statusCommand.data.toJSON(),
    ssdDeployCommand.data.toJSON(),
    sayCommand.data.toJSON(),
    dmCommand.data.toJSON(),
    aideCommand.data.toJSON(),
    panelCommand.data.toJSON()
  ];

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { 
    console.log("[Système] Déploiement des commandes sur le serveur...");
    // Enregistrement sur le serveur spécifique pour affichage INSTANTANÉ
    await rest.put(
      Routes.applicationGuildCommands(client.user.id, BOT_CONFIG.MAIN_SERVER_ID), 
      { body: commands }
    );
    // Enregistrement global (optionnel, pour les MPs)
    await rest.put(
      Routes.applicationCommands(client.user.id), 
      { body: commands }
    );
    console.log("[Système] Commandes Slash synchronisées !");
  } catch (e) { 
    console.error("[Erreur] Échec synchronisation commandes :", e); 
  }

  runScans();
  setInterval(runScans, 60000); 
});

client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    if (commandName === "personnages") return personnagesCommand.execute(interaction);
    if (commandName === "verification") return verificationCommand.execute(interaction, client);
    if (commandName === "status") return statusCommand.execute(interaction);
    if (commandName === "ssd") return ssdDeployCommand.execute(interaction);
    if (commandName === "say") return sayCommand.execute(interaction);
    if (commandName === "dm") return dmCommand.execute(interaction);
    if (commandName === "aide") return aideCommand.execute(interaction);
    if (commandName === "panel") return panelCommand.execute(interaction);
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'btn_reload_ssd') {
      await interaction.deferUpdate();
      await updateCustomsStatus(client);
    }
    
    if (interaction.customId === 'btn_back_to_list') {
      await interaction.deferUpdate();
      await personnagesCommand.execute(interaction, true);
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_manage') {
    await handlePersonnagesSelect(interaction);
  }
});

client.login(process.env.DISCORD_TOKEN);
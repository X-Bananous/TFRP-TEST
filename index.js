import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} from "discord.js";
import { BOT_CONFIG } from "./bot-config.js";
import { 
  getNewValidations, 
  getUserAcceptedCharacters, 
  getAllUserCharacters, 
  getCharacterById,
  getProfile
} from "./bot-db.js";
import { 
  handleVerification,
  updateCustomsStatus,
  getSSDComponents,
  getPersonnagesHomeEmbed,
  getCharacterDetailsEmbed,
  getVerificationStatusEmbed,
  handleUnverified,
  performGlobalSync
} from "./bot-services.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

/**
 * Cycle de synchronisation automatisé (Toutes les 60 secondes)
 */
async function runScans() {
  console.log("[Système] Lancement du cycle de synchronisation bidirectionnelle...");
  
  // 1. Audit et Sync Rôles Discord <-> Permissions Site
  await performGlobalSync(client);
  
  // 2. Mise à jour de l'affichage SSD
  await updateCustomsStatus(client);
  
  // 3. Traitement des notifications de validation
  const newChars = await getNewValidations();
  if (newChars.length > 0) {
    const charsByUser = {};
    newChars.forEach(c => {
      if (!charsByUser[c.user_id]) charsByUser[c.user_id] = [];
      charsByUser[c.user_id].push(c);
    });
    for (const userId in charsByUser) {
      await handleVerification(client, userId, charsByUser[userId]);
    }
  }
}

client.once("ready", async () => {
  console.log(`Système opérationnel : ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder().setName('personnages').setDescription('Accéder à vos identités enregistrées'),
    new SlashCommandBuilder().setName('verification').setDescription('Synchroniser vos documents'),
    new SlashCommandBuilder().setName('status').setDescription('Statut des services douaniers'),
    new SlashCommandBuilder().setName('ssd').setDescription('Déployer le terminal SSD (Staff uniquement)'),
    
    new SlashCommandBuilder().setName('say')
      .setDescription('Diffuser un message via le bot (Permission requise)')
      .addStringOption(opt => opt.setName('message').setDescription('Contenu de la transmission').setRequired(true))
      .addAttachmentOption(opt => opt.setName('fichier').setDescription('Joindre un document')),

    new SlashCommandBuilder().setName('dm')
      .setDescription('Envoi de message privé via le bot (Permission requise)')
      .addUserOption(opt => opt.setName('cible').setDescription('Destinataire').setRequired(true))
      .addStringOption(opt => opt.setName('message').setDescription('Contenu de la transmission').setRequired(true))
      .addAttachmentOption(opt => opt.setName('fichier').setDescription('Joindre un document'))
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { 
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); 
  } catch (e) { console.error(e); }

  // Exécution immédiate puis intervalle
  runScans();
  setInterval(runScans, 60000); 
});

async function sendCharacterList(interaction, isUpdate = false) {
    const allChars = await getAllUserCharacters(interaction.user.id);
    const mention = `<@${interaction.user.id}>`;
    const homeEmbed = getPersonnagesHomeEmbed(mention);

    const selectMenu = new StringSelectMenuBuilder().setCustomId('select_char_manage').setPlaceholder('Sélectionner une fiche citoyenne');
    
    if (allChars.length > 0) {
        allChars.forEach(char => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder()
                .setLabel(`${char.first_name} ${char.last_name}`)
                .setDescription(`Statut : ${char.status}`)
                .setValue(char.id)
            );
        });
    } else {
        selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel("Aucune donnée").setValue("none").setDisabled(true));
    }

    const components = [new ActionRowBuilder().addComponents(selectMenu)];
    const payload = { embeds: [homeEmbed], components: components, ephemeral: true };
    return isUpdate ? interaction.editReply(payload) : interaction.reply(payload);
}

client.on("interactionCreate", async interaction => {
  
  if (interaction.isChatInputCommand()) {
    const { commandName, options, user, member } = interaction;

    if (commandName === "status") {
      const components = await getSSDComponents();
      return interaction.reply({ ...components, ephemeral: true });
    }

    if (commandName === "verification") {
      await interaction.deferReply({ ephemeral: true });
      const embed = await getVerificationStatusEmbed(user.id);
      const acceptedChars = await getUserAcceptedCharacters(user.id);
      
      if (acceptedChars.length > 0) {
        await handleVerification(client, user.id, acceptedChars);
      } else {
        await handleUnverified(client, user.id);
      }
      return interaction.editReply({ embeds: [embed] });
    }

    if (commandName === "personnages") {
      await sendCharacterList(interaction);
    }

    if (commandName === "say" || commandName === "dm") {
      const profile = await getProfile(user.id);
      const perms = profile?.permissions || {};
      const requiredPerm = commandName === "say" ? "can_use_say" : "can_use_dm";

      if (!perms[requiredPerm]) {
        const errorEmbed = new EmbedBuilder()
          .setTitle("Accès restreint")
          .setColor(BOT_CONFIG.EMBED_COLOR)
          .setDescription(`Désolé ${user}, votre niveau d'accréditation est insuffisant.`);
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      const messageContent = options.getString('message');
      const attachment = options.getAttachment('fichier');
      const files = attachment ? [attachment] : [];

      if (commandName === "say") {
        await interaction.channel.send({ content: messageContent, files });
        const successEmbed = new EmbedBuilder().setTitle("Signal transmis").setColor(BOT_CONFIG.EMBED_COLOR).setDescription("Votre message a été diffusé avec succès.");
        return interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        const target = options.getUser('cible');
        try {
          await target.send({ content: messageContent, files });
          const successEmbed = new EmbedBuilder().setTitle("Signal transmis").setColor(BOT_CONFIG.EMBED_COLOR).setDescription(`Votre message privé a été délivré à <@${target.id}>.`);
          return interaction.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (e) {
          const failEmbed = new EmbedBuilder().setTitle("Échec de transmission").setColor(BOT_CONFIG.EMBED_COLOR).setDescription(`Impossible de contacter <@${target.id}> (Communications fermées).`);
          return interaction.reply({ embeds: [failEmbed], ephemeral: true });
        }
      }
    }

    if (commandName === "ssd") {
      if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
         return interaction.reply({ content: "Seul le commandement peut déployer ce terminal.", ephemeral: true });
      }
      const components = await getSSDComponents();
      await interaction.channel.send(components);
      return interaction.reply({ content: "Terminal déployé.", ephemeral: true });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'btn_reload_ssd') {
      await interaction.deferUpdate();
      await updateCustomsStatus(client);
    }
    if (interaction.customId === 'btn_back_to_list') {
      await interaction.deferUpdate();
      await sendCharacterList(interaction, true);
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_manage') {
    await interaction.deferUpdate();
    const char = await getCharacterById(interaction.values[0]);
    if (char) {
        const details = await getCharacterDetailsEmbed(char);
        await interaction.editReply(details);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
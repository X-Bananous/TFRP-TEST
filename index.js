
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
  createCharacter,
  updateCharacter,
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
  performGlobalSync,
  calculateAge
} from "./bot-services.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

async function runScans() {
  console.log("[Système] Lancement du cycle de synchronisation...");
  
  // 1. Mise à jour statut douanes
  await updateCustomsStatus(client);
  
  // 2. Synchronisation globale DB <-> Discord (Permissions et Rôles)
  await performGlobalSync(client);
  
  // 3. Vérification des nouvelles validations pour notifications
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
  console.log(`Connecté en tant que : ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder().setName('personnages').setDescription('Gérer vos fiches citoyennes'),
    new SlashCommandBuilder().setName('verification').setDescription('Lancer la synchronisation du terminal'),
    new SlashCommandBuilder().setName('status').setDescription('Statut détaillé des douanes'),
    new SlashCommandBuilder().setName('ssd').setDescription('Envoyer le terminal ssd (staff uniquement)'),
    
    new SlashCommandBuilder().setName('say')
      .setDescription('Faire parler le bot (permission requise)')
      .addStringOption(opt => opt.setName('message').setDescription('Texte à envoyer').setRequired(true))
      .addAttachmentOption(opt => opt.setName('fichier').setDescription('Joindre un fichier')),

    new SlashCommandBuilder().setName('dm')
      .setDescription('Envoyer un message privé via le bot (permission requise)')
      .addUserOption(opt => opt.setName('cible').setDescription('Destinataire').setRequired(true))
      .addStringOption(opt => opt.setName('message').setDescription('Texte à envoyer').setRequired(true))
      .addAttachmentOption(opt => opt.setName('fichier').setDescription('Joindre un fichier'))
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { 
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); 
  } catch (e) { console.error(e); }

  // Premier scan immédiat
  runScans();
  
  // Boucle de scan toutes les 60 secondes (1 minute)
  setInterval(runScans, 60000); 
});

async function sendCharacterList(interaction, isUpdate = false) {
    const allChars = await getAllUserCharacters(interaction.user.id);
    const mention = `<@${interaction.user.id}>`;
    const homeEmbed = getPersonnagesHomeEmbed(mention);

    const selectMenu = new StringSelectMenuBuilder().setCustomId('select_char_manage').setPlaceholder('Choisir un dossier');
    
    if (allChars.length > 0) {
        allChars.forEach(char => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder()
                .setLabel(`${char.first_name} ${char.last_name}`)
                .setDescription(`Statut : ${char.status}`)
                .setValue(char.id)
            );
        });
    } else {
        selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel("Aucun dossier").setValue("none").setDisabled(true));
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
          .setTitle("Accès refusé")
          .setColor(BOT_CONFIG.EMBED_COLOR)
          .setDescription(`Désolé <@${user.id}>, vous n'avez pas l'accréditation nécessaire pour utiliser cette transmission.`);
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      const messageContent = options.getString('message');
      const attachment = options.getAttachment('fichier');
      const files = attachment ? [attachment] : [];

      if (commandName === "say") {
        await interaction.channel.send({ content: messageContent, files });
        const successEmbed = new EmbedBuilder().setTitle("Transmission effectuée").setColor(BOT_CONFIG.EMBED_COLOR).setDescription("Votre message a été diffusé.");
        return interaction.reply({ embeds: [successEmbed], ephemeral: true });
      } else {
        const target = options.getUser('cible');
        try {
          await target.send({ content: messageContent, files });
          const successEmbed = new EmbedBuilder().setTitle("Message transmis").setColor(BOT_CONFIG.EMBED_COLOR).setDescription(`Votre message privé a été envoyé à <@${target.id}>.`);
          return interaction.reply({ embeds: [successEmbed], ephemeral: true });
        } catch (e) {
          const failEmbed = new EmbedBuilder().setTitle("Échec de l'envoi").setColor(BOT_CONFIG.EMBED_COLOR).setDescription(`Impossible de contacter <@${target.id}> (messages privés fermés).`);
          return interaction.reply({ embeds: [failEmbed], ephemeral: true });
        }
      }
    }

    if (commandName === "ssd") {
      if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
         return interaction.reply({ content: "Vous n'avez pas la permission de déployer ce terminal.", ephemeral: true });
      }
      const components = await getSSDComponents();
      await interaction.channel.send(components);
      return interaction.reply({ content: "Terminal douanier déployé.", ephemeral: true });
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

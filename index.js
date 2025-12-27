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
  getProfile,
  supabase
} from "./bot-db.js";
import { 
  handleVerification,
  updateCustomsStatus,
  getSSDComponents,
  buildCharacterModal,
  calculateAge,
  getPersonnagesHomeEmbed,
  getCharacterDetailsEmbed,
  getVerificationStatusEmbed,
  syncRolesToPermissions,
  handleUnverified,
  ensureRolesExist,
  syncPermissionsToRoles
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
  await updateCustomsStatus(client);
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

  // Vérification et création des rôles au démarrage
  const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
  if (mainGuild) await ensureRolesExist(mainGuild);

  const commands = [
    new SlashCommandBuilder().setName('personnages').setDescription('Gérer vos fiches citoyennes'),
    new SlashCommandBuilder().setName('verification').setDescription('Lancer la synchronisation du terminal'),
    new SlashCommandBuilder().setName('status').setDescription('Statut détaillé des douanes'),
    new SlashCommandBuilder().setName('ssd').setDescription('Envoyer le terminal SSD (Staff uniquement)'),
    
    new SlashCommandBuilder().setName('say')
      .setDescription('Faire parler le bot (Permission requise)')
      .addStringOption(opt => opt.setName('message').setDescription('Texte à envoyer').setRequired(true))
      .addAttachmentOption(opt => opt.setName('fichier').setDescription('Joindre un fichier')),

    new SlashCommandBuilder().setName('dm')
      .setDescription('Envoyer un message privé via le bot (Permission requise)')
      .addUserOption(opt => opt.setName('cible').setDescription('Destinataire').setRequired(true))
      .addStringOption(opt => opt.setName('message').setDescription('Texte à envoyer').setRequired(true))
      .addAttachmentOption(opt => opt.setName('fichier').setDescription('Joindre un fichier'))
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { 
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); 
  } catch (e) { console.error(e); }

  runScans();
  setInterval(runScans, 300000); 
});

/**
 * SYNCHRONISATION DISCORD -> SITE (Bidirectionnel)
 * Détecte si un staff modifie les rôles manuellement sur Discord
 */
client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (newMember.guild.id !== BOT_CONFIG.MAIN_SERVER_ID) return;
  await syncRolesToPermissions(newMember);
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
    if (allChars.length < 1) { 
       components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_create_char').setLabel('Ouvrir une fiche').setStyle(ButtonStyle.Success)));
    }

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
          const failEmbed = new EmbedBuilder().setTitle("Échec de l'envoi").setColor(BOT_CONFIG.EMBED_COLOR).setDescription(`Impossible de contacter <@${target.id}> (Messages privés fermés).`);
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
    if (interaction.customId === 'btn_create_char') {
      await interaction.showModal(buildCharacterModal(false));
    }
    if (interaction.customId.startsWith('btn_edit_char_')) {
      const char = await getCharacterById(interaction.customId.replace('btn_edit_char_', ''));
      if (char) await interaction.showModal(buildCharacterModal(true, char));
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

  if (interaction.isModalSubmit()) {
    const isEdit = interaction.customId.startsWith('edit_char_modal_');
    const charId = isEdit ? interaction.customId.replace('edit_char_modal_', '') : null;
    const f = {
      first_name: interaction.fields.getTextInputValue('first_name'),
      last_name: interaction.fields.getTextInputValue('last_name'),
      birth_date: interaction.fields.getTextInputValue('birth_date'),
      birth_place: interaction.fields.getTextInputValue('birth_place'),
      alignment: interaction.fields.getTextInputValue('alignment').toLowerCase()
    };

    const age = calculateAge(f.birth_date);
    if (age < 13) return interaction.reply({ content: "Erreur : L'âge minimum requis est de 13 ans.", ephemeral: true });

    let status = 'pending', job = 'unemployed';
    if (isEdit) {
      const old = await getCharacterById(charId);
      status = old.status; job = old.job;
      if (f.first_name.toLowerCase() !== old.first_name.toLowerCase() || f.last_name.toLowerCase() !== old.last_name.toLowerCase()) {
        status = 'pending';
      }
      if (f.alignment !== old.alignment) job = 'unemployed';
    }

    const payload = { user_id: interaction.user.id, ...f, age, status, job, is_notified: false };
    const { error } = isEdit ? await updateCharacter(charId, payload) : await createCharacter(payload);

    return interaction.reply({ content: error ? `Erreur base de données : ${error.message}` : "Votre dossier a été transmis pour analyse.", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
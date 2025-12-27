
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  PermissionFlagsBits
} from "discord.js";
import { BOT_CONFIG } from "./bot-config.js";
import { 
  getNewValidations, 
  getUserAcceptedCharacters, 
  getAllUserCharacters, 
  getCharacterById,
  createCharacter,
  updateCharacter
} from "./bot-db.js";
import { 
  kickUnverified, 
  handleUnverified, 
  handleVerification,
  updateCustomsStatus,
  getSSDComponents,
  buildCharacterModal,
  calculateAge,
  getPersonnagesHomeEmbed,
  getCharacterDetailsEmbed
} from "./bot-services.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages
  ]
});

/**
 * Scans automatiques toutes les 5 minutes
 */
async function runScans() {
  console.log("[SYSTEM] Lancement du scan périodique...");
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

/* ================= INITIALISATION ================= */

client.once("ready", async () => {
  console.log(`[SYSTEM] ${client.user.tag} connecté.`);

  const commands = [
    new SlashCommandBuilder().setName('verification').setDescription('Vérifier vos accès en fonction de vos fiches'),
    new SlashCommandBuilder().setName('personnages').setDescription('Gérer vos fiches citoyennes (Création/Modification)'),
    new SlashCommandBuilder().setName('status').setDescription('Afficher le statut détaillé des douanes'),
    new SlashCommandBuilder().setName('ssd').setDescription('Forcer l\'envoi du statut dans le salon douanes (Staff)')
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { 
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); 
  } catch (e) { console.error(e); }

  runScans();
  setInterval(runScans, 300000); 
});

/* ================= ÉVÉNEMENTS D'INTERACTION ================= */

/**
 * Affiche l'interface de sélection des personnages
 */
async function sendCharacterList(interaction, isUpdate = false) {
    const allChars = await getAllUserCharacters(interaction.user.id);
    const homeEmbed = getPersonnagesHomeEmbed(interaction.user.username);

    if (allChars.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle("AUCUN DOSSIER TROUVE")
        .setDescription("Vous ne possedez actuellement aucun dossier citoyen dans notre base de donnees.\n\nSouhaitez-vous en creer un maintenant ?")
        .setColor(BOT_CONFIG.COLORS.WARNING);
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_create_char').setLabel('CREER MON PREMIER DOSSIER').setStyle(ButtonStyle.Success)
      );
      
      if (isUpdate) return interaction.editReply({ embeds: [embed], components: [row] });
      return interaction.editReply({ embeds: [embed], components: [row] });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_char_manage')
      .setPlaceholder('Selectionner un citoyen a gerer');

    allChars.forEach(char => {
        selectMenu.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(`${char.first_name.toUpperCase()} ${char.last_name.toUpperCase()}`)
            .setDescription(`STATUS: ${char.status.toUpperCase()} | JOB: ${(char.job || 'CIVIL').toUpperCase()}`)
            .setValue(char.id)
        );
    });

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    
    // Ajout bouton création si slot libre (Max 1 par défaut configuré précédemment)
    const btnRow = new ActionRowBuilder();
    if (allChars.length < 1) { // Ajuster selon CONFIG.MAX_CHARS si nécessaire
       btnRow.addComponents(new ButtonBuilder().setCustomId('btn_create_char').setLabel('CREER UN NOUVEAU DOSSIER').setStyle(ButtonStyle.Success));
    }

    const components = [actionRow];
    if (btnRow.components.length > 0) components.push(btnRow);

    if (isUpdate) return interaction.editReply({ embeds: [homeEmbed], components: components });
    return interaction.editReply({ embeds: [homeEmbed], components: components });
}

client.on("interactionCreate", async interaction => {
  
  if (interaction.isChatInputCommand()) {
    const { commandName, user } = interaction;

    if (commandName === "status") {
      const components = await getSSDComponents();
      return interaction.reply({ ...components, ephemeral: true });
    }

    if (commandName === "personnages") {
      await interaction.deferReply({ ephemeral: true });
      await sendCharacterList(interaction);
    }

    if (commandName === "ssd") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: "ACCES REFUSE.", ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });
      await updateCustomsStatus(client);
      return interaction.editReply({ content: "STATUT DES DOUANES ENVOYE." });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'btn_reload_ssd') {
      await interaction.deferUpdate();
      await updateCustomsStatus(client);
      return;
    }

    if (interaction.customId === 'btn_back_to_list') {
      await interaction.deferUpdate();
      await sendCharacterList(interaction, true);
      return;
    }

    if (interaction.customId === 'btn_create_char') {
      return interaction.showModal(buildCharacterModal(false));
    }

    if (interaction.customId.startsWith('btn_edit_char_')) {
      const charId = interaction.customId.replace('btn_edit_char_', '');
      const char = await getCharacterById(charId);
      if (!char) return interaction.reply({ content: "ERREUR RECUPERATION DOSSIER.", ephemeral: true });
      return interaction.showModal(buildCharacterModal(true, char));
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_manage') {
    await interaction.deferUpdate();
    const charId = interaction.values[0];
    const char = await getCharacterById(charId);

    if (!char) return interaction.followUp({ content: "DOSSIER INTROUVABLE.", ephemeral: true });
    
    const details = await getCharacterDetailsEmbed(char);
    return interaction.editReply(details);
  }

  if (interaction.isModalSubmit()) {
    const isEdit = interaction.customId.startsWith('edit_char_modal_');
    const charId = isEdit ? interaction.customId.replace('edit_char_modal_', '') : null;
    
    const fields = {
      first_name: interaction.fields.getTextInputValue('first_name'),
      last_name: interaction.fields.getTextInputValue('last_name'),
      birth_date: interaction.fields.getTextInputValue('birth_date'),
      birth_place: interaction.fields.getTextInputValue('birth_place'),
      alignment: interaction.fields.getTextInputValue('alignment').toLowerCase()
    };

    const age = calculateAge(fields.birth_date);
    if (age < 13) return interaction.reply({ content: "ERREUR : LE PERSONNAGE DOIT AVOIR AU MOINS 13 ANS.", ephemeral: true });
    if (!['legal', 'illegal'].includes(fields.alignment)) return interaction.reply({ content: "ERREUR : L'ORIENTATION DOIT ETRE 'LEGAL' OU 'ILLEGAL'.", ephemeral: true });

    let status = 'pending';
    let job = 'unemployed';
    let isNotified = false;
    let verifiedby = null;

    if (isEdit) {
      const oldChar = await getCharacterById(charId);
      status = oldChar.status;
      job = oldChar.job;
      isNotified = oldChar.is_notified;
      verifiedby = oldChar.verifiedby;

      if (fields.first_name.toLowerCase() !== oldChar.first_name.toLowerCase() || fields.last_name.toLowerCase() !== oldChar.last_name.toLowerCase()) {
        status = 'pending';
        verifiedby = null;
        isNotified = false;
      }
      if (fields.alignment !== oldChar.alignment) job = 'unemployed';
    }

    const payload = {
      user_id: interaction.user.id,
      ...fields,
      age,
      status,
      job,
      is_notified: isNotified,
      verifiedby: verifiedby
    };

    const { error } = isEdit ? await updateCharacter(charId, payload) : await createCharacter(payload);

    if (error) {
      return interaction.reply({ content: `ERREUR BDD: ${error.message}`, ephemeral: true });
    } else {
      const msg = isEdit ? "DOSSIER CITOYEN MIS A JOUR AVEC SUCCES." : "DOSSIER TRANSMIS POUR VALIDATION.";
      return interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;
  const acceptedChars = await getUserAcceptedCharacters(member.id);
  if (acceptedChars.length > 0) {
    await handleVerification(client, member.id, acceptedChars);
  } else {
    if (BOT_CONFIG.PROTECTED_GUILDS.includes(member.guild.id)) {
      await kickUnverified(member);
    } else if (member.guild.id === BOT_CONFIG.MAIN_SERVER_ID) {
      await handleUnverified(client, member.id);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

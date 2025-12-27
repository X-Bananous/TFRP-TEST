
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
  getProfile,
  getCharacterById,
  createCharacter,
  updateCharacter,
  supabase 
} from "./bot-db.js";
import { 
  sendWelcomeTutorial, 
  kickUnverified, 
  handleUnverified, 
  handleVerification,
  updateCustomsStatus,
  getSSDDetailsEmbed,
  buildCharacterModal,
  calculateAge
} from "./bot-services.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages
  ]
});

/* ================= SCANS PÉRIODIQUES ================= */

async function runScans() {
  await updateCustomsStatus(client, false);
  const newChars = await getNewValidations();
  if (newChars.length > 0) {
    const charsByUser = {};
    newChars.forEach(c => {
      if (!charsByUser[c.user_id]) charsByUser[c.user_id] = [];
      charsByUser[c.user_id].push(c);
    });
    for (const userId in charsByUser) await handleVerification(client, userId, charsByUser[userId]);
  }
}

/* ================= INITIALISATION ================= */

client.once("ready", async () => {
  console.log(`[SYSTEM] ${client.user.tag} est opérationnel.`);

  const commands = [
    new SlashCommandBuilder().setName('verification').setDescription('Force la vérification de vos fiches personnages'),
    new SlashCommandBuilder().setName('personnages').setDescription('Gérez vos personnages (création/modification)'),
    new SlashCommandBuilder().setName('status').setDescription('Affiche le statut actuel des douanes'),
    new SlashCommandBuilder().setName('ssd').setDescription('Force l\'envoi du statut des douanes (Staff)')
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { 
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); 
  } catch (e) { console.error(e); }

  runScans();
  setInterval(runScans, 300000); 
});

/* ================= ÉVÉNEMENTS ================= */

client.on("interactionCreate", async interaction => {
  // 1. GESTION DES COMMANDES SLASH
  if (interaction.isChatInputCommand()) {
    const { commandName, user } = interaction;

    if (commandName === "status") {
      const embed = await getSSDDetailsEmbed();
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "personnages") {
      await interaction.deferReply({ ephemeral: true });
      const allChars = await getAllUserCharacters(user.id);

      if (allChars.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle("Aucun personnage détecté")
          .setDescription("Vous n'avez pas encore de dossier citoyen. Voulez-vous en créer un maintenant ?")
          .setColor(BOT_CONFIG.COLORS.WARNING);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('btn_create_char').setLabel('Créer mon personnage').setStyle(ButtonStyle.Success)
        );
        return interaction.editReply({ embeds: [embed], components: [row] });
      }

      const selectMenu = new StringSelectMenuBuilder().setCustomId('select_char_manage').setPlaceholder('Choisir un personnage à gérer');
      allChars.slice(0, 25).forEach(char => {
          selectMenu.addOptions(new StringSelectMenuOptionBuilder()
              .setLabel(`${char.first_name} ${char.last_name}`)
              .setDescription(`Status: ${char.status} | Métier: ${char.job || 'Aucun'}`)
              .setValue(char.id)
          );
      });

      const embed = new EmbedBuilder().setTitle("Gestion des Personnages").setDescription("Sélectionnez une fiche pour voir les détails ou la modifier.").setColor(BOT_CONFIG.COLORS.DARK_BLUE);
      return interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
    }

    if (commandName === "ssd") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: "Permission refusée.", ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      await updateCustomsStatus(client, true);
      return interaction.editReply({ content: "Statut envoyé." });
    }
  }

  // 2. GESTION DES BOUTONS ET MENUS
  if (interaction.isButton() && interaction.customId === 'btn_create_char') {
    const modal = buildCharacterModal(false);
    return interaction.showModal(modal);
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_manage') {
    await interaction.deferUpdate();
    const charId = interaction.values[0];
    const char = await getCharacterById(charId);

    if (!char) return interaction.followUp({ content: "Dossier introuvable.", ephemeral: true });

    const statusMap = { 'pending': '🟡 En attente', 'accepted': '🟢 Validé', 'rejected': '🔴 Refusé' };
    const detailEmbed = new EmbedBuilder()
      .setTitle(`Dossier : ${char.first_name} ${char.last_name}`)
      .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
      .addFields(
        { name: "Identité", value: `**Prénom:** ${char.first_name}\n**Nom:** ${char.last_name}\n**Âge:** ${char.age} ans`, inline: true },
        { name: "État Civil", value: `**Statut:** ${statusMap[char.status] || char.status}\n**Métier:** ${char.job || 'Chômeur'}`, inline: true }
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`btn_edit_char_${char.id}`).setLabel('Modifier les informations').setStyle(ButtonStyle.Primary)
    );

    return interaction.editReply({ embeds: [detailEmbed], components: [row] });
  }

  if (interaction.isButton() && interaction.customId.startsWith('btn_edit_char_')) {
    const charId = interaction.customId.replace('btn_edit_char_', '');
    const char = await getCharacterById(charId);
    if (!char) return interaction.reply({ content: "Erreur.", ephemeral: true });
    const modal = buildCharacterModal(true, char);
    return interaction.showModal(modal);
  }

  // 3. GESTION DES MODALS (SUBMISSION)
  if (interaction.isModalSubmit()) {
    const isEdit = interaction.customId.startsWith('edit_char_modal_');
    const charId = isEdit ? interaction.customId.replace('edit_char_modal_', '') : null;
    
    const firstName = interaction.fields.getTextInputValue('first_name');
    const lastName = interaction.fields.getTextInputValue('last_name');
    const birthDateStr = interaction.fields.getTextInputValue('birth_date');
    const birthPlace = interaction.fields.getTextInputValue('birth_place');
    const alignment = interaction.fields.getTextInputValue('alignment').toLowerCase();

    const age = calculateAge(birthDateStr);
    if (age < 13) return interaction.reply({ content: "Erreur : Votre personnage doit avoir au moins 13 ans.", ephemeral: true });
    if (!['legal', 'illegal'].includes(alignment)) return interaction.reply({ content: "Erreur : L'orientation doit être 'legal' ou 'illegal'.", ephemeral: true });

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

      // Si le nom change -> Reset validation
      if (firstName !== oldChar.first_name || lastName !== oldChar.last_name) {
        status = 'pending';
        verifiedby = null;
        isNotified = false;
      }
      // Si alignement change -> Reset job
      if (alignment !== oldChar.alignment) job = 'unemployed';
    }

    const payload = {
      user_id: interaction.user.id,
      first_name: firstName,
      last_name: lastName,
      birth_date: birthDateStr,
      birth_place: birthPlace,
      age: age,
      alignment: alignment,
      status: status,
      job: job,
      is_notified: isNotified,
      verifiedby: verifiedby
    };

    const { error } = isEdit ? await updateCharacter(charId, payload) : await createCharacter(payload);

    if (error) {
      return interaction.reply({ content: "Erreur lors de l'enregistrement en base de données.", ephemeral: true });
    } else {
      return interaction.reply({ content: isEdit ? "Dossier citoyen mis à jour avec succès !" : "Dossier citoyen transmis pour validation !", ephemeral: true });
    }
  }
});

client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;
  await sendWelcomeTutorial(member);
  const acceptedChars = await getUserAcceptedCharacters(member.id);
  if (acceptedChars.length > 0) await handleVerification(client, member.id, acceptedChars);
  else {
    if (BOT_CONFIG.PROTECTED_GUILDS.includes(member.guild.id)) await kickUnverified(member);
    else if (member.guild.id === BOT_CONFIG.MAIN_SERVER_ID) await handleUnverified(client, member.id);
  }
});

client.login(process.env.DISCORD_TOKEN);

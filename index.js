
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
  calculateAge
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
  
  // 1. Mise à jour statut des douanes
  await updateCustomsStatus(client);

  // 2. Traitement des nouvelles validations
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
  setInterval(runScans, 300000); // 5 minutes
});

/* ================= ÉVÉNEMENTS D'INTERACTION ================= */

client.on("interactionCreate", async interaction => {
  
  // --- 1. COMMANDES SLASH ---
  if (interaction.isChatInputCommand()) {
    const { commandName, user } = interaction;

    if (commandName === "status") {
      const components = await getSSDComponents();
      return interaction.reply({ ...components, ephemeral: true });
    }

    if (commandName === "personnages") {
      await interaction.deferReply({ ephemeral: true });
      const allChars = await getAllUserCharacters(user.id);

      if (allChars.length === 0) {
        const embed = new EmbedBuilder()
          .setTitle("Aucun dossier trouvé")
          .setDescription("Vous ne possédez actuellement aucun dossier citoyen dans notre base de données.\n\nSouhaitez-vous en créer un maintenant ?")
          .setColor(BOT_CONFIG.COLORS.WARNING);
        
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('btn_create_char').setLabel('Créer mon premier dossier').setStyle(ButtonStyle.Success).setEmoji('📝')
        );
        return interaction.editReply({ embeds: [embed], components: [row] });
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_char_manage')
        .setPlaceholder('Sélectionner un citoyen à gérer');

      allChars.forEach(char => {
          selectMenu.addOptions(new StringSelectMenuOptionBuilder()
              .setLabel(`${char.first_name} ${char.last_name}`)
              .setDescription(`Status: ${char.status} | Job: ${char.job || 'Civil'}`)
              .setValue(char.id)
          );
      });

      const embed = new EmbedBuilder()
        .setTitle("Dossiers Citoyens")
        .setDescription("Sélectionnez l'un de vos personnages ci-dessous pour voir les détails ou modifier ses informations.")
        .setColor(BOT_CONFIG.COLORS.DARK_BLUE);

      return interaction.editReply({ 
        embeds: [embed], 
        components: [new ActionRowBuilder().addComponents(selectMenu)] 
      });
    }

    if (commandName === "verification") {
      await interaction.deferReply({ ephemeral: true });
      const acceptedChars = await getUserAcceptedCharacters(user.id);
      if (acceptedChars.length > 0) {
        await handleVerification(client, user.id, acceptedChars);
        return interaction.editReply({ content: "✅ Vos accès ont été synchronisés avec succès." });
      } else {
        await handleUnverified(client, user.id);
        return interaction.editReply({ content: "❌ Aucun personnage validé trouvé. Vos accès sont restreints." });
      }
    }

    if (commandName === "ssd") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return interaction.reply({ content: "Accès refusé.", ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });
      await updateCustomsStatus(client);
      return interaction.editReply({ content: "Statut des douanes envoyé dans le salon dédié." });
    }
  }

  // --- 2. BOUTONS & MENUS ---
  if (interaction.isButton()) {
    if (interaction.customId === 'btn_reload_ssd') {
      await interaction.deferUpdate();
      await updateCustomsStatus(client);
      return;
    }

    if (interaction.customId === 'btn_create_char') {
      return interaction.showModal(buildCharacterModal(false));
    }

    if (interaction.customId.startsWith('btn_edit_char_')) {
      const charId = interaction.customId.replace('btn_edit_char_', '');
      const char = await getCharacterById(charId);
      if (!char) return interaction.reply({ content: "Erreur récupération dossier.", ephemeral: true });
      return interaction.showModal(buildCharacterModal(true, char));
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_manage') {
    await interaction.deferUpdate();
    const charId = interaction.values[0];
    const char = await getCharacterById(charId);

    if (!char) return interaction.followUp({ content: "Dossier introuvable.", ephemeral: true });

    const statusEmoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
    const detailEmbed = new EmbedBuilder()
      .setTitle(`${char.first_name} ${char.last_name}`)
      .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
      .addFields(
        { name: "État Civil", value: `Né le ${char.birth_date} à ${char.birth_place}\nÂge: ${char.age} ans`, inline: true },
        { name: "Situation", value: `Orientation: ${char.alignment}\nStatus: ${statusEmoji} ${char.status}\nProfession: ${char.job || 'Aucune'}`, inline: true }
      )
      .setFooter({ text: `ID Dossier: ${char.id}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`btn_edit_char_${char.id}`)
        .setLabel('Modifier les informations')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✍️')
    );

    return interaction.editReply({ embeds: [detailEmbed], components: [row] });
  }

  // --- 3. SOUMISSION DES MODALS ---
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

    // Validation
    const age = calculateAge(fields.birth_date);
    if (age < 13) return interaction.reply({ content: "⚠️ Erreur : Le personnage doit avoir au moins 13 ans.", ephemeral: true });
    if (!['legal', 'illegal'].includes(fields.alignment)) return interaction.reply({ content: "⚠️ Erreur : L'orientation doit être 'legal' ou 'illegal'.", ephemeral: true });

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

      // Si le nom change -> Reset validation (Anti-abus)
      if (fields.first_name !== oldChar.first_name || fields.last_name !== oldChar.last_name) {
        status = 'pending';
        verifiedby = null;
        isNotified = false;
      }
      // Si alignement change -> Reset job
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
      return interaction.reply({ content: `❌ Erreur BDD: ${error.message}`, ephemeral: true });
    } else {
      const msg = isEdit ? "✅ Dossier citoyen mis à jour. (Une re-validation peut être requise si les noms ont changé)" : "✅ Premier dossier créé ! Il est maintenant en attente de validation par les douanes.";
      return interaction.reply({ content: msg, ephemeral: true });
    }
  }
});

/* ================= GESTION DES NOUVEAUX MEMBRES ================= */

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

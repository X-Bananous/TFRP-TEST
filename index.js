
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

async function runScans() {
  await updateCustomsStatus(client);
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

client.once("ready", async () => {
  console.log(`[SYSTEM] ${client.user.tag} OPERATIONNEL.`);

  const commands = [
    new SlashCommandBuilder().setName('personnages').setDescription('Gérer vos fiches citoyennes'),
    new SlashCommandBuilder().setName('status').setDescription('Statut détaillé des douanes'),
    new SlashCommandBuilder().setName('ssd').setDescription('Forcer l\'envoi du statut (Staff)')
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); } catch (e) { console.error(e); }

  runScans();
  setInterval(runScans, 300000); // 5 min
});

async function sendCharacterList(interaction, isUpdate = false) {
    const allChars = await getAllUserCharacters(interaction.user.id);
    const homeEmbed = getPersonnagesHomeEmbed(interaction.user.username);

    if (allChars.length === 0) {
      const embed = new EmbedBuilder().setTitle("AUCUN DOSSIER TROUVÉ").setDescription("Votre identité n'est pas répertoriée. Souhaitez-vous créer un dossier d'immigration ?").setColor(BOT_CONFIG.COLORS.WARNING);
      const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_create_char').setLabel('CRÉER MON PREMIER DOSSIER').setStyle(ButtonStyle.Success));
      return isUpdate ? interaction.editReply({ embeds: [embed], components: [row] }) : interaction.editReply({ embeds: [embed], components: [row] });
    }

    const selectMenu = new StringSelectMenuBuilder().setCustomId('select_char_manage').setPlaceholder('Sélectionner un citoyen');
    allChars.forEach(char => {
        selectMenu.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(`${char.first_name.toUpperCase()} ${char.last_name.toUpperCase()}`)
            .setDescription(`Status: ${char.status.toUpperCase()} | Job: ${(char.job || 'CIVIL').toUpperCase()}`)
            .setValue(char.id)
        );
    });

    const components = [new ActionRowBuilder().addComponents(selectMenu)];
    if (allChars.length < 1) { // Limite Panel
       components.push(new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('btn_create_char').setLabel('CRÉER UN NOUVEAU DOSSIER').setStyle(ButtonStyle.Success)));
    }

    return isUpdate ? interaction.editReply({ embeds: [homeEmbed], components: components }) : interaction.editReply({ embeds: [homeEmbed], components: components });
}

client.on("interactionCreate", async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === "status") {
      const components = await getSSDComponents();
      return interaction.reply({ ...components, ephemeral: true });
    }
    if (interaction.commandName === "personnages") {
      await interaction.deferReply({ ephemeral: true });
      await sendCharacterList(interaction);
    }
    if (interaction.commandName === "ssd") {
      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) return interaction.reply({ content: "ACCÈS REFUSÉ.", ephemeral: true });
      await interaction.deferReply({ ephemeral: true });
      await updateCustomsStatus(client);
      return interaction.editReply({ content: "STATUT DÉPLOYÉ." });
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
      first: interaction.fields.getTextInputValue('first_name'),
      last: interaction.fields.getTextInputValue('last_name'),
      birth: interaction.fields.getTextInputValue('birth_date'),
      place: interaction.fields.getTextInputValue('birth_place'),
      align: interaction.fields.getTextInputValue('alignment').toLowerCase()
    };

    const age = calculateAge(f.birth);
    if (age < 13) return interaction.reply({ content: "ERREUR : ÂGE MINIMUM 13 ANS.", ephemeral: true });
    if (!['legal', 'illegal'].includes(f.align)) return interaction.reply({ content: "ERREUR : ORIENTATION INVALIDE (legal/illegal).", ephemeral: true });

    let status = 'pending', job = 'unemployed', notified = false;
    if (isEdit) {
      const old = await getCharacterById(charId);
      status = old.status; job = old.job; notified = old.is_notified;
      if (f.first.toLowerCase() !== old.first_name.toLowerCase() || f.last.toLowerCase() !== old.last_name.toLowerCase()) {
        status = 'pending'; notified = false;
      }
      if (f.align !== old.alignment) job = 'unemployed';
    }

    const { error } = isEdit ? await updateCharacter(charId, { ...f, age, status, job, is_notified: notified }) : await createCharacter({ user_id: interaction.user.id, first_name: f.first, last_name: f.last, birth_date: f.birth, birth_place: f.place, alignment: f.align, age, status: 'pending', job: 'unemployed' });

    return interaction.reply({ content: error ? `ERREUR BDD : ${error.message}` : "DOSSIER TRAITÉ AVEC SUCCÈS.", ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);

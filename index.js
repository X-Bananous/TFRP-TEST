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
  PermissionFlagsBits,
  ActivityType
} from "discord.js";
import { createClient } from "@supabase/supabase-js";

/* ================= CONFIGURATION ================= */

const MAIN_SERVER_ID = "1279455759414857759";
const LOG_CHANNEL_ID = "1450962428492775505";
const SSD_LOG_CHANNEL_ID = "1454245706842771690"; // Salon rapport SSD quotidien
const SITE_URL = "https://x-bananous.github.io/tfrp/";
const COLOR_DARK_BLUE = 0x00008B;
const COLOR_ERROR = 0xCC0000;
const COLOR_WARNING = 0xFFA500;
const COLOR_SUCCESS = 0x00FF00;

const VERIFIED_ROLE_IDS = [
  "1450941712938696845",
  "1445853668246163668"
];

const UNVERIFIED_ROLE_ID = "1445853684696223846";

const JOB_ROLES = {
  "leo": "1445853630593761512",
  "lafd": "1445853634653982791",
  "ladot": "1445853641088045107"
};

const PROTECTED_GUILDS = [
  "1445066668018499820", 
  "1450962428492775505", 
  "1447982790967558196"
];

// SSD States
const SSD_STATUS = {
  INTERRUPTED: { label: "⚫ Interrompu", desc: "Vous ne pourrez avoir aucune réponse (Pannes, redémarrage, maintenance)." },
  SLOW: { label: "🔴 Ralenti", desc: "Le temps de réponse peut varier entre 48h et plus (Sous-effectifs ou surdemande >50)." },
  PERTURBED: { label: "🟠 Perturbé", desc: "Le temps de réponse est en moyenne de 24h à 48h (Surdemande >25)." },
  FLUID: { label: "🟢 Fluide", desc: "Le temps de réponse est inférieur à 24h (Généralement dans la journée)." },
  FAST: { label: "⚪ Fast Checking", desc: "Le temps de réponse est compris entre 5 et 10 minutes (Purge active)." }
};

let currentSSD = SSD_STATUS.FLUID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/* ================= FONCTIONS DB ================= */

async function markAsNotified(characterIds) {
  if (!characterIds || characterIds.length === 0) return;
  // Correction bug : utilisation de la colonne is_notified exacte
  const { error } = await supabase
    .from("characters")
    .update({ is_notified: true })
    .in("id", characterIds);
  
  if (error) console.error(`[DB ERROR] Échec mise à jour is_notified: ${error.message}`);
}

async function addWheelTurn(userId, amount = 1) {
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("whell_turn")
    .eq("id", userId)
    .single();

  if (fetchError) return;

  const newTurns = (profile.whell_turn || 0) + amount;
  await supabase
    .from("profiles")
    .update({ 
      whell_turn: newTurns,
      isnotified_wheel: false 
    })
    .eq("id", userId);
}

/* ================= LOGIQUE SSD ================= */

async function updateBotPresence() {
  client.user.setPresence({
    activities: [{ name: `SSD: ${currentSSD.label}`, type: ActivityType.Watching }],
    status: 'online',
  });
}

// Vérification de minuit pour le rapport SSD
setInterval(async () => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    const channel = await client.channels.fetch(SSD_LOG_CHANNEL_ID).catch(() => null);
    if (channel) {
      const ts = Math.floor(Date.now() / 1000);
      const embed = new EmbedBuilder()
        .setDescription(`**RAPPORT QUOTIDIEN DES DOUANES**\n\n> **Statut Actuel:** ${currentSSD.label}\n> **Détails:** ${currentSSD.desc}\n> **Mise à jour:** <t:${ts}:F>`)
        .setColor(COLOR_DARK_BLUE)
        .setFooter({ text: "TFRP Manager • Rapport Automatique" });
      channel.send({ embeds: [embed] });
    }
  }
}, 60000);

/* ================= NOTIFICATIONS & ACTIONS ================= */

async function handleVerification(userId, characters) {
  const toNotify = characters.filter(c => c.is_notified !== true);
  
  // Rôles
  let mainMember = null;
  try {
    const mainGuild = await client.guilds.fetch(MAIN_SERVER_ID).catch(() => null);
    if (mainGuild) {
      mainMember = await mainGuild.members.fetch(userId).catch(() => null);
      if (mainMember) {
        for (const roleId of VERIFIED_ROLE_IDS) {
          if (!mainMember.roles.cache.has(roleId)) await mainMember.roles.add(roleId).catch(() => {});
        }
        if (mainMember.roles.cache.has(UNVERIFIED_ROLE_ID)) await mainMember.roles.remove(UNVERIFIED_ROLE_ID).catch(() => {});
        for (const char of characters) {
          if (char.job && JOB_ROLES[char.job.toLowerCase()]) {
            const jobRoleId = JOB_ROLES[char.job.toLowerCase()];
            if (!mainMember.roles.cache.has(jobRoleId)) await mainMember.roles.add(jobRoleId).catch(() => {});
          }
        }
      }
    }
  } catch (err) {}

  if (toNotify.length === 0) return;

  const ts = Math.floor(Date.now() / 1000);
  
  for (const char of toNotify) {
    let verifiedByName = "Conseil des Douanes";
    if (char.verifiedby) {
      const { data: staffProfile } = await supabase.from("profiles").select("username").eq("id", char.verifiedby).maybeSingle();
      if (staffProfile) verifiedByName = staffProfile.username;
    }

    const description = `**CITOYENNETÉ APPROUVÉE**\n\n` +
      `> **Joueur:** <@${userId}>\n` +
      `> **Personnage:** ${char.first_name} ${char.last_name}\n` +
      `> **Profession:** ${char.job || 'Citoyen'}\n` +
      `> **Douanier:** ${verifiedByName}\n` +
      `> **Date:** <t:${ts}:F>`;

    const embed = new EmbedBuilder()
      .setDescription(description)
      .setColor(COLOR_SUCCESS)
      .setFooter({ text: "TFRP Manager • Douane de Los Angeles" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Accéder au Panel").setStyle(ButtonStyle.Link).setURL(SITE_URL)
    );

    if (mainMember) {
      try { await mainMember.send({ embeds: [embed], components: [row] }); } catch (e) {}
    }

    try {
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
      if (logChannel) await logChannel.send({ content: `<@${userId}>`, embeds: [embed], components: [row] });
    } catch (e) {}
  }

  await markAsNotified(toNotify.map(c => c.id));
}

async function handleUnverified(userId) {
  try {
    const mainGuild = await client.guilds.fetch(MAIN_SERVER_ID).catch(() => null);
    if (!mainGuild) return;
    const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
    if (!mainMember) return;

    if (!mainMember.roles.cache.has(UNVERIFIED_ROLE_ID)) await mainMember.roles.add(UNVERIFIED_ROLE_ID).catch(() => {});
    for (const roleId of VERIFIED_ROLE_IDS) {
      if (mainMember.roles.cache.has(roleId)) await mainMember.roles.remove(roleId).catch(() => {});
    }
    for (const jobRole of Object.values(JOB_ROLES)) {
      if (mainMember.roles.cache.has(jobRole)) await mainMember.roles.remove(jobRole).catch(() => {});
    }
  } catch (err) {}
}

async function kickUnverified(member) {
  if (member.user.bot || member.permissions.has(PermissionFlagsBits.Administrator) || !member.kickable) return;
  const embed = new EmbedBuilder()
    .setDescription(`**ACCÈS RESTREINT**\n\n> **Condition:** Votre fiche doit être 'Acceptée' sur le panel.\n> **Citoyen:** ${member.user.username}\n\nVeuillez régulariser votre situation sur notre plateforme.`)
    .setColor(COLOR_ERROR)
    .setFooter({ text: "TFRP Manager" });
  try { await member.send({ embeds: [embed] }); } catch (e) {}
  try { await member.kick("Automatique : Aucun personnage valide."); } catch (e) {}
}

/* ================= ÉVÉNEMENTS ================= */

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  if (!oldMember.premiumSince && newMember.premiumSince) {
    await addWheelTurn(newMember.id, 1);
    const embed = new EmbedBuilder()
      .setDescription(`**REMERCIEMENTS BOOST**\n\n> **Membre:** ${newMember.user.username}\n> **Cadeau:** 1 Clé de la Fortune (Lootbox)\n\nMerci pour votre soutien au projet TFRP !`)
      .setColor(0xF477EF)
      .setFooter({ text: "TFRP Manager" });
    try { await newMember.send({ embeds: [embed] }); } catch(e) {}
  }
});

client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;
  const embed = new EmbedBuilder()
    .setDescription(`**BIENVENUE CHEZ TFRP**\n\n> **Étape 1:** Création de fiche sur le site.\n> **Étape 2:** Validation par la douane.\n> **Étape 3:** Synchronisation automatique des rôles.`)
    .setColor(COLOR_DARK_BLUE)
    .setFooter({ text: "TFRP Manager" });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Accéder au Panel").setStyle(ButtonStyle.Link).setURL(SITE_URL)
  );
  try { await member.send({ embeds: [embed], components: [row] }); } catch (e) {}

  const { data: acceptedChars } = await supabase.from("characters").select("*").eq("user_id", member.id).eq("status", "accepted");
  if (acceptedChars && acceptedChars.length > 0) await handleVerification(member.id, acceptedChars);
  else {
    if (PROTECTED_GUILDS.includes(member.guild.id)) await kickUnverified(member);
    else if (member.guild.id === MAIN_SERVER_ID) await handleUnverified(member.id);
  }
});

client.once("ready", async () => {
  console.log(`[SYSTEM] ${client.user.tag} opérationnel.`);
  updateBotPresence();

  const commands = [
    new SlashCommandBuilder().setName('verification').setDescription('Force la mise à jour de vos accès'),
    new SlashCommandBuilder().setName('personnages').setDescription('Affiche vos fiches citoyennes'),
    new SlashCommandBuilder()
      .setName('ssd')
      .setDescription('Changer le statut SSD (Admin)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption(opt => opt.setName('statut').setDescription('Niveau de service').setRequired(true).addChoices(
        { name: 'Interrompu', value: 'INTERRUPTED' },
        { name: 'Ralenti', value: 'SLOW' },
        { name: 'Perturbé', value: 'PERTURBED' },
        { name: 'Fluide', value: 'FLUID' },
        { name: 'Fast Checking', value: 'FAST' }
      ))
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); } catch (e) { console.error(e); }

  setInterval(async () => {
    const { data: newChars } = await supabase.from("characters").select("*").eq("status", "accepted").or('is_notified.is.null,is_notified.eq.false');
    if (newChars && newChars.length > 0) {
      const charsByUser = {};
      newChars.forEach(c => {
        if (!charsByUser[c.user_id]) charsByUser[c.user_id] = [];
        charsByUser[c.user_id].push(c);
      });
      for (const userId in charsByUser) await handleVerification(userId, charsByUser[userId]);
    }
  }, 300000);
});

client.on("interactionCreate", async interaction => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_details') {
    await interaction.deferUpdate();
    const { data: char } = await supabase.from("characters").select("*").eq("id", interaction.values[0]).single();
    if (!char) return;
    
    let vName = "Non renseigné";
    if (char.verifiedby) {
        const { data: p } = await supabase.from("profiles").select("username").eq("id", char.verifiedby).maybeSingle();
        if (p) vName = p.username;
    }

    const embed = new EmbedBuilder()
      .setDescription(`**FICHE CITOYENNE : ${char.first_name} ${char.last_name}**\n\n` +
        `> **Âge:** ${char.age || '?'} ans\n` +
        `> **Métier:** ${char.job || 'Chômeur'}\n` +
        `> **Alignement:** ${char.alignment || 'Neutre'}\n` +
        `> **Permis:** ${char.driver_license_points}/12 pts\n` +
        `> **Douanier:** ${vName}`)
      .setColor(COLOR_DARK_BLUE)
      .setFooter({ text: `ID Fiche: ${char.id}` });
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const { commandName, options, user } = interaction;

  if (commandName === "ssd") {
    const key = options.getString('statut');
    currentSSD = SSD_STATUS[key];
    updateBotPresence();
    const embed = new EmbedBuilder()
      .setDescription(`**MISE À JOUR SSD**\n\n> **Nouveau Statut:** ${currentSSD.label}\n> **Impact:** ${currentSSD.desc}`)
      .setColor(COLOR_SUCCESS);
    return interaction.reply({ embeds: [embed] });
  }

  if (commandName === "verification") {
    await interaction.deferReply({ ephemeral: true });
    const { data: chars } = await supabase.from("characters").select("*").eq("user_id", user.id).eq("status", "accepted");
    if (chars && chars.length > 0) {
      await handleVerification(user.id, chars);
      return interaction.editReply({ content: "Synchronisation effectuée." });
    }
    await handleUnverified(user.id);
    return interaction.editReply({ content: "Aucun personnage accepté trouvé. Rôles mis à jour." });
  }

  if (commandName === "personnages") {
    await interaction.deferReply({ ephemeral: true });
    const { data: all } = await supabase.from("characters").select("*").eq("user_id", user.id);
    if (!all || all.length === 0) return interaction.editReply({ content: "Aucun dossier trouvé." });
    const menu = new StringSelectMenuBuilder().setCustomId('select_char_details').setPlaceholder('Sélectionner une fiche');
    all.slice(0, 25).forEach(c => {
      menu.addOptions(new StringSelectMenuOptionBuilder().setLabel(`${c.first_name} ${c.last_name}`).setValue(c.id).setEmoji(c.status === 'accepted' ? '✅' : '⏳'));
    });
    const embed = new EmbedBuilder().setDescription("**VOS PERSONNAGES**\n\nSélectionnez une fiche ci-dessous pour voir les détails.").setColor(COLOR_DARK_BLUE);
    return interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
  }
});

client.login(process.env.DISCORD_TOKEN);
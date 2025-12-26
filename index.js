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

const MAIN_SERVER_ID = "1279455759414857759"; // ID du Serveur Principal
const LOG_CHANNEL_ID = "1450962428492775505";
const SITE_URL = "https://x-bananous.github.io/tfrp/";
const COLOR_DARK_BLUE = 0x00008B;
const COLOR_ERROR = 0xCC0000;
const COLOR_WARNING = 0xFFA500;
const COLOR_SUCCESS = 0x00FF00;

// Rôles à donner quand on est VÉRIFIÉ (Liste)
const VERIFIED_ROLE_IDS = [
  "1450941712938696845",
  "1445853668246163668"
];

// Rôle à donner quand on est NON VÉRIFIÉ
const UNVERIFIED_ROLE_ID = "1445853684696223846";

// Configuration des rôles métiers (ID Discord sur le MAIN SERVER uniquement)
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

// SSD Statuses
const SSD_STATUS = {
  INTERRUPTED: { label: "⚫ Interrompu", desc: "Pannes, redémarrage ou maintenance." },
  SLOW: { label: "🔴 Ralenti", desc: "Sous-effectif ou surdemande (>50 WL)." },
  PERTURBED: { label: "🟠 Perturbé", desc: "Attente 24h-48h (surdemande >25)." },
  FLUID: { label: "🟢 Fluide", desc: "Réponse en moins de 24h." },
  FAST: { label: "⚪ Fast Checking", desc: "Réponse en 5-10 minutes (Purge active)." }
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

/* ================= FONCTIONS DE BASE DE DONNÉES ================= */

async function markAsNotified(characterIds) {
  if (!characterIds || characterIds.length === 0) return;
  const { error } = await supabase
    .from("characters")
    .update({ is_not_ified: true })
    .in("id", characterIds);
  
  if (error) console.error(`[DB ERROR] Échec mise à jour is_notified: ${error.message}`);
}

async function addWheelTurn(userId, amount = 1) {
  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("whell_turn")
    .eq("id", userId)
    .single();

  if (fetchError) return console.error(`[DB ERROR] Fetch profile for wheel: ${fetchError.message}`);

  const newTurns = (profile.whell_turn || 0) + amount;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      whell_turn: newTurns,
      isnotified_wheel: false // Force notification on next login
    })
    .eq("id", userId);

  if (updateError) console.error(`[DB ERROR] Update wheel turns: ${updateError.message}`);
}

/* ================= NOTIFICATIONS & ACTIONS ================= */

async function updateBotStatus() {
  client.user.setPresence({
    activities: [{ name: `SSD: ${currentSSD.label}`, type: ActivityType.Watching }],
    status: 'online',
  });
}

async function sendWelcomeTutorial(member) {
  const welcomeEmbed = new EmbedBuilder()
    .setTitle("Bienvenue chez TFRP")
    .setDescription(`Ravis de vous accueillir parmi nous, ${member.user.username}. Voici la marche à suivre pour nous rejoindre en jeu.`)
    .addFields(
      { name: "1. Création", value: "Rendez-vous sur notre site pour créer votre fiche personnage.", inline: false },
      { name: "2. Validation", value: "Une fois votre fiche créée, l'équipe examine votre demande.", inline: false },
      { name: "3. Accès", value: "Dès validation, vous recevrez vos accès automatiquement ici même.", inline: false }
    )
    .setColor(COLOR_DARK_BLUE)
    .setFooter({ text: "TFRP Manager" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Accéder au Panel").setStyle(ButtonStyle.Link).setURL(SITE_URL)
  );

  try {
    await member.send({ embeds: [welcomeEmbed], components: [row] });
  } catch (e) {
    // MP Fermés
  }
}

async function kickUnverified(member) {
  if (member.user.bot) return;
  if (member.permissions.has(PermissionFlagsBits.Administrator) || !member.kickable) return;

  const kickEmbed = new EmbedBuilder()
    .setTitle("Accès Restreint")
    .setDescription(`Désolé ${member.user.username}, l'accès à ${member.guild.name} est réservé aux citoyens ayant un personnage valide.`)
    .addFields(
      { name: "Condition", value: "Votre fiche personnage doit être marquée comme 'Acceptée' sur notre plateforme.", inline: false },
      { name: "Comment faire ?", value: `Inscrivez-vous sur le site et attendez la validation du staff.`, inline: false }
    )
    .setColor(COLOR_ERROR)
    .setFooter({ text: "TFRP Manager" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Créer mon Personnage").setStyle(ButtonStyle.Link).setURL(SITE_URL)
  );

  try { await member.send({ embeds: [kickEmbed], components: [row] }); } catch (e) {}
  try { await member.kick("Automatique : Aucun personnage valide."); } catch (e) {}
}

async function handleUnverified(userId) {
  try {
    const mainGuild = await client.guilds.fetch(MAIN_SERVER_ID).catch(() => null);
    if (!mainGuild) return;

    const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
    if (!mainMember) return;

    if (!mainMember.roles.cache.has(UNVERIFIED_ROLE_ID)) {
      await mainMember.roles.add(UNVERIFIED_ROLE_ID).catch(e => console.error(`[ROLE ERROR] Add Unverified: ${e.message}`));
    }

    for (const roleId of VERIFIED_ROLE_IDS) {
      if (mainMember.roles.cache.has(roleId)) {
        await mainMember.roles.remove(roleId).catch(e => console.error(`[ROLE ERROR] Remove Verified (${roleId}): ${e.message}`));
      }
    }
    
    for (const jobRole of Object.values(JOB_ROLES)) {
      if (mainMember.roles.cache.has(jobRole)) {
        await mainMember.roles.remove(jobRole).catch(e => console.error(`[ROLE ERROR] Remove Job (${jobRole}): ${e.message}`));
      }
    }
  } catch (err) {
    console.error(`[HANDLE UNVERIFIED] ${err.message}`);
  }
}

async function handleVerification(userId, characters) {
  const toNotify = characters.filter(c => c.is_notified !== true);
  
  // --- ÉTAPE 1 : GESTION DES RÔLES ---
  let mainMember = null;
  try {
    const mainGuild = await client.guilds.fetch(MAIN_SERVER_ID).catch(() => null);
    if (mainGuild) {
      mainMember = await mainGuild.members.fetch(userId).catch(() => null);
      if (mainMember) {
        for (const roleId of VERIFIED_ROLE_IDS) {
          if (!mainMember.roles.cache.has(roleId)) {
            await mainMember.roles.add(roleId).catch(e => console.error(`[ROLE ERROR] Add Verified (${roleId}): ${e.message}`));
          }
        }
        if (mainMember.roles.cache.has(UNVERIFIED_ROLE_ID)) {
          await mainMember.roles.remove(UNVERIFIED_ROLE_ID).catch(e => console.error(`[ROLE ERROR] Remove Unverified: ${e.message}`));
        }
        for (const char of characters) {
          if (char.job) {
            const jobKey = char.job.toLowerCase();
            if (JOB_ROLES[jobKey]) {
              const jobRoleId = JOB_ROLES[jobKey];
              if (!mainMember.roles.cache.has(jobRoleId)) {
                await mainMember.roles.add(jobRoleId).catch(e => console.error(`[ROLE ERROR] Add Job ${jobKey}: ${e.message}`));
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`[MAIN GUILD ERROR] ${err.message}`);
  }

  // --- ÉTAPE 2 : NOTIFICATIONS ---
  if (toNotify.length === 0) return;

  const ts = Math.floor(Date.now() / 1000);
  
  for (const char of toNotify) {
    // Récupérer les infos du douanier
    let verifiedByName = "Conseil des Douanes";
    if (char.verifiedby) {
      const { data: staffProfile } = await supabase.from("profiles").select("username").eq("id", char.verifiedby).maybeSingle();
      if (staffProfile) verifiedByName = staffProfile.username;
    }

    const logEmbed = new EmbedBuilder()
      .setTitle("Citoyenneté Approuvée")
      .setDescription(`Félicitations <@${userId}>, votre dossier a été validé par les Services de Douane.`)
      .addFields(
        { name: "👤 Personnage", value: `**${char.first_name} ${char.last_name}**`, inline: true },
        { name: "💼 Profession", value: `${char.job || 'Citoyen'}`, inline: true },
        { name: "👮 Douanier", value: `${verifiedByName}`, inline: true },
        { name: "📅 Date", value: `<t:${ts}:F>`, inline: false }
      )
      .setColor(COLOR_SUCCESS)
      .setThumbnail(mainMember ? mainMember.user.displayAvatarURL() : null)
      .setFooter({ text: "TFRP Manager • Douane de Los Angeles" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Accéder au Panel").setStyle(ButtonStyle.Link).setURL(SITE_URL)
    );

    // Envoi au joueur
    if (mainMember) {
      try { await mainMember.send({ embeds: [logEmbed], components: [row] }); } catch (e) {}
    }

    // Envoi dans le channel de logs
    try {
      const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
      if (logChannel) {
          await logChannel.send({ 
              content: `<@${userId}>`,
              embeds: [logEmbed],
              components: [row]
          });
      }
    } catch (e) {
      console.error(`[LOG ERROR] ${e.message}`);
    }
  }

  // --- ÉTAPE 3 : MISE À JOUR DB ---
  const idsToMark = toNotify.map(c => c.id);
  await markAsNotified(idsToMark);
}

/* ================= ÉVÉNEMENTS ================= */

client.on("guildMemberUpdate", async (oldMember, newMember) => {
  // Détection de boost
  const hadBoost = oldMember.premiumSince;
  const hasBoost = newMember.premiumSince;

  if (!hadBoost && hasBoost) {
    console.log(`[BOOST] ${newMember.user.username} vient de booster le serveur !`);
    await addWheelTurn(newMember.id, 1);
    
    const boostEmbed = new EmbedBuilder()
      .setTitle("Merci pour votre Boost !")
      .setDescription(`Toute l'équipe de TFRP vous remercie pour votre soutien.`)
      .addFields({ name: "🎁 Récompense", value: "Vous venez de recevoir **1 Clé de la Fortune** sur le panel !" })
      .setColor(0xF477EF) // Rose Nitro
      .setThumbnail(newMember.guild.iconURL());

    try { await newMember.send({ embeds: [boostEmbed] }); } catch(e) {}
  }
});

/* ================= INITIALISATION ================= */

client.once("ready", async () => {
  console.log(`[SYSTEM] ${client.user.tag} est opérationnel.`);
  updateBotStatus();

  const commands = [
    new SlashCommandBuilder()
      .setName('verification')
      .setDescription('Force la vérification de vos fiches personnages'),
    new SlashCommandBuilder()
      .setName('personnages')
      .setDescription('Affiche vos personnages et leurs détails'),
    new SlashCommandBuilder()
      .setName('ssd')
      .setDescription('Change le statut des services de douanes (Admin)')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addStringOption(option =>
        option.setName('statut')
          .setDescription('Nouveau statut SSD')
          .setRequired(true)
          .addChoices(
            { name: 'Interrompu', value: 'INTERRUPTED' },
            { name: 'Ralenti', value: 'SLOW' },
            { name: 'Perturbé', value: 'PERTURBED' },
            { name: 'Fluide', value: 'FLUID' },
            { name: 'Fast Checking', value: 'FAST' }
          ))
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { 
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); 
    console.log("[SYSTEM] Commandes Slash enregistrées.");
  } catch (e) { console.error(e); }

  setInterval(async () => {
    await scanNewValidations();
    await scanSecurityKick();
  }, 300000);
});

async function scanNewValidations() {
  const { data: newChars, error } = await supabase
    .from("characters")
    .select("*")
    .eq("status", "accepted")
    .or('is_notified.is.null,is_notified.eq.false');

  if (error || !newChars || newChars.length === 0) return;

  const charsByUser = {};
  newChars.forEach(c => {
    if (!charsByUser[c.user_id]) charsByUser[c.user_id] = [];
    charsByUser[c.user_id].push(c);
  });

  for (const userId in charsByUser) {
    await handleVerification(userId, charsByUser[userId]);
  }
}

async function scanSecurityKick() {
  for (const guildId of PROTECTED_GUILDS) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;
    try {
      const members = await guild.members.fetch();
      for (const [id, member] of members) {
        if (member.user.bot) continue;
        const { data: acceptedChars } = await supabase.from("characters").select("*").eq("user_id", id).eq("status", "accepted");
        if (!acceptedChars || acceptedChars.length === 0) await kickUnverified(member);
      }
    } catch (err) {}
  }
}

client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;
  await sendWelcomeTutorial(member);
  const { data: acceptedChars } = await supabase.from("characters").select("*").eq("user_id", member.id).eq("status", "accepted");
  if (acceptedChars && acceptedChars.length > 0) await handleVerification(member.id, acceptedChars);
  else {
    if (PROTECTED_GUILDS.includes(member.guild.id)) await kickUnverified(member);
    else if (member.guild.id === MAIN_SERVER_ID) await handleUnverified(member.id);
  }
});

client.on("interactionCreate", async interaction => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_details') {
    await interaction.deferUpdate();
    const charId = interaction.values[0];
    const { data: char, error } = await supabase.from("characters").select("*").eq("id", charId).single();
    if (error || !char) return interaction.followUp({ content: "Erreur récupération personnage.", ephemeral: true });

    let verifiedByName = "Non renseigné";
    if (char.verifiedby) {
        const { data: profile } = await supabase.from("profiles").select("username").eq("id", char.verifiedby).maybeSingle();
        if (profile) verifiedByName = profile.username;
    }

    const birthDate = char.birth_date ? new Date(char.birth_date).toLocaleDateString('fr-FR') : "Inconnue";
    const statusMap = { 'pending': 'En attente', 'accepted': 'Validé', 'rejected': 'Refusé' };
    const barStatus = char.bar_passed ? "Oui" : "Non";
    const createdDate = new Date(char.created_at).toLocaleDateString('fr-FR');

    const detailEmbed = new EmbedBuilder()
      .setTitle(`Fiche : ${char.first_name} ${char.last_name}`)
      .setColor(COLOR_DARK_BLUE)
      .addFields(
        { name: "🆔 Identité", value: `**Nom:** ${char.last_name}\n**Prénom:** ${char.first_name}\n**Âge:** ${char.age || '?'} ans`, inline: true },
        { name: "📍 Naissance", value: `**Date:** ${birthDate}\n**Lieu:** ${char.birth_place || 'Inconnu'}`, inline: true },
        { name: "📋 Statut", value: `**État:** ${statusMap[char.status]}\n**Métier:** ${char.job || 'Chômeur'}\n**Alignement:** ${char.alignment || 'Neutre'}`, inline: false },
        { name: "🚗 Permis & Légal", value: `**Points Permis:** ${char.driver_license_points}/12\n**Barreau:** ${barStatus}`, inline: true },
        { name: "⚖️ Douane", value: `**Validé par:** ${verifiedByName}`, inline: true },
        { name: "📅 Méta", value: `**Créé le:** ${createdDate}`, inline: true }
      )
      .setFooter({ text: `ID Fiche: ${char.id} • TFRP Manager` });

    await interaction.editReply({ embeds: [detailEmbed], components: [interaction.message.components[0]] });
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const { commandName, user, options } = interaction;

  try {
      if (commandName === "ssd") {
        const statusKey = options.getString('statut');
        currentSSD = SSD_STATUS[statusKey];
        await updateBotStatus();
        
        const ssdEmbed = new EmbedBuilder()
          .setTitle("Mise à jour du SSD")
          .setDescription(`Le Statut des Services de Douanes a été modifié.\n\n**Nouveau Statut:** ${currentSSD.label}\n**Effet:** ${currentSSD.desc}`)
          .setColor(statusKey === 'FLUID' || statusKey === 'FAST' ? COLOR_SUCCESS : COLOR_WARNING)
          .setTimestamp();

        return interaction.reply({ embeds: [ssdEmbed] });
      }

      if (commandName === "verification") {
        await interaction.deferReply({ ephemeral: true });
        const { data: acceptedChars } = await supabase.from("characters").select("*").eq("user_id", user.id).eq("status", "accepted");
        if (acceptedChars && acceptedChars.length > 0) {
          const hasNew = acceptedChars.some(c => c.is_notified !== true);
          await handleVerification(user.id, acceptedChars);
          return interaction.editReply({ content: hasNew ? "Vos accès ont été mis à jour." : "Votre compte est déjà à jour (Rôles vérifiés)." });
        } else {
          await handleUnverified(user.id);
          return interaction.editReply({ content: "Aucun personnage accepté trouvé. Rôles synchronisés." });
        }
      }

      if (commandName === "personnages") {
        await interaction.deferReply({ ephemeral: true });
        const { data: allChars } = await supabase.from("characters").select("*").eq("user_id", user.id);
        if (!allChars || allChars.length === 0) return interaction.editReply({ content: "Aucun personnage enregistré." });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('select_char_details').setPlaceholder('Voir les détails');
        allChars.slice(0, 25).forEach(char => {
            const emoji = char.status === 'accepted' ? '✅' : (char.status === 'rejected' ? '❌' : '⏳');
            selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel(`${char.first_name} ${char.last_name}`).setDescription(`Métier: ${char.job || 'Aucun'}`).setValue(char.id).setEmoji(emoji));
        });

        const row = new ActionRowBuilder().addComponents(selectMenu);
        const embed = new EmbedBuilder().setTitle("Vos Personnages TFRP").setColor(COLOR_DARK_BLUE).setFooter({ text: "TFRP Manager" });
        return interaction.editReply({ embeds: [embed], components: [row] });
      }
  } catch (e) {
      console.error("Interaction Error:", e);
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: "Erreur technique." }).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);
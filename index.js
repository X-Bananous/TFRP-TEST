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
import { createClient } from "@supabase/supabase-js";

/* ================= CONFIGURATION ================= */

const MAIN_SERVER_ID = "1279455759414857759"; // ID du Serveur Principal
const LOG_CHANNEL_ID = "1450962428492775505";
const SITE_URL = "https://x-bananous.github.io/tfrp/";
const COLOR_DARK_BLUE = 0x00008B;
const COLOR_ERROR = 0xCC0000;
const COLOR_WARNING = 0xFFA500;

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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages
  ]
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

/* ================= FONCTIONS DE BASE DE DONNÉES ================= */

async function markAsNotified(characterIds) {
  if (!characterIds || characterIds.length === 0) return;
  const { error } = await supabase
    .from("characters")
    .update({ is_notified: true })
    .in("id", characterIds);
  
  if (error) console.error(`[DB ERROR] Échec mise à jour is_notified: ${error.message}`);
}

/* ================= NOTIFICATIONS & ACTIONS ================= */

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
    // Ignorer si MP fermés
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

/**
 * Gère le cas d'un utilisateur NON VÉRIFIÉ sur le serveur principal.
 * Ajoute le rôle Non Vérifié et retire les rôles Vérifié.
 */
async function handleUnverified(userId) {
  try {
    const mainGuild = await client.guilds.fetch(MAIN_SERVER_ID).catch(() => null);
    if (!mainGuild) return;

    const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
    if (!mainMember) return;

    // Ajouter le rôle NON VÉRIFIÉ
    if (!mainMember.roles.cache.has(UNVERIFIED_ROLE_ID)) {
      await mainMember.roles.add(UNVERIFIED_ROLE_ID).catch(e => console.error(`[ROLE ERROR] Add Unverified: ${e.message}`));
    }

    // Retirer les rôles VÉRIFIÉ
    for (const roleId of VERIFIED_ROLE_IDS) {
      if (mainMember.roles.cache.has(roleId)) {
        await mainMember.roles.remove(roleId).catch(e => console.error(`[ROLE ERROR] Remove Verified (${roleId}): ${e.message}`));
      }
    }
    
    // Retirer les rôles métiers par sécurité
    for (const jobRole of Object.values(JOB_ROLES)) {
      if (mainMember.roles.cache.has(jobRole)) {
        await mainMember.roles.remove(jobRole).catch(e => console.error(`[ROLE ERROR] Remove Job (${jobRole}): ${e.message}`));
      }
    }

  } catch (err) {
    console.error(`[HANDLE UNVERIFIED] ${err.message}`);
  }
}

/**
 * Coeur du système : Gère les rôles et les notifications pour un User ID donné
 */
async function handleVerification(userId, characters) {
  const toNotify = characters.filter(c => c.is_notified !== true);
  
  // --- ÉTAPE 1 : GESTION DES RÔLES SUR LE SERVEUR PRINCIPAL ---
  let mainMember = null;
  try {
    const mainGuild = await client.guilds.fetch(MAIN_SERVER_ID).catch(() => null);
    
    if (mainGuild) {
      mainMember = await mainGuild.members.fetch(userId).catch(() => null);

      if (mainMember) {
        // 1. Gestion des rôles "Vérifié" (Ajout Verified / Retrait Unverified)
        
        // Ajouter les rôles VÉRIFIÉS
        for (const roleId of VERIFIED_ROLE_IDS) {
          if (!mainMember.roles.cache.has(roleId)) {
            await mainMember.roles.add(roleId).catch(e => console.error(`[ROLE ERROR] Add Verified (${roleId}): ${e.message}`));
          }
        }

        // Retirer le rôle NON VÉRIFIÉ
        if (mainMember.roles.cache.has(UNVERIFIED_ROLE_ID)) {
          await mainMember.roles.remove(UNVERIFIED_ROLE_ID).catch(e => console.error(`[ROLE ERROR] Remove Unverified: ${e.message}`));
        }

        // 2. Rôles Métiers
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

  // --- ÉTAPE 2 : NOTIFICATIONS (LOGS + MP) ---
  if (toNotify.length === 0) return;

  const ts = Math.floor(Date.now() / 1000);
  const charList = toNotify.map(c => `- **${c.first_name} ${c.last_name}** (${c.job || 'Citoyen'})`).join("\n");
  
  const logEmbed = new EmbedBuilder().setFooter({ text: "TFRP Manager" });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Voir sur le panel").setStyle(ButtonStyle.Link).setURL(SITE_URL)
  );

  if (mainMember) {
    logEmbed.setTitle("Citoyenneté Validée")
            .setDescription(`Le joueur <@${userId}> vient d'être authentifié avec succès.`)
            .setColor(COLOR_DARK_BLUE)
            .setThumbnail(mainMember.user.displayAvatarURL());
    
    try { await mainMember.send({ embeds: [logEmbed], components: [row] }); } catch (e) {}

  } else {
    logEmbed.setTitle("Personnage validé, mais utilisateur inconnu")
            .setDescription(`Les personnages ci-dessous ont été validés, mais le compte Discord <@${userId}> est **introuvable** sur le serveur principal.`)
            .setColor(COLOR_WARNING);
  }

  logEmbed.addFields(
    { name: "Personnage(s) détecté(s)", value: charList, inline: false },
    { name: "Validé le", value: `<t:${ts}:F>`, inline: false }
  );

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

  // --- ÉTAPE 3 : MISE À JOUR DB ---
  const idsToMark = toNotify.map(c => c.id);
  await markAsNotified(idsToMark);
}

/**
 * Scan des nouveaux personnages en base de données
 */
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

/**
 * Scan de sécurité sur les serveurs protégés
 */
async function scanSecurityKick() {
  for (const guildId of PROTECTED_GUILDS) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;

    try {
      const members = await guild.members.fetch();
      for (const [id, member] of members) {
        if (member.user.bot) continue;

        const { data: acceptedChars } = await supabase
          .from("characters")
          .select("*")
          .eq("user_id", id)
          .eq("status", "accepted");
        
        if (!acceptedChars || acceptedChars.length === 0) {
           await kickUnverified(member);
        } else {
           await handleVerification(id, acceptedChars);
        }
      }
    } catch (err) { console.error(`Erreur scan security ${guildId}: ${err.message}`); }
  }
}

/* ================= INITIALISATION ================= */

client.once("ready", async () => {
  console.log(`[SYSTEM] ${client.user.tag} est opérationnel.`);

  const commands = [
    new SlashCommandBuilder()
      .setName('verification')
      .setDescription('Force la vérification de vos fiches personnages'),
    new SlashCommandBuilder()
      .setName('personnages')
      .setDescription('Affiche vos personnages et leurs détails')
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { 
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); 
    console.log("[SYSTEM] Commandes Slash enregistrées.");
  } catch (e) { console.error(e); }

  setInterval(async () => {
    console.log("[SCAN] Exécution des tâches planifiées...");
    await scanNewValidations();
    await scanSecurityKick();
  }, 300000);
});

/* ================= ÉVÉNEMENTS ================= */

client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;

  await sendWelcomeTutorial(member);

  const { data: acceptedChars } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", member.id)
    .eq("status", "accepted");

  if (acceptedChars && acceptedChars.length > 0) {
    await handleVerification(member.id, acceptedChars);
  } else {
    // Si pas de perso, gestion selon le serveur
    if (PROTECTED_GUILDS.includes(member.guild.id)) {
      await kickUnverified(member);
    } else if (member.guild.id === MAIN_SERVER_ID) {
      // Sur le serveur principal, on donne le rôle non vérifié
      await handleUnverified(member.id);
    }
  }
});

client.on("interactionCreate", async interaction => {
  // Gestion du Select Menu (Détails Personnage)
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_details') {
    await interaction.deferUpdate();
    
    const charId = interaction.values[0];
    
    const { data: char, error } = await supabase
      .from("characters")
      .select("*")
      .eq("id", charId)
      .single();

    if (error || !char) {
      return interaction.followUp({ content: "Erreur lors de la récupération du personnage.", ephemeral: true });
    }

    // Récupération du nom du staff ayant vérifié
    let verifiedByName = "Non renseigné";
    if (char.verifiedby) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", char.verifiedby)
            .maybeSingle();
        
        if (profile) {
            // On essaie plusieurs champs possibles pour le nom
            verifiedByName = profile.username || profile.full_name || (profile.first_name ? `${profile.first_name} ${profile.last_name}` : null) || "Staff Inconnu";
        }
    }

    // Formatage des données
    const birthDate = char.birth_date ? new Date(char.birth_date).toLocaleDateString('fr-FR') : "Inconnue";
    const statusMap = { 'pending': 'En attente', 'accepted': 'Validé', 'rejected': 'Refusé' };
    const statusText = statusMap[char.status] || char.status;
    const barStatus = char.bar_passed ? "Oui" : "Non";
    const createdDate = new Date(char.created_at).toLocaleDateString('fr-FR');

    const detailEmbed = new EmbedBuilder()
      .setTitle(`Fiche : ${char.first_name} ${char.last_name}`)
      .setColor(COLOR_DARK_BLUE)
      .addFields(
        { name: "🆔 Identité", value: `**Nom:** ${char.last_name}\n**Prénom:** ${char.first_name}\n**Âge:** ${char.age || '?'} ans`, inline: true },
        { name: "📍 Naissance", value: `**Date:** ${birthDate}\n**Lieu:** ${char.birth_place || 'Inconnu'}`, inline: true },
        { name: "📋 Statut", value: `**État:** ${statusText}\n**Métier:** ${char.job || 'Chômeur'}\n**Alignement:** ${char.alignment || 'Neutre'}`, inline: false },
        { name: "🚗 Permis & Légal", value: `**Points Permis:** ${char.driver_license_points}/12\n**Barreau:** ${barStatus}`, inline: true },
        { name: "⚖️ Douane", value: `**Validé par:** ${verifiedByName}`, inline: true },
        { name: "📅 Méta", value: `**Créé le:** ${createdDate}`, inline: true }
      )
      .setFooter({ text: `ID Fiche: ${char.id} • TFRP Manager` });

    await interaction.editReply({ embeds: [detailEmbed], components: [interaction.message.components[0]] }); // On garde le menu pour changer de perso
    return;
  }

  // Gestion des Commandes Slash
  if (!interaction.isChatInputCommand()) return;
  const { commandName, user } = interaction;

  try {
      if (commandName === "verification") {
        await interaction.deferReply({ ephemeral: true });

        const { data: acceptedChars, error } = await supabase
            .from("characters")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "accepted");

        if (error) throw error;

        if (acceptedChars && acceptedChars.length > 0) {
          const hasNew = acceptedChars.some(c => c.is_notified !== true);
          await handleVerification(user.id, acceptedChars);

          const responseEmbed = new EmbedBuilder()
            .setColor(COLOR_DARK_BLUE)
            .setFooter({ text: "TFRP Manager" })
            .setTitle("Vérification de compte");

          if (!hasNew) {
            responseEmbed.setDescription("Votre compte est déjà à jour (Rôles vérifiés).");
          } else {
            responseEmbed.setDescription("Vos accès ont été mis à jour.");
          }
          return interaction.editReply({ embeds: [responseEmbed] });
        } else {
          // Si pas de perso accepté, on applique le statut Non Vérifié
          await handleUnverified(user.id);
          
          const errorEmbed = new EmbedBuilder()
            .setColor(COLOR_ERROR)
            .setFooter({ text: "TFRP Manager" })
            .setDescription("Aucun personnage accepté trouvé. Vos rôles ont été mis à jour en conséquence.");
          
          return interaction.editReply({ embeds: [errorEmbed] });
        }
      }

      if (commandName === "personnages") {
        await interaction.deferReply({ ephemeral: true });

        const { data: allChars, error } = await supabase
            .from("characters")
            .select("*")
            .eq("user_id", user.id);

        if (error || !allChars || allChars.length === 0) {
          return interaction.editReply({ content: "Aucun personnage enregistré sur la plateforme." });
        }

        // Création du Menu Déroulant
        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('select_char_details')
          .setPlaceholder('Sélectionnez un personnage pour voir les détails');

        // On limite à 25 options (limite Discord)
        allChars.slice(0, 25).forEach(char => {
            const statusEmoji = char.status === 'accepted' ? '✅' : (char.status === 'rejected' ? '❌' : '⏳');
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel(`${char.first_name} ${char.last_name}`)
                    .setDescription(`Métier: ${char.job || 'Aucun'} | Statut: ${char.status}`)
                    .setValue(char.id)
                    .setEmoji(statusEmoji)
            );
        });

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
          .setTitle("Vos Personnages TFRP")
          .setDescription("Utilisez le menu ci-dessous pour afficher la fiche complète d'un de vos personnages.")
          .setColor(COLOR_DARK_BLUE)
          .setFooter({ text: "TFRP Manager" });

        return interaction.editReply({ embeds: [embed], components: [row] });
      }
  } catch (e) {
      console.error("Interaction Error:", e);
      if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ content: "Une erreur technique est survenue." }).catch(() => {});
      }
  }
});

client.login(process.env.DISCORD_TOKEN);

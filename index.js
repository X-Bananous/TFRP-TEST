
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

  if (toNotify.length === 0) return;

  const staffIds = [...new Set(toNotify.map(c => c.verifiedby).filter(id => !!id))];
  let staffProfiles = [];
  if (staffIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id, username").in("id", staffIds);
    staffProfiles = data || [];
  }

  const ts = Math.floor(Date.now() / 1000);
  const charList = toNotify.map(c => {
    const staff = staffProfiles.find(s => s.id === c.verifiedby);
    const staffName = staff ? staff.username : "Un douanier";
    return `- **${c.first_name} ${c.last_name}** (${c.job || 'Citoyen'}) • *Validé par ${staffName}*`;
  }).join("\n");
  
  const logEmbed = new EmbedBuilder()
    .setTitle("Citoyenneté Validée")
    .setColor(COLOR_DARK_BLUE)
    .setFooter({ text: "TFRP Manager" })
    .addFields(
        { name: "Personnage(s) détecté(s)", value: charList, inline: false },
        { name: "Validé le", value: `<t:${ts}:F>`, inline: false }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Accéder au Panel").setStyle(ButtonStyle.Link).setURL(SITE_URL)
  );

  if (mainMember) {
    logEmbed.setDescription(`Le joueur <@${userId}> vient d'être authentifié avec succès.`)
            .setThumbnail(mainMember.user.displayAvatarURL());
    try { await mainMember.send({ embeds: [logEmbed], components: [row] }); } catch (e) {}
  } else {
    logEmbed.setTitle("Validation Citoyenne")
            .setDescription(`Les personnages ci-dessous ont été validés, mais le compte Discord <@${userId}> est introuvable sur le serveur principal.`)
            .setColor(COLOR_WARNING);
  }

  try {
    const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
    if (logChannel) {
        await logChannel.send({ content: `<@${userId}>`, embeds: [logEmbed], components: [row] });
    }
  } catch (e) { console.error(`[LOG ERROR] ${e.message}`); }

  const idsToMark = toNotify.map(c => c.id);
  await markAsNotified(idsToMark);
}

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
  } catch (e) { console.error(e); }

  setInterval(async () => {
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
    if (PROTECTED_GUILDS.includes(member.guild.id)) {
      await kickUnverified(member);
    } else if (member.guild.id === MAIN_SERVER_ID) {
      await handleUnverified(member.id);
    }
  }
});

client.on("interactionCreate", async interaction => {
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_details') {
    await interaction.deferUpdate();
    const charId = interaction.values[0];
    const { data: char, error } = await supabase.from("characters").select("*").eq("id", charId).single();

    if (error || !char) return interaction.followUp({ content: "Erreur récupération fiche.", ephemeral: true });

    let verifiedByName = "Non renseigné";
    if (char.verifiedby) {
        const { data: profile } = await supabase.from("profiles").select("username").eq("id", char.verifiedby).maybeSingle();
        if (profile) verifiedByName = profile.username;
    }

    const birthDate = char.birth_date ? new Date(char.birth_date).toLocaleDateString('fr-FR') : "Inconnue";
    const statusMap = { 'pending': 'En attente', 'accepted': 'Validé', 'rejected': 'Refusé' };
    const barStatus = char.bar_passed ? "Oui" : "Non";

    const detailEmbed = new EmbedBuilder()
      .setTitle(`Fiche : ${char.first_name} ${char.last_name}`)
      .setColor(COLOR_DARK_BLUE)
      .addFields(
        { name: "Identité", value: `**Nom:** ${char.last_name}\n**Prénom:** ${char.first_name}\n**Âge:** ${char.age || '?'} ans`, inline: false },
        { name: "Naissance", value: `**Date:** ${birthDate}\n**Lieu:** ${char.birth_place || 'Inconnu'}`, inline: false },
        { name: "Statut", value: `**État:** ${statusMap[char.status] || char.status}\n**Métier:** ${char.job || 'Chômeur'}\n**Alignement:** ${char.alignment || 'Neutre'}`, inline: false },
        { name: "Permis & Légal", value: `**Points Permis:** ${char.driver_license_points}/12\n**Barreau:** ${barStatus}`, inline: false },
        { name: "Douane", value: `**Validé par:** ${verifiedByName}`, inline: false }
      )
      .setFooter({ text: `Réf: ${char.id} • TFRP Manager` });

    await interaction.editReply({ embeds: [detailEmbed] }); 
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const { commandName, user } = interaction;

  try {
      if (commandName === "verification") {
        await interaction.deferReply({ ephemeral: true });
        const { data: acceptedChars } = await supabase.from("characters").select("*").eq("user_id", user.id).eq("status", "accepted");

        if (acceptedChars && acceptedChars.length > 0) {
          const hasNew = acceptedChars.some(c => c.is_notified !== true);
          await handleVerification(user.id, acceptedChars);
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLOR_DARK_BLUE).setDescription(hasNew ? "Vos accès ont été mis à jour." : "Votre compte est déjà à jour.")] });
        } else {
          await handleUnverified(user.id);
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(COLOR_ERROR).setDescription("Aucun personnage accepté trouvé.")] });
        }
      }

      if (commandName === "personnages") {
        await interaction.deferReply({ ephemeral: true });
        const { data: allChars } = await supabase.from("characters").select("*").eq("user_id", user.id);

        if (!allChars || allChars.length === 0) return interaction.editReply({ content: "Aucun personnage enregistré." });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('select_char_details').setPlaceholder('Choisir un personnage');
        allChars.slice(0, 25).forEach(char => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder()
                .setLabel(`${char.first_name} ${char.last_name}`)
                .setDescription(`Métier: ${char.job || 'Aucun'} | Statut: ${char.status}`)
                .setValue(char.id)
            );
        });

        const embed = new EmbedBuilder().setTitle("Vos Personnages").setDescription("Sélectionnez une fiche pour voir les détails.").setColor(COLOR_DARK_BLUE);
        return interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
      }
  } catch (e) {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: "Erreur technique." }).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);

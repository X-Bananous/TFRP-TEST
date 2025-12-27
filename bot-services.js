
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ActivityType } from "discord.js";
import { BOT_CONFIG } from "./bot-config.js";
import { supabase, markAsNotified, getProfile, getPendingCharactersCount } from "./bot-db.js";

/**
 * Détermine le statut des douanes et envoie l'embed dans le salon dédié
 */
export async function updateCustomsStatus(client, forcePost = false) {
  const pendingCount = await getPendingCharactersCount();
  
  let statusEmoji = "🟢";
  let statusLabel = "Fluide";
  let statusColor = BOT_CONFIG.COLORS.SUCCESS;
  let statusDesc = "Le temps de réponse est inférieur à 24h, vous recevrez la réponse généralement dans la journée où vous avez envoyé la demande.";

  if (pendingCount > 50) {
    statusEmoji = "🔴";
    statusLabel = "Ralenti";
    statusColor = BOT_CONFIG.COLORS.ERROR;
    statusDesc = "Le temps de réponse peut varier entre 48h et plus (Actif en cas de sous-effectifs ou surdemande de WL >50)";
  } else if (pendingCount > 25) {
    statusEmoji = "🟠";
    statusLabel = "Perturbé";
    statusColor = BOT_CONFIG.COLORS.WARNING;
    statusDesc = "Le temps de réponse est en moyenne de 24h à 48h en fonction des demandes reçues (Actif en cas de surdemande >25)";
  }

  // Mise à jour de l'activité du bot
  client.user.setActivity({
    name: `Douanes: ${statusEmoji} ${statusLabel} (${pendingCount} attente)`,
    type: ActivityType.Watching
  });

  if (!forcePost) return;

  const ssdEmbed = new EmbedBuilder()
    .setTitle("Statut des Services de Douanes (SSD)")
    .setColor(statusColor)
    .setDescription(`**État actuel : ${statusEmoji} ${statusLabel}**\n\n${statusDesc}`)
    .addFields(
      { name: "📊 File d'attente", value: `\`${pendingCount}\` fiches en attente de traitement.`, inline: true },
      { name: "🕒 Dernière mise à jour", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: "\u200B", value: "---" },
      { 
        name: "Légende des statuts", 
        value: 
          "⚫ **Interrompu** - Maintenance ou panne du système.\n" +
          "🔴 **Ralenti** - Délai > 48h (Surcharge ou sous-effectif).\n" +
          "🟠 **Perturbé** - Délai 24h à 48h (Forte activité).\n" +
          "🟢 **Fluide** - Délai < 24h (Activité normale).\n" +
          "⚪ **Fast Checking** - Réponse en 5-10 min (Mobilisation staff)."
      }
    )
    .setFooter({ text: "TFRP Customs Management System" })
    .setTimestamp();

  try {
    const channel = await client.channels.fetch(BOT_CONFIG.CUSTOMS_CHANNEL_ID);
    if (channel) {
      await channel.send({ embeds: [ssdEmbed] });
    }
  } catch (e) {
    console.error(`[SSD ERROR] Impossible d'envoyer le statut: ${e.message}`);
  }
}

/**
 * Envoie le tutoriel de bienvenue par MP
 */
export async function sendWelcomeTutorial(member) {
  const welcomeEmbed = new EmbedBuilder()
    .setTitle("Bienvenue chez TFRP")
    .setDescription(`Ravis de vous accueillir parmi nous, ${member.user.username}. Voici la marche à suivre pour nous rejoindre en jeu.`)
    .addFields(
      { name: "1. Création", value: "Rendez-vous sur notre site pour créer votre fiche personnage.", inline: false },
      { name: "2. Validation", value: "Une fois votre fiche créée, l'équipe examine votre demande.", inline: false },
      { name: "3. Accès", value: "Dès validation, vous recevrez vos accès automatiquement ici même.", inline: false }
    )
    .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
    .setFooter({ text: "TFRP Manager" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Accéder au Panel").setStyle(ButtonStyle.Link).setURL(BOT_CONFIG.SITE_URL)
  );

  try { await member.send({ embeds: [welcomeEmbed], components: [row] }); } catch (e) {}
}

/**
 * Expulse un membre sans personnage valide des serveurs protégés
 */
export async function kickUnverified(member) {
  if (member.user.bot) return;
  if (member.permissions.has(PermissionFlagsBits.Administrator) || !member.kickable) return;

  const kickEmbed = new EmbedBuilder()
    .setTitle("Accès Restreint")
    .setDescription(`Désolé ${member.user.username}, l'accès à ${member.guild.name} est réservé aux citoyens ayant un personnage valide.`)
    .addFields(
      { name: "Condition", value: "Votre fiche personnage doit être marquée comme 'Acceptée' sur notre plateforme.", inline: false }
    )
    .setColor(BOT_CONFIG.COLORS.ERROR)
    .setFooter({ text: "TFRP Manager" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Créer mon Personnage").setStyle(ButtonStyle.Link).setURL(BOT_CONFIG.SITE_URL)
  );

  try { await member.send({ embeds: [kickEmbed], components: [row] }); } catch (e) {}
  try { await member.kick("Automatique : Aucun personnage valide."); } catch (e) {}
}

/**
 * Retire les rôles de citoyen et ajoute le rôle "Non vérifié"
 */
export async function handleUnverified(client, userId) {
  try {
    const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
    if (!mainGuild) return;

    const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
    if (!mainMember) return;

    if (!mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) {
      await mainMember.roles.add(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
    }

    for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) {
      if (mainMember.roles.cache.has(roleId)) await mainMember.roles.remove(roleId).catch(() => {});
    }
    
    for (const jobRole of Object.values(BOT_CONFIG.JOB_ROLES)) {
      if (mainMember.roles.cache.has(jobRole)) await mainMember.roles.remove(jobRole).catch(() => {});
    }
  } catch (err) { console.error(`[Service] handleUnverified: ${err.message}`); }
}

/**
 * Gère l'attribution des rôles et les logs de validation
 */
export async function handleVerification(client, userId, characters) {
  const toNotify = characters.filter(c => c.is_notified !== true);
  let mainMember = null;

  try {
    const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
    if (mainGuild) {
      mainMember = await mainGuild.members.fetch(userId).catch(() => null);
      if (mainMember) {
        // Attribution rôles citoyens
        for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) {
          if (!mainMember.roles.cache.has(roleId)) await mainMember.roles.add(roleId).catch(() => {});
        }
        // Nettoyage rôle unverified
        if (mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) {
          await mainMember.roles.remove(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
        }
        // Rôles métiers
        for (const char of characters) {
          if (char.job && BOT_CONFIG.JOB_ROLES[char.job.toLowerCase()]) {
            const roleId = BOT_CONFIG.JOB_ROLES[char.job.toLowerCase()];
            if (!mainMember.roles.cache.has(roleId)) await mainMember.roles.add(roleId).catch(() => {});
          }
        }
      }
    }
  } catch (err) { console.error(`[Service] handleVerification roles: ${err.message}`); }

  if (toNotify.length === 0) return;

  // Préparation du Log
  const staffIds = [...new Set(toNotify.map(c => c.verifiedby).filter(id => !!id))];
  const staffProfiles = staffIds.length > 0 ? (await supabase.from("profiles").select("id, username").in("id", staffIds)).data || [] : [];

  const charList = toNotify.map(c => {
    const staff = staffProfiles.find(s => s.id === c.verifiedby);
    return `- **${c.first_name} ${c.last_name}** (${c.job || 'Citoyen'}) • *Validé par ${staff?.username || 'Un douanier'}*`;
  }).join("\n");
  
  const logEmbed = new EmbedBuilder()
    .setTitle("Citoyenneté Validée")
    .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
    .addFields(
        { name: "Personnage(s) détecté(s)", value: charList, inline: false },
        { name: "Validé le", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
    )
    .setFooter({ text: "TFRP Manager" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Accéder au Panel").setStyle(ButtonStyle.Link).setURL(BOT_CONFIG.SITE_URL)
  );

  if (mainMember) {
    logEmbed.setDescription(`Le joueur <@${userId}> vient d'être authentifié avec succès.`).setThumbnail(mainMember.user.displayAvatarURL());
    try { await mainMember.send({ embeds: [logEmbed], components: [row] }); } catch (e) {}
  }

  try {
    const logChannel = await client.channels.fetch(BOT_CONFIG.LOG_CHANNEL_ID);
    if (logChannel) await logChannel.send({ content: `<@${userId}>`, embeds: [logEmbed], components: [row] });
  } catch (e) {}

  await markAsNotified(toNotify.map(c => c.id));
}

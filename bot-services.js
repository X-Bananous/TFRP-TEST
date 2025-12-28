import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActivityType
} from "discord.js";
import { BOT_CONFIG } from "./bot-config.js";
import { 
  getPendingCharactersCount, 
  supabase, 
  updateProfilePermissions,
  getOldestPendingCharacter,
  getNewValidations,
  getProfile
} from "./bot-db.js";

/**
 * Calcul du statut SSD avec critères de volume uniquement
 */
export async function getSSDComponents() {
  const pendingCount = await getPendingCharactersCount();
  
  // Heure Paris (FR)
  const parisTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" });
  const hour = new Date(parisTime).getHours();
  
  const nowTimestamp = Math.floor(Date.now() / 1000);

  let statusLabel = "Fluide"; 
  let statusEmoji = "🟢";

  // LOGIQUE DE VOLUME (Retrait de la vérification temporelle qui bloquait sur "Ralenti")
  if (hour >= 22 || hour < 8) {
    statusLabel = "Mode Nuit : Réponses peu probables"; 
    statusEmoji = "⚫";
  } else if (pendingCount > 50) {
    statusLabel = "Ralenti"; 
    statusEmoji = "🔴";
  } else if (pendingCount > 25) {
    statusLabel = "Perturbé"; 
    statusEmoji = "🟠";
  } else if (pendingCount > 0) {
    statusLabel = "Fluide / Fast Checking";
    statusEmoji = "🟢";
  } else {
    statusLabel = "En attente de flux";
    statusEmoji = "⚪";
  }

  const embed = new EmbedBuilder()
    .setTitle("Statut des Services de Douanes (SSD)")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(`État actuel : ${statusEmoji} **${statusLabel}**\n\n` +
      "⚫ **Mode Nuit / Interrompu** - Réponses peu probables.\n" +
      "🔴 **Ralenti** - Charge importante (>50 dossiers).\n" +
      "🟠 **Perturbé** - Charge modérée (>25 dossiers).\n" +
      "🟢 **Fluide** - Traitement normal ou rapide.\n" +
      "⚪ **En attente** - Aucun dossier dans la file.\n\n" +
      `*Dernière actualisation : <t:${nowTimestamp}:R>*`)
    .addFields(
      { name: "Dossiers en attente", value: `**${pendingCount}** fiches citoyennes`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "Douanes TFRP • Système de Monitoring" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_reload_ssd').setLabel('Actualiser').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row], emoji: statusEmoji };
}

/**
 * Envoi des notifications MP pour les nouveaux personnages acceptés
 */
export async function sendVerificationDMs(client) {
  const newChars = await getNewValidations();
  if (newChars.length === 0) return;

  // Grouper par utilisateur
  const userMap = {};
  for (const char of newChars) {
    if (!userMap[char.user_id]) userMap[char.user_id] = [];
    userMap[char.user_id].push(char);
  }

  for (const userId of Object.keys(userMap)) {
    try {
      const discordUser = await client.users.fetch(userId).catch(() => null);
      if (!discordUser) continue;

      const chars = userMap[userId];
      const charIds = chars.map(c => c.id);
      
      // Récupérer le nom du staff (celui du premier perso du groupe, ils sont souvent validés par le même à l'instant T)
      const verifierId = chars[0].verifiedby;
      const staffProfile = verifierId ? await getProfile(verifierId) : null;
      const staffName = staffProfile ? staffProfile.username : "Administration";

      const embed = new EmbedBuilder()
        .setTitle("🎉 Dossier d'Immigration Validé")
        .setColor(0x00FF00)
        .setDescription(`Bonne nouvelle <@${userId}>, vos titres de transport et d'identité sont prêts.`)
        .addFields(
          { 
            name: "Personnage(s) accepté(s)", 
            value: chars.map(c => `• **${c.first_name} ${c.last_name}** (${c.job || 'Sans emploi'})`).join('\n'), 
            inline: false 
          },
          { name: "Vérificateur", value: staffName, inline: true },
          { name: "Date", value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true }
        )
        .setFooter({ text: "TFRP • Services de l'Immigration" });

      await discordUser.send({ embeds: [embed] }).catch(() => {
        console.log(`[Système] Impossible d'envoyer le MP à ${userId} (DM fermés)`);
      });

      // Marquer comme notifié en base
      await supabase
        .from('characters')
        .update({ is_notified: true })
        .in('id', charIds);

    } catch (e) {
      console.error(`[Système] Erreur lors de la notification DM pour ${userId}:`, e);
    }
  }
}

/**
 * Synchronisation bidirectionnelle DB <-> Discord
 */
export async function performGlobalSync(client) {
  const guild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
  if (!guild) return;

  try {
    const members = await guild.members.fetch();
    const { data: profiles } = await supabase.from('profiles').select('id, permissions');
    
    for (const [memberId, member] of members) {
      if (member.user.bot) continue;

      const profile = profiles?.find(p => p.id === memberId);
      const dbPerms = profile?.permissions || {};
      const currentRoles = member.roles.cache;
      let dbHasChanged = false;
      const newDbPerms = { ...dbPerms };

      for (const [permKey, roleId] of Object.entries(BOT_CONFIG.PERM_ROLE_MAP)) {
        const hasRoleOnDiscord = currentRoles.has(roleId);
        const hasPermInDb = dbPerms[permKey] === true;

        if (hasRoleOnDiscord && !hasPermInDb) {
          newDbPerms[permKey] = true;
          dbHasChanged = true;
        } 
        else if (hasPermInDb && !hasRoleOnDiscord) {
          await member.roles.add(roleId).catch(() => {});
        }
      }

      if (dbHasChanged) {
        await updateProfilePermissions(memberId, newDbPerms);
      }
    }
  } catch (error) {
    console.error(`[Système] Erreur sync :`, error);
  }
}

/**
 * Mise à jour du statut d'activité du bot
 */
export async function updateCustomsStatus(client) {
  const components = await getSSDComponents();
  const pendingCount = await getPendingCharactersCount();
  
  client.user.setActivity({ 
    name: `${components.emoji} Douanes : ${pendingCount}`, 
    type: ActivityType.Watching 
  });

  try {
    const channel = await client.channels.fetch(BOT_CONFIG.CUSTOMS_CHANNEL_ID);
    if (!channel) return;
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMsg = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes("Douanes"));
    
    const { emoji, ...payload } = components;
    if (botMsg) await botMsg.edit(payload);
    else await channel.send(payload);
  } catch (e) {}
}

export async function handleUnverified(client, userId) {
  try {
    const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
    if (!mainGuild) return;
    const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
    if (!mainMember) return;
    if (!mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) {
      await mainMember.roles.add(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
    }
  } catch (err) {}
}

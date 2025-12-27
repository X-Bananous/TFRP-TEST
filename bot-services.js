
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
  getOldestPendingCharacter
} from "./bot-db.js";

/**
 * Calcul du statut SSD avec critères temporels et de volume
 */
export async function getSSDComponents() {
  const pendingCount = await getPendingCharactersCount();
  const oldestChar = await getOldestPendingCharacter();
  
  // Heure Paris (FR)
  const parisTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" });
  const hour = new Date(parisTime).getHours();
  
  // Temps d'attente du plus vieux dossier
  const oldestWaitMs = oldestChar ? (Date.now() - new Date(oldestChar.created_at).getTime()) : 0;
  const isWaitHigh = oldestWaitMs > (10 * 60 * 1000); // 10 minutes

  let statusLabel = "Fluide"; 
  let statusEmoji = "🟢";

  // LOGIQUE DE PRIORITÉ
  if (hour >= 22 || hour < 8) {
    statusLabel = "Mode Nuit : Réponses peu probables"; 
    statusEmoji = "⚫";
  } else if (pendingCount > 50) {
    statusLabel = "Ralenti"; 
    statusEmoji = "🔴";
  } else if (pendingCount > 25 || isWaitHigh) {
    statusLabel = "Perturbé"; 
    statusEmoji = "🟠";
  } else if (pendingCount <= 5 && pendingCount > 0) {
    statusLabel = "Fast Checking";
    statusEmoji = "⚪";
  } else if (pendingCount === 0) {
    statusLabel = "En attente de flux";
    statusEmoji = "🟢";
  }

  const embed = new EmbedBuilder()
    .setTitle("Statut des Services de Douanes (SSD)")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(`État actuel : ${statusEmoji} **${statusLabel}**\n\n` +
      "⚫ **Mode Nuit / Interrompu** - Réponses peu probables ou maintenance.\n" +
      "🔴 **Ralenti** - Délai de 48h ou plus (Sous-effectif ou >50 demandes).\n" +
      "🟠 **Perturbé** - Délai de 24h à 48h (Attente >10m ou >25 demandes).\n" +
      "🟢 **Fluide** - Délai inférieur à 24h (Réponse dans la journée).\n" +
      "⚪ **Fast Checking** - Délai de 5 à 10 minutes (Douaniers mobilisés).")
    .addFields(
      { name: "Dossiers en attente", value: `**${pendingCount}** fiches citoyennes`, inline: true },
      { name: "Attente max", value: oldestChar ? `~${Math.floor(oldestWaitMs/60000)} min` : "N/A", inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "Douanes TFRP • Système de Monitoring" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_reload_ssd').setLabel('Actualiser').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row], emoji: statusEmoji };
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


import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits, 
  ActivityType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { BOT_CONFIG } from "./bot-config.js";
import { getPendingCharactersCount, supabase } from "./bot-db.js";

/**
 * Calcule l'âge à partir d'une string date (YYYY-MM-DD)
 */
export function calculateAge(birthDateStr) {
    const birthDate = new Date(birthDateStr);
    if (isNaN(birthDate.getTime())) return -1;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
}

/**
 * Génère l'embed complet du Statut des Services de Douanes (SSD)
 */
export async function getSSDComponents() {
  const pendingCount = await getPendingCharactersCount();
  
  let statusEmoji = "🟢";
  let statusLabel = "Fluide";
  let statusColor = BOT_CONFIG.COLORS.SUCCESS;
  let statusDesc = "Le temps de réponse est inférieur à 24h, vous recevrez la réponse généralement dans la journée.";

  if (pendingCount > 50) {
    statusEmoji = "🔴";
    statusLabel = "Ralenti";
    statusColor = BOT_CONFIG.COLORS.ERROR;
    statusDesc = "Le temps de réponse peut varier entre 48h et plus (Sous-effectif ou surdemande >50).";
  } else if (pendingCount > 25) {
    statusEmoji = "🟠";
    statusLabel = "Perturbé";
    statusColor = BOT_CONFIG.COLORS.WARNING;
    statusDesc = "Le temps de réponse est en moyenne de 24h à 48h en fonction des demandes reçues.";
  }

  const embed = new EmbedBuilder()
    .setTitle("Statut des Services de Douanes (SSD)")
    .setColor(statusColor)
    .setDescription(`**État actuel : ${statusEmoji} ${statusLabel}**\n\n${statusDesc}\n\n` +
      "**Légende des indicateurs :**\n" +
      "⚫ **Interrompu** - Maintenance ou panne serveur.\n" +
      "🔴 **Ralenti** - Délai > 48h (Surcharge critique).\n" +
      "🟠 **Perturbé** - Délai 24h-48h (Forte activité).\n" +
      "🟢 **Fluide** - Délai < 24h (Activité normale).\n" +
      "⚪ **Fast Checking** - Réponse 5-10 min (Purge staff).")
    .addFields(
      { name: "📊 Dossiers en file d'attente", value: `\`${pendingCount}\` fiches à valider`, inline: true },
      { name: "🕒 Dernière mise à jour", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
    )
    .setFooter({ text: "TFRP Automatic Customs System" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_reload_ssd')
      .setLabel('Actualiser le statut')
      .setEmoji('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

/**
 * Met à jour le message permanent dans le salon douanes
 */
export async function updateCustomsStatus(client) {
  const components = await getSSDComponents();
  const pendingCount = await getPendingCharactersCount();
  
  // Update Bot Activity
  const label = pendingCount > 50 ? "🔴 Ralenti" : pendingCount > 25 ? "🟠 Perturbé" : "🟢 Fluide";
  client.user.setActivity({ 
    name: `Douanes: ${label} (${pendingCount} WL)`, 
    type: ActivityType.Watching 
  });

  try {
    const channel = await client.channels.fetch(BOT_CONFIG.CUSTOMS_CHANNEL_ID);
    if (!channel) return;

    const messages = await channel.messages.fetch({ limit: 10 });
    const lastBotMsg = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes("SSD"));

    if (lastBotMsg) {
      await lastBotMsg.edit(components);
    } else {
      await channel.send(components);
    }
  } catch (e) {
    console.error(`[SSD ERROR] updateCustomsStatus: ${e.message}`);
  }
}

/**
 * Construit le Modal pour la gestion de personnage
 */
export function buildCharacterModal(isEdit = false, char = null) {
  const modal = new ModalBuilder()
    .setCustomId(isEdit ? `edit_char_modal_${char.id}` : 'create_char_modal')
    .setTitle(isEdit ? 'Mise à jour Citoyenne' : 'Nouveau Dossier Citoyen');

  const firstName = new TextInputBuilder()
    .setCustomId('first_name')
    .setLabel('Prénom')
    .setValue(char ? char.first_name : '')
    .setPlaceholder('Ex: Jean')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const lastName = new TextInputBuilder()
    .setCustomId('last_name')
    .setLabel('Nom de famille')
    .setValue(char ? char.last_name : '')
    .setPlaceholder('Ex: Dupont')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const birthDate = new TextInputBuilder()
    .setCustomId('birth_date')
    .setLabel('Date de naissance (AAAA-MM-JJ)')
    .setValue(char ? char.birth_date : '')
    .setPlaceholder('Ex: 1998-05-12')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const birthPlace = new TextInputBuilder()
    .setCustomId('birth_place')
    .setLabel('Lieu de naissance')
    .setValue(char ? char.birth_place : 'Los Angeles')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const alignment = new TextInputBuilder()
    .setCustomId('alignment')
    .setLabel('Orientation (legal ou illegal)')
    .setValue(char ? char.alignment : 'legal')
    .setPlaceholder('Entrez "legal" ou "illegal"')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(firstName),
    new ActionRowBuilder().addComponents(lastName),
    new ActionRowBuilder().addComponents(birthDate),
    new ActionRowBuilder().addComponents(birthPlace),
    new ActionRowBuilder().addComponents(alignment)
  );

  return modal;
}

/**
 * Gère l'attribution des rôles lors d'une validation réussie
 */
export async function handleVerification(client, userId, characters) {
  try {
    const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
    if (mainGuild) {
      const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
      if (mainMember) {
        for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) {
          if (!mainMember.roles.cache.has(roleId)) await mainMember.roles.add(roleId).catch(() => {});
        }
        if (mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) {
          await mainMember.roles.remove(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
        }
      }
    }
  } catch (err) {}
  
  // Marquer comme notifié
  const toNotifyIds = characters.filter(c => !c.is_notified).map(c => c.id);
  if (toNotifyIds.length > 0) {
    await supabase.from("characters").update({ is_notified: true }).in("id", toNotifyIds);
  }
}

export async function kickUnverified(member) {
  if (member.user.bot || member.permissions.has(PermissionFlagsBits.Administrator) || !member.kickable) return;
  try { await member.kick("Automatique : Aucun personnage valide."); } catch (e) {}
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
    for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) {
      if (mainMember.roles.cache.has(roleId)) await mainMember.roles.remove(roleId).catch(() => {});
    }
  } catch (err) {}
}


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
import { getPendingCharactersCount } from "./bot-db.js";

/**
 * Calcule l'âge à partir d'une date de naissance (YYYY-MM-DD)
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
 * Génère l'embed complet du statut des douanes
 */
export async function getSSDDetailsEmbed() {
  const pendingCount = await getPendingCharactersCount();
  
  let statusEmoji = "🟢";
  let statusLabel = "Fluide";
  let statusColor = BOT_CONFIG.COLORS.SUCCESS;

  if (pendingCount > 50) {
    statusEmoji = "🔴"; statusLabel = "Ralenti"; statusColor = BOT_CONFIG.COLORS.ERROR;
  } else if (pendingCount > 25) {
    statusEmoji = "🟠"; statusLabel = "Perturbé"; statusColor = BOT_CONFIG.COLORS.WARNING;
  }

  return new EmbedBuilder()
    .setTitle("Statut des Services de Douanes (SSD)")
    .setColor(statusColor)
    .setDescription(`**État actuel : ${statusEmoji} ${statusLabel}**\n\n` +
      "⚫ **Interrompu** - Maintenance ou panne du système.\n" +
      "🔴 **Ralenti** - Délai > 48h (Surcharge ou sous-effectif).\n" +
      "🟠 **Perturbé** - Délai 24h à 48h (Forte activité).\n" +
      "🟢 **Fluide** - Délai < 24h (Activité normale).\n" +
      "⚪ **Fast Checking** - Réponse en 5-10 min (Mobilisation staff).")
    .addFields(
      { name: "📊 File d'attente", value: `\`${pendingCount}\` fiches en attente.`, inline: true },
      { name: "🕒 Actualisé le", value: `<t:${Math.floor(Date.now() / 1000)}:t>`, inline: true }
    )
    .setFooter({ text: "TFRP Customs Management" });
}

/**
 * Construit le Modal pour créer ou modifier un personnage
 */
export function buildCharacterModal(isEdit = false, char = null) {
  const modal = new ModalBuilder()
    .setCustomId(isEdit ? `edit_char_modal_${char.id}` : 'create_char_modal')
    .setTitle(isEdit ? 'Modifier mon personnage' : 'Nouveau Dossier Citoyen');

  const firstNameInput = new TextInputBuilder()
    .setCustomId('first_name')
    .setLabel('Prénom')
    .setValue(char ? char.first_name : '')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const lastNameInput = new TextInputBuilder()
    .setCustomId('last_name')
    .setLabel('Nom de famille')
    .setValue(char ? char.last_name : '')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const birthDateInput = new TextInputBuilder()
    .setCustomId('birth_date')
    .setLabel('Date de naissance (AAAA-MM-JJ)')
    .setPlaceholder('Ex: 1995-05-15')
    .setValue(char ? char.birth_date : '')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const birthPlaceInput = new TextInputBuilder()
    .setCustomId('birth_place')
    .setLabel('Lieu de naissance')
    .setValue(char ? char.birth_place : 'Los Angeles')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const alignmentInput = new TextInputBuilder()
    .setCustomId('alignment')
    .setLabel('Orientation (legal ou illegal)')
    .setValue(char ? char.alignment : 'legal')
    .setPlaceholder('legal ou illegal')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(firstNameInput),
    new ActionRowBuilder().addComponents(lastNameInput),
    new ActionRowBuilder().addComponents(birthDateInput),
    new ActionRowBuilder().addComponents(birthPlaceInput),
    new ActionRowBuilder().addComponents(alignmentInput)
  );

  return modal;
}

export async function updateCustomsStatus(client, forcePost = false) {
  const embed = await getSSDDetailsEmbed();
  const pendingCount = await getPendingCharactersCount();
  
  const label = pendingCount > 50 ? "🔴 Ralenti" : pendingCount > 25 ? "🟠 Perturbé" : "🟢 Fluide";
  client.user.setActivity({ name: `Douanes: ${label} (${pendingCount})`, type: ActivityType.Watching });

  if (forcePost) {
    try {
      const channel = await client.channels.fetch(BOT_CONFIG.CUSTOMS_CHANNEL_ID);
      if (channel) await channel.send({ embeds: [embed] });
    } catch (e) {}
  }
}

export async function sendWelcomeTutorial(member) {
  const welcomeEmbed = new EmbedBuilder()
    .setTitle("Bienvenue chez TFRP")
    .setDescription(`Ravis de vous accueillir parmi nous.`)
    .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
    .setFooter({ text: "TFRP Manager" });
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setLabel("Accéder au Panel").setStyle(ButtonStyle.Link).setURL(BOT_CONFIG.SITE_URL)
  );
  try { await member.send({ embeds: [welcomeEmbed], components: [row] }); } catch (e) {}
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
    if (!mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) await mainMember.roles.add(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
    for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) if (mainMember.roles.cache.has(roleId)) await mainMember.roles.remove(roleId).catch(() => {});
  } catch (err) {}
}

export async function handleVerification(client, userId, characters) {
  const toNotify = characters.filter(c => c.is_notified !== true);
  try {
    const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
    if (mainGuild) {
      const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
      if (mainMember) {
        for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) await mainMember.roles.add(roleId).catch(() => {});
        if (mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) await mainMember.roles.remove(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
      }
    }
  } catch (err) {}
  if (toNotify.length === 0) return;
  await supabase.from("characters").update({ is_notified: true }).in("id", toNotify.map(c => c.id));
}

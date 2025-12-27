
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
import { getPendingCharactersCount, getProfile } from "./bot-db.js";

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
 * Embed Statut des Douanes
 */
export async function getSSDComponents() {
  const pendingCount = await getPendingCharactersCount();
  
  let statusLabel = "Fluide";
  let statusEmoji = "🟢";
  let statusColor = BOT_CONFIG.COLORS.SUCCESS;

  if (pendingCount > 50) {
    statusLabel = "Ralenti"; statusEmoji = "🔴"; statusColor = BOT_CONFIG.COLORS.ERROR;
  } else if (pendingCount > 25) {
    statusLabel = "Perturbé"; statusEmoji = "🟠"; statusColor = BOT_CONFIG.COLORS.WARNING;
  }

  const embed = new EmbedBuilder()
    .setTitle("STATUT DES SERVICES DE DOUANES (SSD)")
    .setColor(statusColor)
    .setDescription(`**État actuel : ${statusEmoji} ${statusLabel}**\n\n` +
      "**LÉGENDE DES INDICATEURS :**\n" +
      "⚫ **Interrompu** - Maintenance ou panne serveur.\n" +
      "🔴 **Ralenti** - Délai supérieur à 48h (Surcharge).\n" +
      "🟠 **Perturbé** - Délai 24h à 48h (Forte activité).\n" +
      "🟢 **Fluide** - Délai inférieur à 24h (Activité normale).\n" +
      "⚪ **Fast Checking** - Réponse 5-10 min (Mobilisation staff).")
    .addFields(
      { name: "**FILE D'ATTENTE**", value: `${pendingCount} fiches à valider`, inline: false },
      { name: "**DERNIÈRE MISE À JOUR**", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
    )
    .setFooter({ text: "TFRP Automatic Customs System" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_reload_ssd').setLabel('ACTUALISER LE STATUT').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

/**
 * Accueil /personnages
 */
export function getPersonnagesHomeEmbed(username) {
  return new EmbedBuilder()
    .setTitle("TERMINAL DE GESTION CITOYENNE")
    .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
    .setDescription(`Bienvenue dans votre interface de gestion, **${username.toUpperCase()}**.\n\n` +
      "Ce terminal vous permet de consulter l'intégralité de vos dossiers civils, de modifier vos informations ou de soumettre une nouvelle demande d'immigration.\n\n" +
      "**NOTE :** Toute modification du Nom ou Prénom entraînera un gel immédiat du dossier pour une nouvelle vérification par les douanes.")
    .setFooter({ text: "TFRP Secured Terminal" });
}

/**
 * Détails complets Personnage (Stacked)
 */
export async function getCharacterDetailsEmbed(char) {
  const statusEmoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
  const alignLabel = char.alignment === 'illegal' ? 'CLANDESTIN / ILLÉGAL' : 'LÉGAL / CIVIL';
  
  const verifier = char.verifiedby ? await getProfile(char.verifiedby) : null;
  const verifierName = verifier ? verifier.username.toUpperCase() : "NON RENSEIGNÉ";

  const embed = new EmbedBuilder()
    .setTitle(`DOSSIER : ${char.first_name.toUpperCase()} ${char.last_name.toUpperCase()}`)
    .setColor(char.status === 'accepted' ? BOT_CONFIG.COLORS.SUCCESS : char.status === 'rejected' ? BOT_CONFIG.COLORS.ERROR : BOT_CONFIG.COLORS.WARNING)
    .addFields(
      { name: "**PRÉNOM**", value: char.first_name, inline: false },
      { name: "**NOM**", value: char.last_name, inline: false },
      { name: "**DATE DE NAISSANCE**", value: char.birth_date, inline: false },
      { name: "**LIEU DE NAISSANCE**", value: char.birth_place || "LOS ANGELES", inline: false },
      { name: "**ÂGE**", value: `${char.age} ans`, inline: false },
      { name: "**ORIENTATION SOCIALE**", value: alignLabel, inline: false },
      { name: "**STATUT DOUANIER**", value: `${statusEmoji} ${char.status.toUpperCase()}`, inline: false },
      { name: "**PROFESSION**", value: (char.job || "SANS EMPLOI").toUpperCase(), inline: false },
      { name: "**POINTS PERMIS**", value: `${char.driver_license_points ?? 12}/12`, inline: false },
      { name: "**BARREAU**", value: char.bar_passed ? "ADMIS" : "NON TITULAIRE", inline: false },
      { name: "**DERNIÈRE VALIDATION PAR**", value: verifierName, inline: false }
    )
    .setFooter({ text: `IDENTIFIANT UNIQUE : ${char.id}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`btn_edit_char_${char.id}`).setLabel('MODIFIER LES INFORMATIONS').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_back_to_list').setLabel('RETOUR À LA LISTE').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

export function buildCharacterModal(isEdit = false, char = null) {
  const modal = new ModalBuilder()
    .setCustomId(isEdit ? `edit_char_modal_${char.id}` : 'create_char_modal')
    .setTitle(isEdit ? 'RÉVISION DE DOSSIER' : 'IMMIGRATION : NOUVELLE FICHE');

  const firstName = new TextInputBuilder().setCustomId('first_name').setLabel('PRÉNOM').setValue(char ? char.first_name : '').setStyle(TextInputStyle.Short).setRequired(true);
  const lastName = new TextInputBuilder().setCustomId('last_name').setLabel('NOM DE FAMILLE').setValue(char ? char.last_name : '').setStyle(TextInputStyle.Short).setRequired(true);
  const birthDate = new TextInputBuilder().setCustomId('birth_date').setLabel('DATE DE NAISSANCE (AAAA-MM-JJ)').setValue(char ? char.birth_date : '').setPlaceholder('Ex: 1995-05-15').setStyle(TextInputStyle.Short).setRequired(true);
  const birthPlace = new TextInputBuilder().setCustomId('birth_place').setLabel('LIEU DE NAISSANCE').setValue(char ? char.birth_place : 'Los Angeles').setStyle(TextInputStyle.Short).setRequired(true);
  const alignment = new TextInputBuilder().setCustomId('alignment').setLabel('ORIENTATION (legal ou illegal)').setValue(char ? char.alignment : 'legal').setStyle(TextInputStyle.Short).setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(firstName),
    new ActionRowBuilder().addComponents(lastName),
    new ActionRowBuilder().addComponents(birthDate),
    new ActionRowBuilder().addComponents(birthPlace),
    new ActionRowBuilder().addComponents(alignment)
  );
  return modal;
}

export async function updateCustomsStatus(client) {
  const components = await getSSDComponents();
  const pendingCount = await getPendingCharactersCount();
  const label = pendingCount > 50 ? "🔴 Ralenti" : pendingCount > 25 ? "🟠 Perturbé" : "🟢 Fluide";
  client.user.setActivity({ name: `Douanes: ${label} (${pendingCount} WL)`, type: ActivityType.Watching });

  try {
    const channel = await client.channels.fetch(BOT_CONFIG.CUSTOMS_CHANNEL_ID);
    if (!channel) return;
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMsg = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes("SSD"));
    if (botMsg) await botMsg.edit(components);
    else await channel.send(components);
  } catch (e) {}
}

export async function handleVerification(client, userId, characters) {
  try {
    const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
    if (mainGuild) {
      const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
      if (mainMember) {
        for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) if (!mainMember.roles.cache.has(roleId)) await mainMember.roles.add(roleId).catch(() => {});
        if (mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) await mainMember.roles.remove(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
      }
    }
  } catch (err) {}
  const toNotifyIds = characters.filter(c => !c.is_notified).map(c => c.id);
  if (toNotifyIds.length > 0) {
    const { createClient } = await import("@supabase/supabase-js");
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    await db.from("characters").update({ is_notified: true }).in("id", toNotifyIds);
  }
}

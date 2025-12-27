
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
import { getPendingCharactersCount, supabase, getProfile } from "./bot-db.js";

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
  
  let statusLabel = "Fluide";
  let statusColor = BOT_CONFIG.COLORS.SUCCESS;
  let statusDesc = "Le temps de réponse est inférieur à 24h, vous recevrez la réponse généralement dans la journée.";

  if (pendingCount > 50) {
    statusLabel = "Ralenti";
    statusColor = BOT_CONFIG.COLORS.ERROR;
    statusDesc = "Le temps de réponse peut varier entre 48h et plus (Sous-effectif ou surdemande >50).";
  } else if (pendingCount > 25) {
    statusLabel = "Perturbé";
    statusColor = BOT_CONFIG.COLORS.WARNING;
    statusDesc = "Le temps de réponse est en moyenne de 24h à 48h en fonction des demandes reçues.";
  }

  const embed = new EmbedBuilder()
    .setTitle("STATUT DES SERVICES DE DOUANES (SSD)")
    .setColor(statusColor)
    .setDescription(`ETAT ACTUEL : ${statusLabel.toUpperCase()}\n\n${statusDesc.toUpperCase()}\n\n` +
      "LEGENDE DES INDICATEURS :\n" +
      "INTERROMPU - Maintenance ou panne serveur.\n" +
      "RALENTI - Delai superieur a 48h (Surcharge critique).\n" +
      "PERTURBE - Delai 24h-48h (Forte activite).\n" +
      "FLUIDE - Delai inferieur a 24h (Activite normale).\n" +
      "FAST CHECKING - Reponse 5-10 min (Purge staff).")
    .addFields(
      { name: "DOSSIERS EN FILE D'ATTENTE", value: `${pendingCount} fiches à valider`, inline: false },
      { name: "DERNIERE MISE A JOUR", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
    )
    .setFooter({ text: "TFRP AUTOMATIC CUSTOMS SYSTEM" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_reload_ssd')
      .setLabel('ACTUALISER LE STATUT')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

/**
 * Génère l'embed de présentation initiale pour /personnages
 */
export function getPersonnagesHomeEmbed(username) {
  return new EmbedBuilder()
    .setTitle("GESTION DES DOSSIERS CITOYENS")
    .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
    .setDescription(`Bienvenue dans votre interface de gestion de dossiers, ${username.toUpperCase()}.\n\n` +
      "Vous pouvez ici consulter l'integralite de vos fiches, modifier vos informations d'etat civil ou creer un nouveau dossier si vous disposez de slots libres.\n\n" +
      "RAPPEL : Toute modification de Nom ou Prenom entrainera une re-validation automatique par les services de douanes.")
    .setFooter({ text: "TFRP SECURED TERMINAL" });
}

/**
 * Génère l'embed de détails complet d'un personnage (Vertical/Stacked)
 */
export async function getCharacterDetailsEmbed(char) {
  const statusMap = { 'pending': 'EN ATTENTE', 'accepted': 'VALIDE', 'rejected': 'REFUSE' };
  const alignmentMap = { 'legal': 'LEGAL / CIVIL', 'illegal': 'CLANDESTIN / ILLEGAL' };
  
  const staffProfile = char.verifiedby ? await getProfile(char.verifiedby) : null;
  const verifierName = staffProfile ? staffProfile.username.toUpperCase() : "NON RENSEIGNE";

  const embed = new EmbedBuilder()
    .setTitle(`DOSSIER : ${char.first_name.toUpperCase()} ${char.last_name.toUpperCase()}`)
    .setColor(char.status === 'accepted' ? BOT_CONFIG.COLORS.SUCCESS : char.status === 'rejected' ? BOT_CONFIG.COLORS.ERROR : BOT_CONFIG.COLORS.WARNING)
    .addFields(
      { name: "PRENOM", value: char.first_name, inline: false },
      { name: "NOM", value: char.last_name, inline: false },
      { name: "DATE DE NAISSANCE", value: char.birth_date, inline: false },
      { name: "LIEU DE NAISSANCE", value: char.birth_place || "LOS ANGELES", inline: false },
      { name: "AGE", value: `${char.age} ANS`, inline: false },
      { name: "ORIENTATION", value: alignmentMap[char.alignment] || char.alignment.toUpperCase(), inline: false },
      { name: "STATUT DOUANIER", value: statusMap[char.status] || char.status.toUpperCase(), inline: false },
      { name: "PROFESSION", value: (char.job || "SANS EMPLOI").toUpperCase(), inline: false },
      { name: "POINTS PERMIS", value: `${char.driver_license_points ?? 12}/12`, inline: false },
      { name: "BARREAU", value: char.bar_passed ? "ADMIS" : "NON TITULAIRE", inline: false },
      { name: "VALIDE PAR", value: verifierName, inline: false }
    )
    .setFooter({ text: `ID DOSSIER : ${char.id}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_edit_char_${char.id}`)
      .setLabel('MODIFIER LE DOSSIER')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_back_to_list')
      .setLabel('RETOUR A LA LISTE')
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
  
  const label = pendingCount > 50 ? "Ralenti" : pendingCount > 25 ? "Perturbe" : "Fluide";
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
    .setTitle(isEdit ? 'MISE A JOUR CITOYENNE' : 'NOUVEAU DOSSIER CITOYEN');

  const firstName = new TextInputBuilder()
    .setCustomId('first_name')
    .setLabel('PRENOM')
    .setValue(char ? char.first_name : '')
    .setPlaceholder('EX: JEAN')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const lastName = new TextInputBuilder()
    .setCustomId('last_name')
    .setLabel('NOM DE FAMILLE')
    .setValue(char ? char.last_name : '')
    .setPlaceholder('EX: DUPONT')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const birthDate = new TextInputBuilder()
    .setCustomId('birth_date')
    .setLabel('DATE DE NAISSANCE (AAAA-MM-JJ)')
    .setValue(char ? char.birth_date : '')
    .setPlaceholder('EX: 1998-05-12')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const birthPlace = new TextInputBuilder()
    .setCustomId('birth_place')
    .setLabel('LIEU DE NAISSANCE')
    .setValue(char ? char.birth_place : 'LOS ANGELES')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const alignment = new TextInputBuilder()
    .setCustomId('alignment')
    .setLabel('ORIENTATION (LEGAL OU ILLEGAL)')
    .setValue(char ? char.alignment : 'legal')
    .setPlaceholder('ENTREZ LEGAL OU ILLEGAL')
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

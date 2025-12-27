import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActivityType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { BOT_CONFIG } from "./bot-config.js";
import { 
  getPendingCharactersCount, 
  supabase, 
  getProfile, 
  getAllUserCharacters, 
  updateProfilePermissions 
} from "./bot-db.js";

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
 * Crée les rôles de permissions s'ils n'existent pas sur le serveur principal
 */
export async function ensureRolesExist(guild) {
  if (!guild) return;
  const roles = await guild.roles.fetch();
  
  for (const [perm, config] of Object.entries(BOT_CONFIG.PERM_ROLE_MAP)) {
    let role = roles.find(r => r.name === config.name);
    if (!role) {
      console.log(`Création du rôle manquant : ${config.name}`);
      await guild.roles.create({
        name: config.name,
        color: config.color,
        reason: 'Initialisation automatique du système de permissions TFRP'
      }).catch(console.error);
    }
  }
}

/**
 * Synchronise Discord -> Site (Lors d'un changement manuel sur Discord)
 */
export async function syncRolesToPermissions(member) {
  if (!member || member.user.bot) return;
  const currentRoles = member.roles.cache;
  const newPermissions = {};
  
  for (const [perm, config] of Object.entries(BOT_CONFIG.PERM_ROLE_MAP)) {
    if (currentRoles.some(r => r.name === config.name)) {
      newPermissions[perm] = true;
    }
  }
  
  await updateProfilePermissions(member.id, newPermissions);
}

/**
 * Synchronise Site -> Discord (Lors d'une interaction ou vérification)
 */
export async function syncPermissionsToRoles(member, permissions) {
  if (!member || member.user.bot) return;
  const perms = permissions || {};
  const guildRoles = member.guild.roles.cache;
  
  for (const [perm, config] of Object.entries(BOT_CONFIG.PERM_ROLE_MAP)) {
    const hasPerm = perms[perm] === true;
    const role = guildRoles.find(r => r.name === config.name);
    
    if (role) {
      const hasRole = member.roles.cache.has(role.id);
      if (hasPerm && !hasRole) {
        await member.roles.add(role).catch(() => {});
      } else if (!hasPerm && hasRole) {
        await member.roles.remove(role).catch(() => {});
      }
    }
  }
}

/**
 * Embed de statut pour /verification
 */
export async function getVerificationStatusEmbed(userId) {
  const allChars = await getAllUserCharacters(userId);
  const mention = `<@${userId}>`;
  
  const embed = new EmbedBuilder()
    .setTitle("Synchronisation du terminal")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(`Analyse des dossiers enregistrés pour ${mention}`);

  if (allChars.length === 0) {
    embed.addFields({ name: "Résultat", value: "Aucune fiche citoyenne détectée dans la base de données.", inline: false });
  } else {
    allChars.forEach(char => {
      const emoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
      const label = char.status === 'accepted' ? 'Validé' : char.status === 'rejected' ? 'Refusé' : 'En attente de douanes';
      embed.addFields({ 
        name: `${char.first_name} ${char.last_name}`, 
        value: `Statut : ${emoji} ${label}\nIdentifiant : ${char.id.substring(0,8)}`, 
        inline: false 
      });
    });
  }

  embed.setFooter({ text: "TFRP Unified Network" });
  return embed;
}

/**
 * Gère la vérification automatique et les logs (Salon + MP)
 */
export async function handleVerification(client, userId, characters) {
  const mention = `<@${userId}>`;
  const acceptedChars = characters.filter(c => c.status === 'accepted');
  const profile = await getProfile(userId);
  
  try {
    const mainGuild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
    if (mainGuild) {
      const mainMember = await mainGuild.members.fetch(userId).catch(() => null);
      if (mainMember) {
        // 1. Mise à jour des rôles citoyens de base
        for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) {
          if (!mainMember.roles.cache.has(roleId)) await mainMember.roles.add(roleId).catch(() => {});
        }
        if (mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) {
          await mainMember.roles.remove(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
        }

        // 2. Synchronisation bidirectionnelle des permissions Staff
        await syncPermissionsToRoles(mainMember, profile?.permissions);

        // 3. Journalisation dans le salon de logs
        const logChannel = await client.channels.fetch(BOT_CONFIG.LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("Protocole de vérification")
            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(`Le citoyen ${mention} a été synchronisé avec succès.\nDossiers valides : ${acceptedChars.length}`)
            .setTimestamp()
            .setFooter({ text: "Logs Système" });
          await logChannel.send({ embeds: [logEmbed] });
        }

        // 4. Notification par message privé
        const user = await client.users.fetch(userId).catch(() => null);
        if (user) {
          const mpEmbed = new EmbedBuilder()
            .setTitle("Vérification terminée")
            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(`Bonjour ${mention},\n\nVos dossiers ont été mis à jour par les services d'immigration. Vos accès au territoire sont désormais actifs.`)
            .setFooter({ text: "TFRP Transmission" });
          await user.send({ embeds: [mpEmbed] }).catch(() => {});
        }
      }
    }
  } catch (err) {}

  // Marquer comme notifié sur le site
  const toNotifyIds = characters.map(c => c.id);
  if (toNotifyIds.length > 0) {
    await supabase.from("characters").update({ is_notified: true }).in("id", toNotifyIds);
  }
}

/**
 * Embed du Statut des Services de Douanes (SSD)
 */
export async function getSSDComponents() {
  const pendingCount = await getPendingCharactersCount();
  let statusLabel = "Fluide"; let statusEmoji = "🟢";

  if (pendingCount > 50) {
    statusLabel = "Ralenti"; statusEmoji = "🔴";
  } else if (pendingCount > 25) {
    statusLabel = "Perturbé"; statusEmoji = "🟠";
  }

  const embed = new EmbedBuilder()
    .setTitle("Services de Douanes (SSD)")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(`État actuel : ${statusEmoji} ${statusLabel}\n\n` +
      "Légende :\n" +
      "⚫ Interrompu - Surcharge majeure\n" +
      "🔴 Ralenti - Délai supérieur à 48h\n" +
      "🟠 Perturbé - Délai de 24h à 48h\n" +
      "🟢 Fluide - Délai inférieur à 24h")
    .addFields(
      { name: "Dossiers en attente", value: `${pendingCount} fiches`, inline: false },
      { name: "Dernière mise à jour", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
    )
    .setFooter({ text: "TFRP Automation" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_reload_ssd').setLabel('Actualiser').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

export function getPersonnagesHomeEmbed(mention) {
  return new EmbedBuilder()
    .setTitle("Terminal citoyen")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(`Bienvenue sur votre interface, ${mention}.\n\nVeuillez sélectionner un dossier pour consultation ou modification.`);
}

export async function getCharacterDetailsEmbed(char) {
  const statusEmoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
  const alignLabel = char.alignment === 'illegal' ? 'Clandestin' : 'Civil';
  const verifier = char.verifiedby ? await getProfile(char.verifiedby) : null;
  const verifierMention = verifier ? `<@${char.verifiedby}>` : "Non renseigné";

  const embed = new EmbedBuilder()
    .setTitle(`Dossier : ${char.first_name} ${char.last_name}`)
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .addFields(
      { name: "Identité", value: `${char.first_name} ${char.last_name}`, inline: true },
      { name: "Âge", value: `${char.age} ans`, inline: true },
      { name: "Orientation", value: alignLabel, inline: true },
      { name: "Statut", value: `${statusEmoji} ${char.status}`, inline: true },
      { name: "Métier", value: char.job || "Sans emploi", inline: true },
      { name: "Points permis", value: `${char.driver_license_points ?? 12}/12`, inline: true },
      { name: "Validateur", value: verifierMention, inline: false }
    )
    .setFooter({ text: `Référence : ${char.id}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`btn_edit_char_${char.id}`).setLabel('Modifier').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_back_to_list').setLabel('Retour').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

export function buildCharacterModal(isEdit = false, char = null) {
  const modal = new ModalBuilder()
    .setCustomId(isEdit ? `edit_char_modal_${char.id}` : 'create_char_modal')
    .setTitle(isEdit ? 'Révision de dossier' : 'Nouvelle fiche d\'immigration');

  const firstName = new TextInputBuilder().setCustomId('first_name').setLabel('Prénom').setValue(char ? char.first_name : '').setStyle(TextInputStyle.Short).setRequired(true);
  const lastName = new TextInputBuilder().setCustomId('last_name').setLabel('Nom').setValue(char ? char.last_name : '').setStyle(TextInputStyle.Short).setRequired(true);
  const birthDate = new TextInputBuilder().setCustomId('birth_date').setLabel('Date de naissance (AAAA-MM-JJ)').setValue(char ? char.birth_date : '').setPlaceholder('Ex: 1995-05-15').setStyle(TextInputStyle.Short).setRequired(true);
  const birthPlace = new TextInputBuilder().setCustomId('birth_place').setLabel('Lieu de naissance').setValue(char ? char.birth_place : 'Los Angeles').setStyle(TextInputStyle.Short).setRequired(true);
  const alignment = new TextInputBuilder().setCustomId('alignment').setLabel('Orientation (legal ou illegal)').setValue(char ? char.alignment : 'legal').setStyle(TextInputStyle.Short).setRequired(true);

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
  client.user.setActivity({ name: `Douanes : ${pendingCount} dossiers`, type: ActivityType.Watching });

  try {
    const channel = await client.channels.fetch(BOT_CONFIG.CUSTOMS_CHANNEL_ID);
    if (!channel) return;
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMsg = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes("Douanes"));
    if (botMsg) await botMsg.edit(components);
    else await channel.send(components);
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
    for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) {
      if (mainMember.roles.cache.has(roleId)) await mainMember.roles.remove(roleId).catch(() => {});
    }
  } catch (err) {}
}
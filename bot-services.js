
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
 * S'assure que les rôles de permissions existent sur le serveur.
 * Sinon, les crée.
 */
export async function ensureRolesExist(guild) {
  if (!guild) return;
  const roles = await guild.roles.fetch();
  
  for (const [perm, config] of Object.entries(BOT_CONFIG.PERM_ROLES)) {
    let role = roles.find(r => r.name === config.name);
    if (!role) {
      console.log(`[SYSTEM] Création du rôle manquant : ${config.name}`);
      await guild.roles.create({
        name: config.name,
        color: config.color,
        reason: 'Initialisation automatique des permissions TFRP'
      });
    }
  }
}

/**
 * Synchronise Discord -> Site (guildMemberUpdate)
 */
export async function syncRolesToPermissions(member) {
  if (!member || member.user.bot) return;
  const currentRoles = member.roles.cache;
  const newPermissions = {};
  
  for (const [perm, config] of Object.entries(BOT_CONFIG.PERM_ROLES)) {
    if (currentRoles.some(r => r.name === config.name)) {
      newPermissions[perm] = true;
    }
  }
  
  await updateProfilePermissions(member.id, newPermissions);
}

/**
 * Synchronise Site -> Discord (Verification/Interaction)
 */
export async function syncPermissionsToRoles(member, permissions) {
  if (!member || member.user.bot) return;
  const perms = permissions || {};
  const guildRoles = member.guild.roles.cache;
  
  for (const [perm, config] of Object.entries(BOT_CONFIG.PERM_ROLES)) {
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
 * Génère l'embed détaillé pour /verification
 */
export async function getVerificationStatusEmbed(userId) {
  const allChars = await getAllUserCharacters(userId);
  const mention = `<@${userId}>`;
  
  const embed = new EmbedBuilder()
    .setTitle("TERMINAL DE SYNCHRONISATION")
    .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
    .setDescription(`Analyse du registre national pour ${mention}`);

  if (allChars.length === 0) {
    embed.addFields({ name: "RÉSULTAT", value: "AUCUN DOSSIER TROUVÉ.", inline: false });
    embed.setColor(BOT_CONFIG.COLORS.ERROR);
  } else {
    allChars.forEach(char => {
      const emoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
      const label = char.status === 'accepted' ? 'VALIDÉ' : char.status === 'rejected' ? 'REFUSÉ' : 'EN ATTENTE';
      embed.addFields({ 
        name: `${char.first_name.toUpperCase()} ${char.last_name.toUpperCase()}`, 
        value: `STATUT : ${emoji} ${label}\nID : ${char.id.substring(0,8).toUpperCase()}`, 
        inline: false 
      });
    });
  }

  embed.setFooter({ text: "TFRP SECURED NETWORK" });
  return embed;
}

/**
 * Gère la vérification, les rôles, et RESTAURE les logs Salon + MP
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
        // 1. Rôles de base (Citoyen)
        for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) {
          if (!mainMember.roles.cache.has(roleId)) await mainMember.roles.add(roleId).catch(() => {});
        }
        if (mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) {
          await mainMember.roles.remove(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
        }

        // 2. Synchro Staff
        await syncPermissionsToRoles(mainMember, profile?.permissions);

        // 3. LOG SALON (Si nouveau personnage accepté)
        const newValidations = characters.filter(c => !c.is_notified && c.status === 'accepted');
        if (newValidations.length > 0) {
            const logChannel = await client.channels.fetch(BOT_CONFIG.LOG_CHANNEL_ID).catch(() => null);
            if (logChannel) {
              const logEmbed = new EmbedBuilder()
                .setTitle("VÉRIFICATION RÉUSSIE")
                .setColor(BOT_CONFIG.COLORS.SUCCESS)
                .setDescription(`Le citoyen ${mention} a été synchronisé avec succès.\n\nDossiers actifs : **${acceptedChars.length}**`)
                .setTimestamp()
                .setFooter({ text: "LOGS SYSTÈME TFRP" });
              await logChannel.send({ embeds: [logEmbed] });
            }

            // 4. LOG MP
            const user = await client.users.fetch(userId).catch(() => null);
            if (user) {
              const mpEmbed = new EmbedBuilder()
                .setTitle("IDENTITÉ CERTIFIÉE")
                .setColor(BOT_CONFIG.COLORS.SUCCESS)
                .setDescription(`Félicitations ${mention},\n\nVos fiches d'immigration ont été validées. Vos accès au territoire de Los Angeles sont désormais actifs.`)
                .setFooter({ text: "TFRP SECURED TRANSMISSION" });
              await user.send({ embeds: [mpEmbed] }).catch(() => {});
            }
        }
      }
    }
  } catch (err) {}

  // Marquer comme notifié
  const toNotifyIds = characters.map(c => c.id);
  if (toNotifyIds.length > 0) {
    await supabase.from("characters").update({ is_notified: true }).in("id", toNotifyIds);
  }
}

/**
 * Statut des Douanes
 */
export async function getSSDComponents() {
  const pendingCount = await getPendingCharactersCount();
  let statusLabel = "Fluide"; let statusEmoji = "🟢"; let statusColor = BOT_CONFIG.COLORS.SUCCESS;

  if (pendingCount > 50) {
    statusLabel = "Ralenti"; statusEmoji = "🔴"; statusColor = BOT_CONFIG.COLORS.ERROR;
  } else if (pendingCount > 25) {
    statusLabel = "Perturbé"; statusEmoji = "🟠"; statusColor = BOT_CONFIG.COLORS.WARNING;
  }

  const embed = new EmbedBuilder()
    .setTitle("STATUT DES SERVICES DE DOUANES (SSD)")
    .setColor(statusColor)
    .setDescription(`**ÉTAT : ${statusEmoji} ${statusLabel.toUpperCase()}**\n\n` +
      "**LÉGENDE :**\n" +
      "⚫ **Interrompu** - Surcharge\n" +
      "🔴 **Ralenti** - Délai > 48h\n" +
      "🟠 **Perturbé** - Délai 24h-48h\n" +
      "🟢 **Fluide** - Délai < 24h")
    .addFields(
      { name: "DOSSIERS EN ATTENTE", value: `${pendingCount} fiches`, inline: false },
      { name: "MAJ", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
    )
    .setFooter({ text: "TFRP AUTOMATIC SYSTEM" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_reload_ssd').setLabel('ACTUALISER').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

export function getPersonnagesHomeEmbed(mention) {
  return new EmbedBuilder()
    .setTitle("TERMINAL CITOYEN")
    .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
    .setDescription(`Bienvenue ${mention}.\n\nSélectionnez un dossier pour consultation.`);
}

export async function getCharacterDetailsEmbed(char) {
  const emoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
  const align = char.alignment === 'illegal' ? 'CLANDESTIN' : 'CIVIL';
  const verifier = char.verifiedby ? `<@${char.verifiedby}>` : "NON RENSEIGNÉ";

  const embed = new EmbedBuilder()
    .setTitle(`DOSSIER : ${char.first_name.toUpperCase()} ${char.last_name.toUpperCase()}`)
    .setColor(char.status === 'accepted' ? BOT_CONFIG.COLORS.SUCCESS : char.status === 'rejected' ? BOT_CONFIG.COLORS.ERROR : BOT_CONFIG.COLORS.WARNING)
    .addFields(
      { name: "PRÉNOM", value: char.first_name, inline: true },
      { name: "NOM", value: char.last_name, inline: true },
      { name: "ÂGE", value: `${char.age} ans`, inline: true },
      { name: "ORIENTATION", value: align, inline: true },
      { name: "STATUT", value: `${emoji} ${char.status.toUpperCase()}`, inline: true },
      { name: "VALIDATEUR", value: verifier, inline: false }
    )
    .setFooter({ text: `REF : ${char.id}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`btn_edit_char_${char.id}`).setLabel('MODIFIER').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('btn_back_to_list').setLabel('RETOUR').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

export function buildCharacterModal(isEdit = false, char = null) {
  const modal = new ModalBuilder()
    .setCustomId(isEdit ? `edit_char_modal_${char.id}` : 'create_char_modal')
    .setTitle(isEdit ? 'RÉVISION' : 'NOUVELLE FICHE');

  const f1 = new TextInputBuilder().setCustomId('first_name').setLabel('PRÉNOM').setValue(char ? char.first_name : '').setStyle(TextInputStyle.Short).setRequired(true);
  const f2 = new TextInputBuilder().setCustomId('last_name').setLabel('NOM').setValue(char ? char.last_name : '').setStyle(TextInputStyle.Short).setRequired(true);
  const f3 = new TextInputBuilder().setCustomId('birth_date').setLabel('DATE DE NAISSANCE (AAAA-MM-JJ)').setValue(char ? char.birth_date : '').setPlaceholder('1995-05-15').setStyle(TextInputStyle.Short).setRequired(true);
  const f4 = new TextInputBuilder().setCustomId('birth_place').setLabel('LIEU DE NAISSANCE').setValue(char ? char.birth_place : 'Los Angeles').setStyle(TextInputStyle.Short).setRequired(true);
  const f5 = new TextInputBuilder().setCustomId('alignment').setLabel('ORIENTATION (legal ou illegal)').setValue(char ? char.alignment : 'legal').setStyle(TextInputStyle.Short).setRequired(true);

  modal.addComponents(
    new ActionRowBuilder().addComponents(f1),
    new ActionRowBuilder().addComponents(f2),
    new ActionRowBuilder().addComponents(f3),
    new ActionRowBuilder().addComponents(f4),
    new ActionRowBuilder().addComponents(f5)
  );
  return modal;
}

export async function updateCustomsStatus(client) {
  const components = await getSSDComponents();
  const pendingCount = await getPendingCharactersCount();
  const label = pendingCount > 50 ? "🔴 Ralenti" : pendingCount > 25 ? "🟠 Perturbé" : "🟢 Fluide";
  client.user.setActivity({ name: `Douanes: ${label}`, type: ActivityType.Watching });

  try {
    const channel = await client.channels.fetch(BOT_CONFIG.CUSTOMS_CHANNEL_ID);
    if (!channel) return;
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMsg = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title?.includes("SSD"));
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


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
 * Assure l'existence des rôles et synchronise tous les membres
 */
export async function performGlobalSync(client) {
  const guild = await client.guilds.fetch(BOT_CONFIG.MAIN_SERVER_ID).catch(() => null);
  if (!guild) return;

  // 1. S'assurer que les rôles existent
  const roles = await guild.roles.fetch();
  for (const [perm, config] of Object.entries(BOT_CONFIG.PERM_ROLE_MAP)) {
    if (!roles.find(r => r.name === config.name)) {
      console.log(`[Système] Création du rôle : ${config.name}`);
      await guild.roles.create({
        name: config.name,
        color: config.color,
        reason: 'Initialisation automatique TFRP'
      }).catch(() => {});
    }
  }

  // 2. Récupérer les membres et les profils
  const members = await guild.members.fetch();
  const { data: profiles } = await supabase.from('profiles').select('id, permissions');
  
  const rolesMap = guild.roles.cache;

  for (const [memberId, member] of members) {
    if (member.user.bot) continue;

    const profile = profiles?.find(p => p.id === memberId);
    const dbPerms = profile?.permissions || {};
    const currentRoles = member.roles.cache;
    let hasChanged = false;
    const newDbPerms = { ...dbPerms };

    for (const [perm, config] of Object.entries(BOT_CONFIG.PERM_ROLE_MAP)) {
      const role = rolesMap.find(r => r.name === config.name);
      if (!role) continue;

      const hasRole = currentRoles.has(role.id);
      const hasPerm = dbPerms[perm] === true;

      // Logique de fusion : si l'un a le droit, l'autre doit l'avoir
      if (hasRole && !hasPerm) {
        newDbPerms[perm] = true;
        hasChanged = true;
      } else if (hasPerm && !hasRole) {
        await member.roles.add(role).catch(() => {});
      }
    }

    if (hasChanged) {
      await updateProfilePermissions(memberId, newDbPerms);
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

  embed.setFooter({ text: "Réseau unifié tfrp" });
  return embed;
}

/**
 * Gère la vérification ponctuelle et les notifications
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
        // Rôles citoyens
        for (const roleId of BOT_CONFIG.VERIFIED_ROLE_IDS) {
          if (!mainMember.roles.cache.has(roleId)) await mainMember.roles.add(roleId).catch(() => {});
        }
        if (mainMember.roles.cache.has(BOT_CONFIG.UNVERIFIED_ROLE_ID)) {
          await mainMember.roles.remove(BOT_CONFIG.UNVERIFIED_ROLE_ID).catch(() => {});
        }

        // Logs
        const logChannel = await client.channels.fetch(BOT_CONFIG.LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("Protocole de vérification")
            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(`Le citoyen ${mention} a été synchronisé avec succès.\nDossiers valides : ${acceptedChars.length}`)
            .setTimestamp()
            .setFooter({ text: "Journal système" });
          await logChannel.send({ embeds: [logEmbed] });
        }

        const user = await client.users.fetch(userId).catch(() => null);
        if (user) {
          const mpEmbed = new EmbedBuilder()
            .setTitle("Vérification terminée")
            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(`Bonjour ${mention},\n\nVos dossiers ont été mis à jour par les services d'immigration. Vos accès au territoire sont désormais actifs.`)
            .setFooter({ text: "Transmission tfrp" });
          await user.send({ embeds: [mpEmbed] }).catch(() => {});
        }
      }
    }
  } catch (err) {}

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
    .setTitle("Services de douanes (ssd)")
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
    .setFooter({ text: "Automatisation tfrp" });

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
  const verifierMention = char.verifiedby ? `<@${char.verifiedby}>` : "Non renseigné";

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

export async function updateCustomsStatus(client) {
  const components = await getSSDComponents();
  const pendingCount = await getPendingCharactersCount();
  client.user.setActivity({ name: `Douanes : ${pendingCount} dossiers`, type: ActivityType.Watching });

  try {
    const channel = await client.channels.fetch(BOT_CONFIG.CUSTOMS_CHANNEL_ID);
    if (!channel) return;
    const messages = await channel.messages.fetch({ limit: 10 });
    const botMsg = messages.find(m => m.author.id === client.user.id && m.embeds[0]?.title?.toLowerCase().includes("douanes"));
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

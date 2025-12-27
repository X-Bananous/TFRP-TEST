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
 * Synchronisation bidirectionnelle : Fusionne les rôles Discord et les permissions DB
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

        // Discord -> DB (Merge positif)
        if (hasRoleOnDiscord && !hasPermInDb) {
          newDbPerms[permKey] = true;
          dbHasChanged = true;
        } 
        // DB -> Discord (Merge positif)
        else if (hasPermInDb && !hasRoleOnDiscord) {
          await member.roles.add(roleId).catch(() => {
            console.warn(`[Erreur] Attribution du rôle ${roleId} impossible pour ${member.user.tag}`);
          });
        }
      }

      if (dbHasChanged) {
        await updateProfilePermissions(memberId, newDbPerms);
      }
    }
  } catch (error) {
    console.error(`[Système] Erreur lors de la synchronisation globale :`, error);
  }
}

/**
 * Embed de vérification pour la commande /verification
 */
export async function getVerificationStatusEmbed(userId) {
  const allChars = await getAllUserCharacters(userId);
  const mention = `<@${userId}>`;
  
  const embed = new EmbedBuilder()
    .setTitle("Synchronisation du terminal")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(`Analyse des données pour le citoyen ${mention}`);

  if (allChars.length === 0) {
    embed.addFields({ name: "Résultat", value: "Aucune fiche citoyenne détectée dans les archives.", inline: false });
  } else {
    allChars.forEach(char => {
      const emoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
      const label = char.status === 'accepted' ? 'Validé' : char.status === 'rejected' ? 'Refusé' : 'En attente';
      embed.addFields({ 
        name: `${char.first_name} ${char.last_name}`, 
        value: `Statut : ${emoji} ${label}\nIdentifiant : ${char.id.substring(0,8)}`, 
        inline: false 
      });
    });
  }

  embed.setFooter({ text: "Système de synchronisation tfrp" });
  return embed;
}

/**
 * Traitement des nouvelles validations (Roles citoyen + Logs)
 */
export async function handleVerification(client, userId, characters) {
  const mention = `<@${userId}>`;
  const acceptedChars = characters.filter(c => c.status === 'accepted');
  
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

        // Log centralisé
        const logChannel = await client.channels.fetch(BOT_CONFIG.LOG_CHANNEL_ID).catch(() => null);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("Vérification citoyenne")
            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(`Le terminal de ${mention} a été mis à jour.\nDossiers approuvés : ${acceptedChars.length}`)
            .setTimestamp()
            .setFooter({ text: "Flux système" });
          await logChannel.send({ embeds: [logEmbed] });
        }

        // Notification privée
        const user = await client.users.fetch(userId).catch(() => null);
        if (user) {
          const mpEmbed = new EmbedBuilder()
            .setTitle("Mise à jour terminée")
            .setColor(BOT_CONFIG.EMBED_COLOR)
            .setDescription(`Bonjour ${mention},\n\nVos accès au territoire ont été synchronisés. Vos documents sont désormais valides.`)
            .setFooter({ text: "Notification tfrp" });
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
 * Embed du terminal des douanes (SSD)
 */
export async function getSSDComponents() {
  const pendingCount = await getPendingCharactersCount();
  let statusLabel = "Fluide"; let statusEmoji = "🟢";

  if (pendingCount > 50) {
    statusLabel = "Surchargé"; statusEmoji = "🔴";
  } else if (pendingCount > 25) {
    statusLabel = "Ralenti"; statusEmoji = "🟠";
  }

  const embed = new EmbedBuilder()
    .setTitle("Terminal des douanes")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(`État des services : ${statusEmoji} ${statusLabel}\n\n` +
      "Légende :\n" +
      "⚫ Hors-ligne\n" +
      "🔴 Surchargé - Délai prolongé\n" +
      "🟠 Perturbé - Délai modéré\n" +
      "🟢 Fluide - Délai court")
    .addFields(
      { name: "Dossiers en attente", value: `${pendingCount} fiches`, inline: false },
      { name: "Dernière analyse", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: false }
    )
    .setFooter({ text: "Douanes tfrp" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_reload_ssd').setLabel('Actualiser le signal').setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [embed], components: [row] };
}

export function getPersonnagesHomeEmbed(mention) {
  return new EmbedBuilder()
    .setTitle("Gestion des identités")
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .setDescription(`Bienvenue sur votre interface citoyenne, ${mention}.\n\nVeuillez sélectionner un dossier pour consultation.`);
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
      { name: "Profession", value: char.job || "Sans emploi", inline: true },
      { name: "Permis", value: `${char.driver_license_points ?? 12}/12 pts`, inline: true },
      { name: "Dernière révision", value: verifierMention, inline: false }
    )
    .setFooter({ text: `Référence : ${char.id}` });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('btn_back_to_list').setLabel('Retour aux dossiers').setStyle(ButtonStyle.Secondary)
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
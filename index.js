
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder
} from "discord.js";
import { BOT_CONFIG } from "./bot-config.js";
import { 
  getNewValidations, 
  getUserAcceptedCharacters, 
  getAllUserCharacters, 
  getProfile,
  supabase 
} from "./bot-db.js";
import { 
  sendWelcomeTutorial, 
  kickUnverified, 
  handleUnverified, 
  handleVerification,
  updateCustomsStatus
} from "./bot-services.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMembers, 
    GatewayIntentBits.GuildMessages
  ]
});

let lastScheduledPostDate = ""; // Pour éviter les doubles posts dans la même minute

/* ================= SCANS PÉRIODIQUES ================= */

async function runScans() {
  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const todayKey = now.toDateString() + currentTimeStr;

  // 1. Mise à jour automatique de l'activité du bot (toutes les 5 min)
  await updateCustomsStatus(client, false);

  // 2. Vérification planification SSD (9:10 et 19:10)
  if ((currentTimeStr === "09:15" || currentTimeStr === "19:15") && lastScheduledPostDate !== todayKey) {
    lastScheduledPostDate = todayKey;
    console.log(`[SYSTEM] Envoi automatique du statut SSD à ${currentTimeStr}`);
    await updateCustomsStatus(client, true);
  }

  // 3. Scan des nouvelles fiches acceptées sur le site
  const newChars = await getNewValidations();
  if (newChars.length > 0) {
    const charsByUser = {};
    newChars.forEach(c => {
      if (!charsByUser[c.user_id]) charsByUser[c.user_id] = [];
      charsByUser[c.user_id].push(c);
    });
    for (const userId in charsByUser) {
      await handleVerification(client, userId, charsByUser[userId]);
    }
  }

  // 4. Scan de sécurité (Kick si perso supprimé ou invalide sur guildes protégées)
  for (const guildId of BOT_CONFIG.PROTECTED_GUILDS) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) continue;
    try {
      const members = await guild.members.fetch();
      for (const [id, member] of members) {
        if (member.user.bot) continue;
        const acceptedChars = await getUserAcceptedCharacters(id);
        if (acceptedChars.length === 0) {
           await kickUnverified(member);
        } else {
           await handleVerification(client, id, acceptedChars);
        }
      }
    } catch (err) { console.error(`Erreur scan security ${guildId}: ${err.message}`); }
  }
}

/* ================= INITIALISATION ================= */

client.once("ready", async () => {
  console.log(`[SYSTEM] ${client.user.tag} est opérationnel.`);

  const commands = [
    new SlashCommandBuilder().setName('verification').setDescription('Force la vérification de vos fiches personnages'),
    new SlashCommandBuilder().setName('personnages').setDescription('Affiche vos personnages et leurs détails'),
    new SlashCommandBuilder().setName('ssd').setDescription('Force l\'envoi du statut des douanes (Staff)')
  ].map(c => c.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try { 
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands }); 
  } catch (e) { console.error(e); }

  // Premier scan immédiat
  runScans();
  
  // Boucle de scan toutes les minutes pour la précision de l'horloge SSD
  setInterval(runScans, 60000); 
});

/* ================= ÉVÉNEMENTS ================= */

client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;
  await sendWelcomeTutorial(member);
  
  const acceptedChars = await getUserAcceptedCharacters(member.id);
  if (acceptedChars.length > 0) {
    await handleVerification(client, member.id, acceptedChars);
  } else {
    if (BOT_CONFIG.PROTECTED_GUILDS.includes(member.guild.id)) {
      await kickUnverified(member);
    } else if (member.guild.id === BOT_CONFIG.MAIN_SERVER_ID) {
      await handleUnverified(client, member.id);
    }
  }
});

client.on("interactionCreate", async interaction => {
  // Gestion du menu déroulant des détails personnages
  if (interaction.isStringSelectMenu() && interaction.customId === 'select_char_details') {
    await interaction.deferUpdate();
    const charId = interaction.values[0];
    const { data: char } = await supabase.from("characters").select("*").eq("id", charId).single();

    if (!char) return interaction.followUp({ content: "Erreur récupération fiche.", ephemeral: true });

    const staffProfile = char.verifiedby ? await getProfile(char.verifiedby) : null;
    const birthDate = char.birth_date ? new Date(char.birth_date).toLocaleDateString('fr-FR') : "Inconnue";
    const statusMap = { 'pending': 'En attente', 'accepted': 'Validé', 'rejected': 'Refusé' };

    const detailEmbed = new EmbedBuilder()
      .setTitle(`Fiche : ${char.first_name} ${char.last_name}`)
      .setColor(BOT_CONFIG.COLORS.DARK_BLUE)
      .addFields(
        { name: "Identité", value: `**Nom:** ${char.last_name}\n**Prénom:** ${char.first_name}\n**Âge:** ${char.age || '?'} ans`, inline: false },
        { name: "Naissance", value: `**Date:** ${birthDate}\n**Lieu:** ${char.birth_place || 'Inconnu'}`, inline: false },
        { name: "Statut", value: `**État:** ${statusMap[char.status] || char.status}\n**Métier:** ${char.job || 'Chômeur'}\n**Alignement:** ${char.alignment || 'Neutre'}`, inline: false },
        { name: "Permis & Légal", value: `**Points Permis:** ${char.driver_license_points}/12\n**Barreau:** ${char.bar_passed ? "Oui" : "Non"}`, inline: false },
        { name: "Douane", value: `**Validé par:** ${staffProfile?.username || "Non renseigné"}`, inline: false }
      )
      .setFooter({ text: `Réf: ${char.id} • TFRP Manager` });

    return interaction.editReply({ embeds: [detailEmbed] }); 
  }

  if (!interaction.isChatInputCommand()) return;
  const { commandName, user, member } = interaction;

  try {
      if (commandName === "ssd") {
        if (!member.permissions.has(PermissionFlagsBits.ManageMessages)) {
          return interaction.reply({ content: "Vous n'avez pas la permission.", ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        await updateCustomsStatus(client, true);
        return interaction.editReply({ content: "Le statut SSD a été envoyé avec succès." });
      }

      if (commandName === "verification") {
        await interaction.deferReply({ ephemeral: true });
        const acceptedChars = await getUserAcceptedCharacters(user.id);

        if (acceptedChars.length > 0) {
          const hasNew = acceptedChars.some(c => c.is_notified !== true);
          await handleVerification(client, user.id, acceptedChars);
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(BOT_CONFIG.COLORS.DARK_BLUE).setDescription(hasNew ? "Vos accès ont été mis à jour." : "Votre compte est déjà à jour.")] });
        } else {
          await handleUnverified(client, user.id);
          return interaction.editReply({ embeds: [new EmbedBuilder().setColor(BOT_CONFIG.COLORS.ERROR).setDescription("Aucun personnage accepté trouvé.")] });
        }
      }

      if (commandName === "personnages") {
        await interaction.deferReply({ ephemeral: true });
        const allChars = await getAllUserCharacters(user.id);

        if (allChars.length === 0) return interaction.editReply({ content: "Aucun personnage enregistré." });

        const selectMenu = new StringSelectMenuBuilder().setCustomId('select_char_details').setPlaceholder('Choisir un personnage');
        allChars.slice(0, 25).forEach(char => {
            selectMenu.addOptions(new StringSelectMenuOptionBuilder()
                .setLabel(`${char.first_name} ${char.last_name}`)
                .setDescription(`Métier: ${char.job || 'Aucun'} | Statut: ${char.status}`)
                .setValue(char.id)
            );
        });

        const embed = new EmbedBuilder().setTitle("Vos Personnages").setDescription("Sélectionnez une fiche pour voir les détails.").setColor(BOT_CONFIG.COLORS.DARK_BLUE);
        return interaction.editReply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(selectMenu)] });
      }
  } catch (e) {
      if (interaction.deferred || interaction.replied) await interaction.editReply({ content: "Erreur technique." }).catch(() => {});
  }
});

client.login(process.env.DISCORD_TOKEN);

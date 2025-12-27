import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { getAllUserCharacters, getCharacterById } from "../../bot-db.js";
import { BOT_CONFIG } from "../../bot-config.js";

export const personnagesCommand = {
  data: new SlashCommandBuilder()
    .setName('personnages')
    .setDescription('Consulter les dossiers citoyens')
    .addUserOption(opt => opt.setName('cible').setDescription('Le citoyen à consulter (laisser vide pour soi)')),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('cible') || interaction.user;
    const allChars = await getAllUserCharacters(targetUser.id);
    
    const embed = new EmbedBuilder()
      .setTitle(`Terminal Citoyen : ${targetUser.username}`)
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setDescription(`Consultation des archives pour <@${targetUser.id}>.\nVeuillez sélectionner une fiche ci-dessous pour voir les détails.`);

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_char_manage')
      .setPlaceholder('Sélectionner un dossier');

    if (allChars.length > 0) {
      allChars.forEach(char => {
        selectMenu.addOptions(new StringSelectMenuOptionBuilder()
          .setLabel(`${char.first_name} ${char.last_name}`)
          .setDescription(`Statut : ${char.status.toUpperCase()}`)
          .setValue(char.id)
        );
      });
    } else {
      selectMenu.addOptions(new StringSelectMenuOptionBuilder().setLabel("Aucune donnée").setValue("none").setDisabled(true));
    }

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};

export async function handlePersonnagesSelect(interaction) {
  await interaction.deferUpdate();
  const char = await getCharacterById(interaction.values[0]);
  if (!char) return;

  const statusEmoji = char.status === 'accepted' ? '🟢' : char.status === 'rejected' ? '🔴' : '🟡';
  const alignLabel = char.alignment === 'illegal' ? 'Clandestin' : 'Civil';

  const embed = new EmbedBuilder()
    .setTitle(`Dossier : ${char.first_name} ${char.last_name}`)
    .setColor(BOT_CONFIG.EMBED_COLOR)
    .addFields(
      { name: "Identité", value: `${char.first_name} ${char.last_name}`, inline: true },
      { name: "Âge", value: `${char.age} ans`, inline: true },
      { name: "Orientation", value: alignLabel, inline: true },
      { name: "Profession", value: char.job || "Sans emploi", inline: true },
      { name: "Points Permis", value: `${char.driver_license_points ?? 12}/12`, inline: true },
      { name: "Statut", value: `${statusEmoji} ${char.status.toUpperCase()}`, inline: true }
    )
    .setFooter({ text: "Transmission TFRP • Terminal Sécurisé" });

  const row = new ActionRowBuilder();
  
  // Bouton de lien vers le panel (Cliquable si pas en attente)
  const isActionable = char.status !== 'pending';
  const linkBtn = new ButtonBuilder()
    .setLabel('Modifier sur le Panel')
    .setURL(BOT_CONFIG.SITE_URL)
    .setStyle(ButtonStyle.Link);
    
  if (!isActionable) {
    // Si c'est en attente, on ne peut pas vraiment mettre un URL "disabled" sur un LinkButton, 
    // donc on n'ajoute pas le bouton ou on change le texte.
    linkBtn.setLabel('Dossier en cours de traitement...').setURL(BOT_CONFIG.SITE_URL);
  }
  
  row.addComponents(linkBtn);

  await interaction.editReply({ embeds: [embed], components: [row] });
}
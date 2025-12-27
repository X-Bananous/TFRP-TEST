
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { BOT_CONFIG } from "../../bot-config.js";
import { getProfile } from "../../bot-db.js";

export const aideCommand = {
  data: new SlashCommandBuilder()
    .setName('aide')
    .setDescription('Afficher la liste des commandes disponibles'),

  async execute(interaction) {
    const profile = await getProfile(interaction.user.id);
    const perms = profile?.permissions || {};

    const embed = new EmbedBuilder()
      .setTitle("Manuel d'utilisation TFRP")
      .setColor(BOT_CONFIG.EMBED_COLOR)
      .setDescription("Voici les commandes auxquelles vous avez accès sur ce terminal.")
      .addFields(
        { name: "👤 Citoyen", value: "`/personnages` : Voir vos dossiers\n`/verification` : Synchroniser vos rôles\n`/panel` : Lien vers le site web", inline: false },
        { name: "🛂 Douanes", value: "`/status` : Voir l'état des services", inline: false }
      )
      .setTimestamp()
      .setFooter({ text: "TFRP Support Technique" });

    if (perms.can_use_say || perms.can_use_dm || perms.can_approve_characters) {
      embed.addFields({ 
        name: "🛡️ Administration (Staff)", 
        value: "`/ssd` : Déployer le terminal SSD\n`/say` : Faire parler le bot\n`/dm` : Envoyer un message privé", 
        inline: false 
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

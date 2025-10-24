import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  StringSelectMenuBuilder,
  Events,
} from "discord.js";
import "dotenv/config";
import config from "./config.json" with { type: "json" };
const { reportChannelId } = config;

const client = new Client({
  intents: [GatewayIntentBits.Guilds], // apenas necessário
});

client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot ligado como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    // Slash command
    if (interaction.isChatInputCommand() && interaction.commandName === "painel-timeout") {
      const embed = new EmbedBuilder()
        .setTitle("Painel de Timeout")
        .setDescription("Cliquem no botão para dar timeout.")
        .setColor("Grey");

      const button = new ButtonBuilder()
        .setCustomId("abrir_modal_timeout")
        .setLabel("Aplicar Timeout")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({
        embeds: [embed],
        components: [row],
      });
    }

    // Botão clicado → select menu duração
    if (interaction.isButton() && interaction.customId === "abrir_modal_timeout") {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("duracao_timeout")
        .setPlaceholder("Escolhe a duração do timeout")
        .addOptions([
          { label: "60 segundos", value: "60" },
          { label: "5 minutos", value: "300" },
          { label: "10 minutos", value: "600" },
          { label: "1 hora", value: "3600" },
          { label: "1 dia", value: "86400" },
          { label: "1 semana", value: "604800" },
        ]);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: "Escolhe a duração do timeout:",
        components: [row],
        ephemeral: true,
      });
    }

    // Select menu → modal com ID, relatório e link do clip
    if (interaction.isStringSelectMenu() && interaction.customId === "duracao_timeout") {
      const duracao = interaction.values[0];

      const modal = new ModalBuilder()
        .setCustomId(`modal_timeout_${duracao}`)
        .setTitle("Timeout - ID, Relatório e Clip");

      const idInput = new TextInputBuilder()
        .setCustomId("membro_id")
        .setLabel("ID do membro")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const reportInput = new TextInputBuilder()
        .setCustomId("relatorio")
        .setLabel("Relatório")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const clipInput = new TextInputBuilder()
        .setCustomId("clip_medal")
        .setLabel("Link do clip do Medal (opcional)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(idInput),
        new ActionRowBuilder().addComponents(reportInput),
        new ActionRowBuilder().addComponents(clipInput)
      );

      await interaction.showModal(modal);
    }

    // Modal submetido → aplica timeout e envia relatório
    if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_timeout_")) {
      const duracao = parseInt(interaction.customId.split("_").pop());
      const membroId = interaction.fields.getTextInputValue("membro_id");
      const relatorio = interaction.fields.getTextInputValue("relatorio");
      const clip = interaction.fields.getTextInputValue("clip_medal");

      const guild = interaction.guild;
      if (!guild) return;

      const member = await guild.members.fetch(membroId).catch(() => null);
      if (!member)
        return interaction.reply({ content: "⚠️ Membro não encontrado pelo ID.", ephemeral: true });

      // Aplica timeout
      try {
        await member.timeout(duracao * 1000, `Aplicado via painel: ${relatorio}`);
      } catch (err) {
        console.error(err);
        await interaction.followUp({
          content: "❌ Falha ao aplicar timeout. Verifica permissões e hierarquia do bot.",
          ephemeral: true
        });
        return;
      }

      // Envia relatório
      const canal = await client.channels.fetch(reportChannelId);
      if (!canal) {
        return interaction.reply({ content: "⚠️ Canal de relatórios não encontrado.", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle("🕒 Relatório de Timeout")
        .setColor("DarkGrey")
        .addFields(
          { name: "Autor", value: `${interaction.user}`, inline: true },
          { name: "Membro", value: `${member}`, inline: true },
          { name: "Duração", value: `${duracao} segundos`, inline: true },
          { name: "Relatório", value: relatorio }
        )
        .setTimestamp();

      if (clip) {
        embed.addFields({ name: "Clip Medal", value: clip });
      }

      await canal.send({ embeds: [embed] });

      await interaction.reply({
        content: `✅ Timeout de ${duracao} segundos aplicado a ${member}. Relatório enviado!`,
        ephemeral: true,
      });
    }

  } catch (err) {
    console.error(err);
  }
});

client.login(process.env.TOKEN);

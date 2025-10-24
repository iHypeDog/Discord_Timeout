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
import express from "express";
import config from "./config.json" with { type: "json" };
const { reportChannelId } = config;

// --- DISCORD CLIENT ---
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// --- EXPRESS SERVER ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("🤖 Bot ativo!"));

app.listen(PORT, () => console.log(`🌐 Servidor HTTP ativo na porta ${PORT}`));

// --- BOT READY ---
client.once(Events.ClientReady, () => {
  console.log(`🤖 Bot ligado como ${client.user.tag}`);
});

// --- INTERACTIONS ---
client.on(Events.InteractionCreate, async interaction => {
  try {
    // --- Slash Command ---
    if (interaction.isChatInputCommand() && interaction.commandName === "painel-timeout") {
      const embed = new EmbedBuilder()
        .setTitle("Painel de Timeout")
        .setDescription("Clique abaixo para aplicar um timeout e enviar um relatório.")
        .setColor("Grey");

      const button = new ButtonBuilder()
        .setCustomId("abrir_modal_timeout")
        .setLabel("Aplicar Timeout")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(button);

      return interaction.reply({ embeds: [embed], components: [row] });
    }

    // --- Botão clicado → Select Menu duração ---
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

      return interaction.reply({
        content: "Escolhe a duração do timeout:",
        components: [row],
        ephemeral: true,
      });
    }

    // --- Select Menu → Modal ---
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

      return interaction.showModal(modal);
    }

    // --- Modal submetido ---
    if (interaction.isModalSubmit() && interaction.customId.startsWith("modal_timeout_")) {
      const duracao = parseInt(interaction.customId.split("_").pop());
      const membroId = interaction.fields.getTextInputValue("membro_id");
      const relatorio = interaction.fields.getTextInputValue("relatorio");
      const clip = interaction.fields.getTextInputValue("clip_medal");

      const guild = interaction.guild;
      if (!guild)
        return interaction.reply({ content: "⚠️ Este comando só funciona em servidores.", ephemeral: true });

      const member = await guild.members.fetch(membroId).catch(() => null);
      if (!member)
        return interaction.reply({ content: "⚠️ Membro não encontrado pelo ID.", ephemeral: true });

      // --- Aplica Timeout ---
      try {
        await member.timeout(duracao * 1000, `Aplicado via painel: ${relatorio}`);
      } catch (err) {
        console.error(err);
        return interaction.reply({
          content: "❌ Falha ao aplicar timeout. Verifica permissões e hierarquia do bot.",
          ephemeral: true,
        });
      }

      // --- Envia relatório ---
      const canal = await client.channels.fetch(reportChannelId).catch(() => null);
      if (!canal)
        return interaction.reply({ content: "⚠️ Canal de relatórios não encontrado.", ephemeral: true });

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

      if (clip) embed.addFields({ name: "Clip Medal", value: clip });

      await canal.send({ embeds: [embed] });

      return interaction.reply({
        content: `✅ Timeout de ${duracao} segundos aplicado a ${member}. Relatório enviado!`,
        ephemeral: true,
      });
    }

  } catch (err) {
    console.error(err);
    if (!interaction.replied)
      interaction.reply({ content: "❌ Ocorreu um erro inesperado.", ephemeral: true });
  }
});

// --- LOGIN ---
client.login(process.env.TOKEN);

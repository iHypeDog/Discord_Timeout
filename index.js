import {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";
import "dotenv/config";
import express from "express";
import config from "./config.json" with { type: "json" };
const { reportChannelId } = config; // Mantido caso precises no futuro

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
    // --- Comando /aviso ---
    if (interaction.isChatInputCommand() && interaction.commandName === "aviso") {
      const modal = new ModalBuilder()
        .setCustomId("aviso_modal")
        .setTitle("Criar Aviso - Embed");

      const tituloInput = new TextInputBuilder()
        .setCustomId("titulo")
        .setLabel("Título da Embed")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(256)
        .setRequired(true);

      const descricaoInput = new TextInputBuilder()
        .setCustomId("descricao")
        .setLabel("Descrição / Conteúdo")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      const corInput = new TextInputBuilder()
        .setCustomId("cor")
        .setLabel("Cor em hex (ex: #ff0000)")
        .setPlaceholder("#5865F2 (padrão do Discord)")
        .setStyle(TextInputStyle.Short)
        .setMaxLength(7)
        .setRequired(false);

      const imagemInput = new TextInputBuilder()
        .setCustomId("imagem")
        .setLabel("URL da Imagem Grande")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const thumbnailInput = new TextInputBuilder()
        .setCustomId("thumbnail")
        .setLabel("URL do Thumbnail (canto)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(tituloInput),
        new ActionRowBuilder().addComponents(descricaoInput),
        new ActionRowBuilder().addComponents(corInput),
        new ActionRowBuilder().addComponents(imagemInput),
        new ActionRowBuilder().addComponents(thumbnailInput)
      );

      await interaction.showModal(modal);
    }

    // --- Submissão do Modal ---
    if (interaction.isModalSubmit() && interaction.customId === "aviso_modal") {
      const titulo = interaction.fields.getTextInputValue("titulo");
      const descricao = interaction.fields.getTextInputValue("descricao") || null;
      const corHex = interaction.fields.getTextInputValue("cor") || "#5865F2";
      const imagem = interaction.fields.getTextInputValue("imagem") || null;
      const thumbnail = interaction.fields.getTextInputValue("thumbnail") || null;

      // Converte cor hex para inteiro
      let corInt = 0x5865F2; // padrão Discord
      try {
        corInt = parseInt(corHex.replace("#", ""), 16);
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle(titulo)
        .setDescription(descricao)
        .setColor(corInt)
        .setTimestamp()
        .setFooter({
          text: `Aviso enviado por ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      if (imagem) embed.setImage(imagem);
      if (thumbnail) embed.setThumbnail(thumbnail);

      // Envia a embed no canal onde o comando foi usado
      await interaction.reply({ embeds: [embed] });

      // Alternativa: enviar num canal fixo (ex: canal de avisos)
      // const canalAvisos = client.channels.cache.get("ID_DO_CANAL");
      // if (canalAvisos) await canalAvisos.send({ embeds: [embed] });
      // await interaction.reply({ content: "✅ Aviso enviado com sucesso!", ephemeral: true });
    }

  } catch (err) {
    console.error(err);
    if (!interaction.replied && interaction.isRepliable()) {
      await interaction.reply({ content: "❌ Ocorreu um erro inesperado.", ephemeral: true }).catch(() => {});
    }
  }
});

// --- LOGIN ---
client.login(process.env.TOKEN);
import {
  Client,
  GatewayIntentBits,
  Events,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import "dotenv/config";
import express from "express";
import fs from "fs";
import config from "./config.json" with { type: "json" };

const { 
  reportChannelId, 
  godRoleId = "1421249335877832816", 
  logsChannelId = "1431347167997726730" 
} = config;

// Cor padrão para todas as embeds públicas do bot
const PUBLIC_EMBED_COLOR = 0x40ff73; // #40ff73

// --- ARMAZENAMENTO DE CACHAÇOS PENDENTES ---
const pendingsFile = "./pendings.json";
let pendings = {};

if (fs.existsSync(pendingsFile)) {
  pendings = JSON.parse(fs.readFileSync(pendingsFile, "utf8"));
}

function savePendings() {
  fs.writeFileSync(pendingsFile, JSON.stringify(pendings, null, 2));
}

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
        .setPlaceholder("#40ff73")
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
      return;
    }

    // --- Comando /cachacos ---
    if (interaction.isChatInputCommand() && interaction.commandName === "cachacos") {
      if (!interaction.member.roles.cache.has(godRoleId)) {
        return await interaction.reply({ content: "❌ Você não tem permissão para usar este comando.", ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle("Gerenciar Cachaços Pendentes")
        .setDescription("Escolha uma ação abaixo:")
        .setColor(PUBLIC_EMBED_COLOR);

      const addButton = new ButtonBuilder()
        .setCustomId("add_cachacos")
        .setLabel("Adicionar Pendentes")
        .setStyle(ButtonStyle.Primary);

      const removeButton = new ButtonBuilder()
        .setCustomId("remove_cachacos")
        .setLabel("Remover Pendentes")
        .setStyle(ButtonStyle.Danger);

      const checkButton = new ButtonBuilder()
        .setCustomId("check_cachacos")
        .setLabel("Consultar Pendentes")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(addButton, removeButton, checkButton);

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: false });
      return;
    }

    // --- Botões ---
    if (interaction.isButton()) {
      if (!interaction.member.roles.cache.has(godRoleId)) {
        return await interaction.reply({ content: "❌ Você não tem permissão para esta ação.", ephemeral: true });
      }

      if (interaction.customId === "add_cachacos") {
        const modal = new ModalBuilder()
          .setCustomId("add_modal")
          .setTitle("Adicionar Cachaços Pendentes");

        const userIdInput = new TextInputBuilder()
          .setCustomId("user_id")
          .setLabel("ID do Usuário")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const regrasInput = new TextInputBuilder()
          .setCustomId("regras")
          .setLabel("Regras Descumpridas")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        const quantidadeInput = new TextInputBuilder()
          .setCustomId("quantidade")
          .setLabel("Quantidade de Cachaços")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const clipInput = new TextInputBuilder()
          .setCustomId("clip")
          .setLabel("URL do Clipe (opcional)")
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        modal.addComponents(
          new ActionRowBuilder().addComponents(userIdInput),
          new ActionRowBuilder().addComponents(regrasInput),
          new ActionRowBuilder().addComponents(quantidadeInput),
          new ActionRowBuilder().addComponents(clipInput)
        );

        await interaction.showModal(modal);
      }

      else if (interaction.customId === "remove_cachacos") {
        const modal = new ModalBuilder()
          .setCustomId("remove_modal")
          .setTitle("Remover Cachaços Pendentes");

        const userIdInput = new TextInputBuilder()
          .setCustomId("user_id")
          .setLabel("ID do Usuário")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const quantidadeInput = new TextInputBuilder()
          .setCustomId("quantidade")
          .setLabel("Quantidade a Remover")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(userIdInput),
          new ActionRowBuilder().addComponents(quantidadeInput)
        );

        await interaction.showModal(modal);
      }

      else if (interaction.customId === "check_cachacos") {
        const modal = new ModalBuilder()
          .setCustomId("check_modal")
          .setTitle("Consultar Cachaços Pendentes");

        const userIdInput = new TextInputBuilder()
          .setCustomId("user_id")
          .setLabel("ID do Usuário")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(userIdInput));

        await interaction.showModal(modal);
      }
      return;
    }

    // --- Submissão de Modals ---
    if (interaction.isModalSubmit()) {
      // Modal do /aviso
      if (interaction.customId === "aviso_modal") {
        const titulo = interaction.fields.getTextInputValue("titulo");
        const descricao = interaction.fields.getTextInputValue("descricao") || null;
        const corHex = interaction.fields.getTextInputValue("cor") || "#40ff73";
        const imagem = interaction.fields.getTextInputValue("imagem") || null;
        const thumbnail = interaction.fields.getTextInputValue("thumbnail") || null;

        let corInt = PUBLIC_EMBED_COLOR;
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

        await interaction.reply({ embeds: [embed] });
        return;
      }

      // Adicionar cachaços
      else if (interaction.customId === "add_modal") {
        const userId = interaction.fields.getTextInputValue("user_id").trim();
        const regras = interaction.fields.getTextInputValue("regras");
        const quantStr = interaction.fields.getTextInputValue("quantidade");
        const clip = interaction.fields.getTextInputValue("clip") || "Nenhum";

        const quantidade = parseInt(quantStr);
        if (isNaN(quantidade) || quantidade <= 0) {
          return await interaction.reply({ content: "❌ Quantidade inválida.", ephemeral: true });
        }

        if (!pendings[userId]) pendings[userId] = 0;
        pendings[userId] += quantidade;
        const total = pendings[userId];
        savePendings();

        // Embed para logs (público no canal de logs) → cor #40ff73
        const logEmbed = new EmbedBuilder()
          .setTitle("Cachaços Pendentes Adicionados")
          .setColor(PUBLIC_EMBED_COLOR)
          .addFields(
            { name: "Usuário", value: `<@${userId}> (${userId})`, inline: true },
            { name: "Quantidade Adicionada", value: quantidade.toString(), inline: true },
            { name: "Total Pendentes", value: total.toString(), inline: true },
            { name: "Regras Descumpridas", value: regras },
            { name: "Clipe", value: clip === "Nenhum" ? "Nenhum" : clip }
          )
          .setFooter({ text: `Ação por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        // Embed DM (privado) → mantém vermelho para destaque
        const dmEmbed = new EmbedBuilder()
          .setTitle("Você Recebeu Cachaços Pendentes")
          .setColor(0xFF0000)
          .addFields(
            { name: "Quantidade", value: quantidade.toString(), inline: true },
            { name: "Total Pendentes", value: total.toString(), inline: true },
            { name: "Motivo", value: regras },
            { name: "Clipe", value: clip === "Nenhum" ? "Nenhum" : clip }
          )
          .setFooter({ text: "Ação registrada pelos Gods" })
          .setTimestamp();

        const logsChannel = client.channels.cache.get(logsChannelId);
        if (logsChannel) await logsChannel.send({ embeds: [logEmbed] });

        try {
          const user = await client.users.fetch(userId);
          await user.send({ embeds: [dmEmbed] });
        } catch (err) {
          console.error("Erro ao enviar DM:", err);
        }

        await interaction.reply({ content: "✅ Cachaços adicionados com sucesso!", ephemeral: true });
        return;
      }

      // Remover cachaços
      else if (interaction.customId === "remove_modal") {
        const userId = interaction.fields.getTextInputValue("user_id").trim();
        const quantStr = interaction.fields.getTextInputValue("quantidade");

        const quantidade = parseInt(quantStr);
        if (isNaN(quantidade) || quantidade <= 0) {
          return await interaction.reply({ content: "❌ Quantidade inválida.", ephemeral: true });
        }

        if (!pendings[userId] || pendings[userId] < quantidade) {
          return await interaction.reply({ content: "❌ O usuário não tem cachaços suficientes para remover.", ephemeral: true });
        }

        pendings[userId] -= quantidade;
        const total = pendings[userId];
        if (total <= 0) delete pendings[userId];
        savePendings();

        // Embed para logs (público) → cor #40ff73
        const logEmbed = new EmbedBuilder()
          .setTitle("Cachaços Pendentes Removidos")
          .setColor(PUBLIC_EMBED_COLOR)
          .addFields(
            { name: "Usuário", value: `<@${userId}> (${userId})`, inline: true },
            { name: "Quantidade Removida", value: quantidade.toString(), inline: true },
            { name: "Total Pendentes", value: total.toString(), inline: true }
          )
          .setFooter({ text: `Ação por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        // Embed DM (privado) → verde claro para positivo
        const dmEmbed = new EmbedBuilder()
          .setTitle("Cachaços Pendentes Removidos")
          .setColor(0x00FF00)
          .addFields(
            { name: "Quantidade Removida", value: quantidade.toString(), inline: true },
            { name: "Total Pendentes Agora", value: total.toString(), inline: true }
          )
          .setFooter({ text: "Ação realizada pelos Gods" })
          .setTimestamp();

        const logsChannel = client.channels.cache.get(logsChannelId);
        if (logsChannel) await logsChannel.send({ embeds: [logEmbed] });

        try {
          const user = await client.users.fetch(userId);
          await user.send({ embeds: [dmEmbed] });
        } catch (err) {
          console.error("Erro ao enviar DM:", err);
        }

        await interaction.reply({ content: "✅ Cachaços removidos com sucesso!", ephemeral: true });
        return;
      }

      // Consultar cachaços
      else if (interaction.customId === "check_modal") {
        const userId = interaction.fields.getTextInputValue("user_id").trim();

        const pendentes = pendings[userId] || 0;

        const resultEmbed = new EmbedBuilder()
          .setTitle("Consulta de Cachaços Pendentes")
          .setColor(PUBLIC_EMBED_COLOR)
          .addFields(
            { name: "Usuário", value: `<@${userId}> (${userId})`, inline: false },
            { name: "Cachaços Pendentes", value: `**${pendentes}**`, inline: false }
          )
          .setFooter({ text: `Consulta feita por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();

        await interaction.reply({ embeds: [resultEmbed], ephemeral: true });
        return;
      }
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
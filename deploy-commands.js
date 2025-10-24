import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const commands = [
  new SlashCommandBuilder()
    .setName("painel-timeout")
    .setDescription("Cria um painel para aplicar timeout e enviar relatório.")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

try {
  console.log("⏳ A registar comandos...");
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );
  console.log("✅ Comandos registados com sucesso!");
} catch (error) {
  console.error("❌ Erro ao registar comandos:", error);
}

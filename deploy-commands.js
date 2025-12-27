import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const commands = [
  new SlashCommandBuilder()
    .setName("aviso")
    .setDescription("Cria um anúncio personalizado com embed através de um formulário"),
  new SlashCommandBuilder()
    .setName("cachacos")
    .setDescription("Gerenciar cachaços pendentes (apenas para gods)")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

try {
  console.log("⏳ A registar comandos...");

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID), // Registo global
    { body: commands }
  );

  console.log("✅ Comandos registados com sucesso!");
} catch (error) {
  console.error("❌ Erro ao registar comandos:", error);
}
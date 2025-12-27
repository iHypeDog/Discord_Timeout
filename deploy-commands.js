import { REST, Routes, SlashCommandBuilder } from "discord.js";
import "dotenv/config";

const commands = [
  new SlashCommandBuilder()
    .setName("aviso")
    .setDescription("Cria um anúncio personalizado com embed através de um formulário")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

try {
  console.log("⏳ A registar comandos...");

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID), // Registo global (demora até 1h)
    // Para teste rápido num servidor específico (recomendado no início):
    // Routes.applicationGuildCommands(process.env.CLIENT_ID, "ID_DO_SEU_SERVIDOR"),
    { body: commands }
  );

  console.log("✅ Comandos registados com sucesso!");
} catch (error) {
  console.error("❌ Erro ao registar comandos:", error);
}
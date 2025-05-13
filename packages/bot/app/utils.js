import "dotenv/config";
import { fileURLToPath, pathToFileURL } from "url";
import { readdirSync } from "fs";
import path from "path";

export function getModified(date) {
  const timestamp = Math.floor(date.getTime() / 1000);
  return `Updated <t:${timestamp}:R>`;
}

export async function loadCommands(app) {
  app.commands = new Map();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const commandsPath = path.resolve(__dirname, "commands");
  const commandFiles = readdirSync(commandsPath).filter((file) =>
    file.endsWith(".js")
  );

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const fileUrl = pathToFileURL(filePath); // Convert to a file URL
    const command = await import(fileUrl.href); // Use the URL with import
    if ("data" in command && "execute" in command) {
      app.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

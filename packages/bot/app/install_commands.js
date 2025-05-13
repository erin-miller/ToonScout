import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const fileUrl = pathToFileURL(filePath);
  const command = await import(fileUrl);
  if ("data" in command && "execute" in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

const isProduction = process.env.NODE_ENV === "production";
const APP_ID = isProduction ? process.env.APP_ID_PROD : process.env.APP_ID_DEV;

try {
  const response = await fetch(process.env.API_LINK + "/bot/install-commands", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ APP_ID, commands }),
  });

  if (!response.ok) {
    throw new Error("Failed to install commands.");
  }
} catch (error) {
  console.error("Error during install:", error);
}

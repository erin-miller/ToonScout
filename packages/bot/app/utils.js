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

export async function getScoutToken(target) {
  try {
    const response = await fetch(
      process.env.API_LINK + "/scout/get-scout-token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to install commands.");
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error("Token not found in response.");
    }
    return data.token;
  } catch (error) {
    console.error("Error during install:", error);
  }
}

export async function updateHidden(target) {
  try {
    const response = await fetch(
      process.env.API_LINK + "/scout/update-hidden",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update visibility.");
    }

    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error("Error during visibility update:", error);
  }
}

export function getToonRendition(local_toon, pose) {
  const dna = local_toon.toon.style;
  return `https://rendition.toontownrewritten.com/render/${dna}/${pose}/1024x1024.png`;
}

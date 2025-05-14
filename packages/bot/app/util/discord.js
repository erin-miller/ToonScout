import { fileURLToPath, pathToFileURL } from "url";
import { readdirSync } from "fs";
import path from "path";

async function DiscordRequest(endpoint, options) {
  const isProduction = process.env.NODE_ENV === "production";
  const DISCORD_TOKEN = isProduction
    ? process.env.DISCORD_TOKEN_PROD
    : process.env.DISCORD_TOKEN_DEV;
  // append endpoint to root API URL
  const url = process.env.DISCORD_API_URL + endpoint;
  // Stringify payloads
  if (options.body) options.body = JSON.stringify(options.body);
  const res = await fetch(url, {
    headers: {
      Authorization: `Bot ${DISCORD_TOKEN}`,
      "Content-Type": "application/json; charset=UTF-8",
      "User-Agent": process.env.USER_AGENT,
    },
    ...options,
  });
  // throw API errors
  if (!res.ok) {
    const data = await res.json();
    console.log(res.status);
    throw new Error(JSON.stringify(data));
  }
  // return original response
  return res;
}

export async function InstallGlobalCommands(appId, commands) {
  // API endpoint to overwrite global commands
  const endpoint = `applications/${appId}/commands`;

  try {
    // This is calling the bulk overwrite endpoint: https://discord.com/developers/docs/interactions/application-commands#bulk-overwrite-global-application-commands
    await DiscordRequest(endpoint, { method: "PUT", body: commands });
  } catch (err) {
    console.error(err);
  }
}

export async function loadCommands(app) {
  app.commands = new Map();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const commandsPath = path.resolve(__dirname, "../commands");
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

import "dotenv/config";
import { EmbedBuilder } from "discord.js"

export function getModified(date) {
  const timestamp = Math.floor(date.getTime() / 1000);
  return `Updated <t:${timestamp}:R>`;
}

export function getToonRendition(local_toon, pose) {
  const dna = local_toon.toon.style;
  return `https://rendition.toontownrewritten.com/render/${dna}/${pose}/1024x1024.png`;
}

export function sanitize(data) {
  return data
    .replace(/\\u[0-9a-fA-F]{4}/g, "") // Remove Unicode escape sequences
    .replace(/[\u0000-\u001F\u007F�]/g, ""); // Remove control characters
}

export const carnivalEnums = {
  INACTIVE: "inactive",    // Holiday not running
  RECHARGING: "recharging", // Holiday is running, but the parade isn't scheduled/running
  IN_TRANSIT: "in-transit", // Parade is scheduled but not running
  ACTIVE: "active",        // Parade is running
};

// takes am embed with 25+ fields and splits into multiple
export function multiEmbedBuilder({
  title,
  fields,
  color,
  author,
  description,
  timestamp,
}) {
  const chunkSize = 25;
  const embeds = [];

  for (let i = 0; i < fields.length; i += chunkSize) {
    const embed = new EmbedBuilder()

    if (i === 0) {
      if (author) embed.setAuthor(author);
      if (title) embed.setTitle(title);
    }
    if (color) embed.setColor(color);
    if (description) embed.setDescription(description);
    if (timestamp) embed.setTimestamp(timestamp);

    embed.addFields(fields.slice(i, i + chunkSize));

    if (fields.length > chunkSize) {
      const pageNum = embeds.length + 1;
      const totalPages = Math.ceil(fields.length / chunkSize);
      embed.setFooter({ text: `Page ${pageNum}/${totalPages}` });
    }

    embeds.push(embed);
  }
  return embeds;
}
import "dotenv/config";

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
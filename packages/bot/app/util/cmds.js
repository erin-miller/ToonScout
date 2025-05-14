import "dotenv/config";

export function getModified(date) {
  const timestamp = Math.floor(date.getTime() / 1000);
  return `Updated <t:${timestamp}:R>`;
}

export function getToonRendition(local_toon, pose) {
  const dna = local_toon.toon.style;
  return `https://rendition.toontownrewritten.com/render/${dna}/${pose}/1024x1024.png`;
}

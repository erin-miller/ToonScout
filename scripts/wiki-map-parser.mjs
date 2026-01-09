#!/usr/bin/env node
/**
 * Wiki Map Parser
 *
 * Fetches building pages from the Toontown Rewritten Wiki and extracts
 * location data for use in the ToonScout app.
 *
 * Usage: node scripts/wiki-map-parser.mjs
 * Output: packages/webapp/data/building_maps.json
 *
 * Options:
 *   --limit=N      Only process first N buildings (for testing)
 *   --dry-run      Don't write output file, just print results
 *   --streets-only Only fetch street dimensions and merge into existing JSON
 *                  (much faster - fetches ~17 streets instead of ~500 buildings)
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const API_BASE = "https://toontownrewritten.wiki/api.php";
const API_TIMEOUT_MS = 30000;
const OUTPUT_PATH = join(
  __dirname,
  "../packages/webapp/data/building_maps.json"
);

// Rate limiting
const DELAY_MS = 100;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Parse command line args
const args = process.argv.slice(2);
const limitArg = args.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;
const DRY_RUN = args.includes("--dry-run");
const STREETS_ONLY = args.includes("--streets-only");

async function fetchJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function fetchCategoryMembers(category) {
  const members = [];
  let cmcontinue = null;
  do {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category.replace(/ /g, "_")}`,
      cmlimit: "max",
      format: "json",
    });
    if (cmcontinue) {
      params.append("cmcontinue", cmcontinue);
    }
    const url = `${API_BASE}?${params.toString()}`;
    const data = await fetchJson(url);
    members.push(...data.query.categorymembers);
    cmcontinue = data.continue ? data.continue.cmcontinue : null;
  } while (cmcontinue);
  return members;
}

async function fetchPageWikitext(title) {
  const params = new URLSearchParams({
    action: "query",
    prop: "revisions",
    titles: title,
    rvprop: "content",
    rvslots: "main",
    redirects: "1",
    format: "json",
  });
  const url = `${API_BASE}?${params.toString()}`;
  const data = await fetchJson(url);
  const pages = data.query?.pages ?? {};
  const page = pages[Object.keys(pages)[0]];
  if (!page || !page.revisions?.length) {
    return null;
  }
  const revision = page.revisions[0];
  const slot = revision.slots?.main;
  return slot?.["*"] ?? slot?.content ?? revision["*"] ?? revision.content ?? null;
}

async function fetchPageHtml(title) {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text",
    format: "json",
  });
  const url = `${API_BASE}?${params.toString()}`;
  const data = await fetchJson(url);
  return data.parse?.text?.["*"] ?? null;
}

function extractMarkerPosition(html) {
  if (!html) return null;
  // Match: position:absolute; top:XXpx; left:XXpx
  // The marker div contains Location_mark.png
  const markerDivRegex =
    /position:\s*absolute;\s*top:\s*(\d+)px;\s*left:\s*(\d+)px[^>]*>[\s\S]*?Location_mark\.png/i;
  const match = html.match(markerDivRegex);
  if (match) {
    return {
      top: parseInt(match[1], 10),
      left: parseInt(match[2], 10),
    };
  }
  return null;
}

function extractMapImageDimensions(html) {
  if (!html) return null;
  // Look for the street map image dimensions in the HTML
  // The map image src contains "Street_Map_" prefix (e.g., Street_Map_Loopy_Lane.png)
  // We want the display dimensions (width/height attributes), not data-file-width/height
  // Use non-greedy matching (*?) to get the first width/height, not data-file-width/height
  const mapImgRegex =
    /<img[^>]*?src="[^"]*Street_Map_[^"]*\.(?:png|jpg|webp)"[^>]*?width="(\d+)"[^>]*?height="(\d+)"/i;
  let match = html.match(mapImgRegex);

  if (!match) {
    // Try alternative pattern with height before width
    const altRegex =
      /<img[^>]*?src="[^"]*Street_Map_[^"]*\.(?:png|jpg|webp)"[^>]*?height="(\d+)"[^>]*?width="(\d+)"/i;
    match = html.match(altRegex);
    if (match) {
      // Swap order since height came first
      return {
        wikiWidth: parseInt(match[2], 10),
        wikiHeight: parseInt(match[1], 10),
      };
    }
  }

  if (match) {
    return {
      wikiWidth: parseInt(match[1], 10),
      wikiHeight: parseInt(match[2], 10),
    };
  }

  return null;
}

function extractStreetName(wikitext) {
  // Match |street = Street Name pattern
  const match = wikitext.match(/\|\s*street\s*=\s*([^\n|]+)/i);
  if (!match) return null;
  return match[1].trim();
}

function extractNeighborhood(wikitext) {
  // Match |playground = Neighborhood Name pattern (wiki uses "playground" for neighborhood)
  const match = wikitext.match(/\|\s*playground\s*=\s*([^\n|]+)/i);
  if (!match) return null;
  return match[1].trim();
}

async function main() {
  // --streets-only mode: only fetch street dimensions and merge into existing JSON
  if (STREETS_ONLY) {
    console.log("Streets-only mode: fetching street dimensions...");

    if (!existsSync(OUTPUT_PATH)) {
      console.error("Error: building_maps.json not found. Run without --streets-only first.");
      process.exit(1);
    }

    const existingData = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));

    // Collect unique streets from existing data
    const uniqueStreets = new Set();
    for (const neighborhood of Object.values(existingData)) {
      for (const street of Object.keys(neighborhood)) {
        uniqueStreets.add(street);
      }
    }

    console.log(`Found ${uniqueStreets.size} streets to fetch dimensions for...`);
    const streetDimensions = {};
    const streetList = Array.from(uniqueStreets);

    for (let i = 0; i < streetList.length; i++) {
      const street = streetList[i];
      process.stdout.write(
        `\r[${i + 1}/${streetList.length}] Fetching: ${street.padEnd(30)}`
      );

      try {
        const html = await fetchPageHtml(street);
        const dimensions = extractMapImageDimensions(html);
        if (dimensions) {
          streetDimensions[street] = dimensions;
        } else {
          console.log(`\n  Warning: No map dimensions found for ${street}`);
        }
      } catch (err) {
        console.error(`\n  Error fetching ${street}: ${err.message}`);
      }

      await sleep(DELAY_MS);
    }

    console.log(`\n\nStreet dimensions found: ${Object.keys(streetDimensions).length}/${uniqueStreets.size}`);

    // Merge _meta into existing data
    for (const [neighborhood, streets] of Object.entries(existingData)) {
      for (const [street, streetData] of Object.entries(streets)) {
        if (streetDimensions[street]) {
          streetData._meta = streetDimensions[street];
        }
      }
    }

    if (DRY_RUN) {
      console.log("\n[DRY RUN] Would write to:", OUTPUT_PATH);
      console.log("\nSample _meta values:");
      for (const [street, dims] of Object.entries(streetDimensions).slice(0, 5)) {
        console.log(`  ${street}: ${JSON.stringify(dims)}`);
      }
    } else {
      writeFileSync(OUTPUT_PATH, JSON.stringify(existingData, null, 2));
      console.log(`\nOutput written to: ${OUTPUT_PATH}`);
    }

    return;
  }

  console.log("Fetching building pages from wiki...");

  let buildings = await fetchCategoryMembers("Buildings");
  console.log(`Found ${buildings.length} building pages`);

  if (LIMIT) {
    console.log(`Limiting to first ${LIMIT} buildings (--limit=${LIMIT})`);
    buildings = buildings.slice(0, LIMIT);
  }

  // Structure: { neighborhood: { street: { buildingName: { wikiUrl, markerPosition } } } }
  const buildingMaps = {};
  let successCount = 0;
  let skipCount = 0;
  const skippedBuildings = [];

  for (let i = 0; i < buildings.length; i++) {
    const building = buildings[i];
    const title = building.title;

    process.stdout.write(
      `\r[${i + 1}/${buildings.length}] Processing: ${title.padEnd(40)}`
    );

    try {
      const wikitext = await fetchPageWikitext(title);
      if (!wikitext) {
        skipCount++;
        skippedBuildings.push({ title, reason: "no wikitext" });
        continue;
      }

      const street = extractStreetName(wikitext);
      const neighborhood = extractNeighborhood(wikitext);

      if (!street || !neighborhood) {
        skipCount++;
        skippedBuildings.push({
          title,
          reason: `missing ${!street ? "street" : "neighborhood"}`,
        });
        continue;
      }

      // Fetch HTML to get marker position
      const html = await fetchPageHtml(title);
      const markerPosition = extractMarkerPosition(html);

      // Initialize nested structure if needed
      if (!buildingMaps[neighborhood]) {
        buildingMaps[neighborhood] = {};
      }
      if (!buildingMaps[neighborhood][street]) {
        buildingMaps[neighborhood][street] = {};
      }

      buildingMaps[neighborhood][street][title] = {
        wikiUrl: `https://toontownrewritten.wiki/${title.replace(/ /g, "_")}`,
        markerPosition: markerPosition,
      };

      successCount++;
    } catch (err) {
      console.error(`\nError processing ${title}: ${err.message}`);
      skippedBuildings.push({ title, reason: err.message });
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\nProcessed ${buildings.length} buildings:`);
  console.log(`  - ${successCount} with location data`);
  console.log(`  - ${skipCount} skipped`);

  if (skippedBuildings.length > 0 && skippedBuildings.length <= 20) {
    console.log("\nSkipped buildings:");
    for (const { title, reason } of skippedBuildings) {
      console.log(`  - ${title}: ${reason}`);
    }
  }

  // Collect unique streets to fetch their map dimensions
  const uniqueStreets = new Set();
  for (const neighborhood of Object.values(buildingMaps)) {
    for (const street of Object.keys(neighborhood)) {
      uniqueStreets.add(street);
    }
  }

  console.log(`\nFetching map dimensions for ${uniqueStreets.size} streets...`);
  const streetDimensions = {};
  const streetList = Array.from(uniqueStreets);

  for (let i = 0; i < streetList.length; i++) {
    const street = streetList[i];
    process.stdout.write(
      `\r[${i + 1}/${streetList.length}] Fetching: ${street.padEnd(30)}`
    );

    try {
      const html = await fetchPageHtml(street);
      const dimensions = extractMapImageDimensions(html);
      if (dimensions) {
        streetDimensions[street] = dimensions;
      } else {
        console.log(`\n  Warning: No map dimensions found for ${street}`);
      }
    } catch (err) {
      console.error(`\n  Error fetching ${street}: ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\n\nStreet dimensions found: ${Object.keys(streetDimensions).length}/${uniqueStreets.size}`);

  // Sort neighborhoods, streets, and buildings for consistent output
  const sortedMaps = {};
  const sortedNeighborhoods = Object.keys(buildingMaps).sort();

  for (const neighborhood of sortedNeighborhoods) {
    sortedMaps[neighborhood] = {};
    const sortedStreets = Object.keys(buildingMaps[neighborhood]).sort();

    for (const street of sortedStreets) {
      sortedMaps[neighborhood][street] = {};

      // Add _meta with street map dimensions if available
      if (streetDimensions[street]) {
        sortedMaps[neighborhood][street]._meta = streetDimensions[street];
      }

      const sortedBuildings = Object.keys(
        buildingMaps[neighborhood][street]
      ).sort();

      for (const building of sortedBuildings) {
        sortedMaps[neighborhood][street][building] =
          buildingMaps[neighborhood][street][building];
      }
    }
  }

  // Print summary of structure
  console.log("\nStructure summary:");
  for (const [neighborhood, streets] of Object.entries(sortedMaps)) {
    console.log(`  ${neighborhood}:`);
    for (const [street, buildings] of Object.entries(streets)) {
      console.log(`    ${street}: ${Object.keys(buildings).length} buildings`);
    }
  }

  if (DRY_RUN) {
    console.log("\n[DRY RUN] Would write to:", OUTPUT_PATH);
    console.log("\nSample output (first 3 buildings):");
    const sample = {};
    let count = 0;
    outer: for (const [n, streets] of Object.entries(sortedMaps)) {
      sample[n] = {};
      for (const [s, buildings] of Object.entries(streets)) {
        sample[n][s] = {};
        for (const [b, data] of Object.entries(buildings)) {
          sample[n][s][b] = data;
          count++;
          if (count >= 3) break outer;
        }
      }
    }
    console.log(JSON.stringify(sample, null, 2));
  } else {
    writeFileSync(OUTPUT_PATH, JSON.stringify(sortedMaps, null, 2));
    console.log(`\nOutput written to: ${OUTPUT_PATH}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

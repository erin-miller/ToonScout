import buildingMapsData from "@/data/building_maps.json";

export interface MarkerPosition {
  top: number;
  left: number;
}

interface StreetMeta {
  wikiWidth: number;
  wikiHeight: number;
}

interface BuildingData {
  wikiUrl: string;
  markerPosition: MarkerPosition | null;
}

// Structure: neighborhood -> street -> (_meta | building -> data)
// Using Record with union type to allow both _meta and building entries
type StreetData = Record<string, BuildingData | StreetMeta>;

type BuildingMapsStructure = Record<string, Record<string, StreetData>>;

// Legacy interface for compatibility
export interface BuildingMapInfo {
  wikiUrl: string;
  mapImageUrl: string;
  street: string | null;
  neighborhood: string | null;
  markerPosition: MarkerPosition | null;
}

// Location marker image (local copy)
export const LOCATION_MARKER_URL = "/images/location_marker.png";

// Local image size (all images are 512x512)
const LOCAL_IMAGE_SIZE = 512;

// Street name to local map image URL mapping
// URL pattern: /maps/{neighborhood}_{street}.webp (lowercase, underscores)
export const STREET_MAP_URLS: Record<string, string> = {
  // Toontown Central
  "Silly Street": "/maps/toontown_central_silly_street.webp",
  "Loopy Lane": "/maps/toontown_central_loopy_lane.webp",
  "Punchline Place": "/maps/toontown_central_punchline_place.webp",
  // Donald's Dock
  "Barnacle Boulevard": "/maps/donalds_dock_barnacle_boulevard.webp",
  "Seaweed Street": "/maps/donalds_dock_seaweed_street.webp",
  "Lighthouse Lane": "/maps/donalds_dock_lighthouse_lane.webp",
  // Daisy Gardens
  "Elm Street": "/maps/daisys_garden_elm_street.webp",
  "Maple Street": "/maps/daisys_garden_maple_street.webp",
  "Oak Street": "/maps/daisys_garden_oak_street.webp",
  // Minnie's Melodyland
  "Alto Avenue": "/maps/minnies_melodyland_alto_avenue.webp",
  "Baritone Boulevard": "/maps/minnies_melodyland_baritone_boulevard.webp",
  "Tenor Terrace": "/maps/minnies_melodyland_tenor_terrace.webp",
  // The Brrrgh
  "Walrus Way": "/maps/the_brrrgh_walrus_way.webp",
  "Sleet Street": "/maps/the_brrrgh_sleet_street.webp",
  "Polar Place": "/maps/the_brrrgh_polar_place.webp",
  // Donald's Dreamland
  "Lullaby Lane": "/maps/donalds_dreamland_lullaby_lane.webp",
  "Pajama Place": "/maps/donalds_dreamland_pajama_place.webp",
};

// Fallback wiki thumbnail dimensions (used when JSON doesn't have _meta yet)
// These are the display dimensions of the wiki thumbnails that marker positions are calibrated for
const STREET_DIMENSIONS_FALLBACK: Record<string, StreetMeta> = {
  "Silly Street": { wikiWidth: 250, wikiHeight: 327 },
  "Loopy Lane": { wikiWidth: 250, wikiHeight: 201 },
  "Punchline Place": { wikiWidth: 250, wikiHeight: 115 },
  "Barnacle Boulevard": { wikiWidth: 250, wikiHeight: 376 },
  "Seaweed Street": { wikiWidth: 250, wikiHeight: 218 },
  "Lighthouse Lane": { wikiWidth: 250, wikiHeight: 148 },
  "Elm Street": { wikiWidth: 250, wikiHeight: 103 },
  "Maple Street": { wikiWidth: 250, wikiHeight: 105 },
  "Oak Street": { wikiWidth: 250, wikiHeight: 232 },
  "Alto Avenue": { wikiWidth: 250, wikiHeight: 228 },
  "Baritone Boulevard": { wikiWidth: 250, wikiHeight: 236 },
  "Tenor Terrace": { wikiWidth: 250, wikiHeight: 163 },
  "Walrus Way": { wikiWidth: 250, wikiHeight: 250 },
  "Sleet Street": { wikiWidth: 250, wikiHeight: 245 },
  "Polar Place": { wikiWidth: 250, wikiHeight: 222 },
  "Lullaby Lane": { wikiWidth: 250, wikiHeight: 312 },
  "Pajama Place": { wikiWidth: 250, wikiHeight: 250 },
};

// Legacy export for backwards compatibility
export const STREET_MAP_IMAGES = STREET_MAP_URLS;

const buildingMaps = buildingMapsData as BuildingMapsStructure;

// Build indices for fast lookups
const buildingIndex: Map<
  string,
  { neighborhood: string; street: string; data: BuildingData }
> = new Map();

const streetMetaIndex: Map<string, StreetMeta> = new Map();

// Type guard to check if a value is StreetMeta
function isStreetMeta(value: BuildingData | StreetMeta): value is StreetMeta {
  return "wikiWidth" in value && "wikiHeight" in value;
}

for (const [neighborhood, streets] of Object.entries(buildingMaps)) {
  for (const [street, streetData] of Object.entries(streets)) {
    // Index buildings and extract street meta
    for (const [key, value] of Object.entries(streetData)) {
      if (key === "_meta" && isStreetMeta(value)) {
        streetMetaIndex.set(street, value);
      } else if (key !== "_meta") {
        const data = value as BuildingData;
        buildingIndex.set(key.toLowerCase(), {
          neighborhood,
          street,
          data,
        });
      }
    }
  }
}

// Per-street calibration for marker positioning
// Each street may have different image processing (stretched, padded, etc.)
// Values: { scaleMode: 'stretched' | 'uniform', paddingTopFactor?: number, paddingLeftFactor?: number }
const STREET_CALIBRATION: Record<string, {
  scaleMode: 'stretched' | 'uniform';
  paddingTopFactor?: number;
  paddingLeftFactor?: number;
}> = {
  // Toontown Central
  "Silly Street": { scaleMode: 'uniform', paddingLeftFactor: 0.5 },      // tall (250x327)
  "Loopy Lane": { scaleMode: 'uniform', paddingTopFactor: 0.7 },         // wide (250x201)
  "Punchline Place": { scaleMode: 'uniform', paddingTopFactor: 0.5 },     // very wide (250x115)
  // Donald's Dock
  "Barnacle Boulevard": { scaleMode: 'uniform', paddingLeftFactor: 0.35 }, // tall (250x376)
  "Seaweed Street": { scaleMode: 'uniform', paddingTopFactor: 0.1 },     // (250x218)
  "Lighthouse Lane": { scaleMode: 'uniform', paddingTopFactor: 0.55 },   // (250x148)
  // Daisy Gardens
  "Elm Street": { scaleMode: 'uniform', paddingTopFactor: 0.45 },        // very wide (250x103)
  "Maple Street": { scaleMode: 'uniform', paddingTopFactor: 0.45 },      // very wide (250x105)
  "Oak Street": { scaleMode: 'uniform', paddingTopFactor: 0.55 },        // (250x232)
  // Minnie's Melodyland
  "Alto Avenue": { scaleMode: 'uniform', paddingTopFactor: 0.5 },        // (250x228)
  "Baritone Boulevard": { scaleMode: 'uniform', paddingTopFactor: 0.55 }, // (250x236)
  "Tenor Terrace": { scaleMode: 'uniform', paddingTopFactor: 0.4 },      // (250x163)
  // The Brrrgh
  "Walrus Way": { scaleMode: 'uniform', paddingTopFactor: 0.5 },         // (250x250) square
  "Sleet Street": { scaleMode: 'uniform', paddingTopFactor: 0.5 },       // (250x245)
  "Polar Place": { scaleMode: 'uniform', paddingTopFactor: 0.5 },        // (250x222)
  // Donald's Dreamland
  "Lullaby Lane": { scaleMode: 'uniform', paddingLeftFactor: 0.5 },      // tall (250x312)
  "Pajama Place": { scaleMode: 'uniform', paddingTopFactor: 0.5 },       // (250x250) square
};

// Scale marker position from wiki thumbnail coordinates to local image coordinates
function scaleMarkerPosition(
  position: MarkerPosition | null,
  street: string
): MarkerPosition | null {
  if (!position) return null;

  const meta = streetMetaIndex.get(street) ?? STREET_DIMENSIONS_FALLBACK[street];
  if (!meta) return position;

  const calibration = STREET_CALIBRATION[street];

  // Default to stretched if no calibration
  if (!calibration || calibration.scaleMode === 'stretched') {
    // Simple stretched: scale X and Y independently to fill 512x512
    return {
      top: Math.round((position.top / meta.wikiHeight) * LOCAL_IMAGE_SIZE),
      left: Math.round((position.left / meta.wikiWidth) * LOCAL_IMAGE_SIZE),
    };
  }

  // Uniform scaling with padding
  const aspectRatio = meta.wikiWidth / meta.wikiHeight;
  let scaleFactor: number;
  let paddingTop = 0;
  let paddingLeft = 0;

  if (aspectRatio >= 1) {
    // Wide image: scale by width, pad top/bottom
    scaleFactor = LOCAL_IMAGE_SIZE / meta.wikiWidth;
    const contentHeight = meta.wikiHeight * scaleFactor;
    const totalPadding = LOCAL_IMAGE_SIZE - contentHeight;
    paddingTop = totalPadding * (calibration.paddingTopFactor ?? 0.5);
  } else {
    // Tall image: scale by height, pad left/right
    scaleFactor = LOCAL_IMAGE_SIZE / meta.wikiHeight;
    const contentWidth = meta.wikiWidth * scaleFactor;
    const totalPadding = LOCAL_IMAGE_SIZE - contentWidth;
    paddingLeft = totalPadding * (calibration.paddingLeftFactor ?? 0.5);
  }

  return {
    top: Math.round(paddingTop + position.top * scaleFactor),
    left: Math.round(paddingLeft + position.left * scaleFactor),
  };
}

export function getBuildingMapInfo(
  buildingName: string
): BuildingMapInfo | null {
  if (!buildingName) return null;

  const normalizedName = buildingName.toLowerCase();
  const entry = buildingIndex.get(normalizedName);

  if (!entry) return null;

  return {
    wikiUrl: entry.data.wikiUrl,
    mapImageUrl: STREET_MAP_URLS[entry.street] ?? "",
    street: entry.street,
    neighborhood: entry.neighborhood,
    markerPosition: scaleMarkerPosition(entry.data.markerPosition, entry.street),
  };
}

export function hasBuildingMap(buildingName: string): boolean {
  return getBuildingMapInfo(buildingName) !== null;
}

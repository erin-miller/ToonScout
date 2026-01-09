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
type StreetData = {
  _meta?: StreetMeta;
} & Record<string, BuildingData>;

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

for (const [neighborhood, streets] of Object.entries(buildingMaps)) {
  for (const [street, streetData] of Object.entries(streets)) {
    // Extract street meta if present
    if (streetData._meta) {
      streetMetaIndex.set(street, streetData._meta);
    }

    // Index buildings (skip _meta key)
    for (const [key, value] of Object.entries(streetData)) {
      if (key === "_meta") continue;
      const data = value as BuildingData;
      buildingIndex.set(key.toLowerCase(), {
        neighborhood,
        street,
        data,
      });
    }
  }
}

// Scale marker position from wiki thumbnail coordinates to local image coordinates
function scaleMarkerPosition(
  position: MarkerPosition | null,
  street: string
): MarkerPosition | null {
  if (!position) return null;

  // Use JSON _meta if available, otherwise fall back to hardcoded dimensions
  const meta = streetMetaIndex.get(street) ?? STREET_DIMENSIONS_FALLBACK[street];
  if (!meta) return position;

  return {
    top: Math.round((position.top / meta.wikiHeight) * LOCAL_IMAGE_SIZE),
    left: Math.round((position.left / meta.wikiWidth) * LOCAL_IMAGE_SIZE),
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

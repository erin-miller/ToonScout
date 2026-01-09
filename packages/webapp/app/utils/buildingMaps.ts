import buildingMapsData from "@/data/building_maps.json";

export interface MarkerPosition {
  top: number;
  left: number;
}

export interface BuildingMapInfo {
  wikiUrl: string;
  mapImageUrl: string;
  street: string | null;
  neighborhood: string | null;
  markerPosition: MarkerPosition | null;
}

// Location marker image URL from the wiki
export const LOCATION_MARKER_URL =
  "https://static.toontownrewritten.wiki/uploads/thumb/b/b7/Location_mark.png/20px-Location_mark.png";

const buildingMaps: Record<string, BuildingMapInfo> = buildingMapsData;

export function getBuildingMapInfo(
  buildingName: string
): BuildingMapInfo | null {
  if (!buildingName) return null;

  // Direct match
  if (buildingMaps[buildingName]) {
    return buildingMaps[buildingName];
  }

  // Try case-insensitive match
  const normalizedName = buildingName.toLowerCase();
  for (const [key, value] of Object.entries(buildingMaps)) {
    if (key.toLowerCase() === normalizedName) {
      return value;
    }
  }

  return null;
}

export function hasBuildingMap(buildingName: string): boolean {
  return getBuildingMapInfo(buildingName) !== null;
}

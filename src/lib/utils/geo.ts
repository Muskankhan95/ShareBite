/**
 * Geographic Calculation & Mapping Utilities
 * Implements Haversine distance, travel duration estimates, privacy fuzzing, and route waypoint generation.
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const DEFAULT_MAP_CENTER: [number, number] = [37.7749, -122.4194]; // San Francisco, CA
export const EARTH_RADIUS_KM = 6371.0;
export const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculate Great-Circle distance between two coordinates using the Haversine formula.
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @param unit 'km' or 'miles' (default: 'km')
 * @returns Distance rounded to 1 decimal place
 */
export function calculateHaversineDistance(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null,
  unit: "km" | "miles" = "km"
): number {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return 0;
  }

  // Same coordinates
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const rLat1 = toRad(lat1);
  const rLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const radius = unit === "miles" ? EARTH_RADIUS_MILES : EARTH_RADIUS_KM;
  const distance = radius * c;

  return Math.round(distance * 10) / 10;
}

/**
 * Calculate estimated transit duration in minutes based on distance and travel mode.
 */
export function calculateTravelTimeMinutes(
  distanceKm: number,
  mode: "Bike" | "Car" | "Van" | "On Foot" | string = "Bike"
): number {
  if (distanceKm <= 0) return 3;

  let speedKmH = 16; // default Bike: 16 km/h
  let bufferMins = 3;

  const normalized = (mode || "").toLowerCase();
  if (normalized.includes("car") || normalized.includes("van") || normalized.includes("motorcycle")) {
    speedKmH = 28; // urban city driving
    bufferMins = 5;
  } else if (normalized.includes("foot") || normalized.includes("walk")) {
    speedKmH = 4.5;
    bufferMins = 2;
  } else if (normalized.includes("bike") || normalized.includes("bicycle")) {
    speedKmH = 16;
    bufferMins = 3;
  }

  const travelTime = (distanceKm / speedKmH) * 60 + bufferMins;
  return Math.max(3, Math.round(travelTime));
}

/**
 * Filter items by maximum radius from a center coordinate.
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat?: number | null,
  pointLon?: number | null,
  radiusKm: number = 10
): boolean {
  if (pointLat === undefined || pointLat === null || pointLon === undefined || pointLon === null) {
    return false;
  }
  const dist = calculateHaversineDistance(centerLat, centerLon, pointLat, pointLon, "km");
  return dist <= radiusKm;
}

/**
 * Volunteer Privacy Fuzzing:
 * Never expose a volunteer's exact home coordinates on public maps.
 * Applies a deterministic ~500m to 900m offset based on volunteer id or pseudo-random seed.
 */
export function fuzzCoordinates(
  lat: number,
  lng: number,
  radiusKm: number = 0.85,
  seedString?: string
): Coordinates {
  // Deterministic seed if string provided
  let seed = 42;
  if (seedString) {
    for (let i = 0; i < seedString.length; i++) {
      seed = (seed * 31 + seedString.charCodeAt(i)) & 0xffffff;
    }
  }

  const pseudoRandom1 = (Math.sin(seed) + 1) / 2;
  const pseudoRandom2 = (Math.cos(seed) + 1) / 2;

  // Convert radius in km to degrees approx
  // 1 deg lat ~= 111 km, 1 deg lng ~= 111 * cos(lat) km
  const latOffset = ((pseudoRandom1 - 0.5) * 2 * radiusKm) / 111.0;
  const lngOffset =
    ((pseudoRandom2 - 0.5) * 2 * radiusKm) / (111.0 * Math.cos((lat * Math.PI) / 180));

  return {
    latitude: Math.round((lat + latOffset) * 10000) / 10000,
    longitude: Math.round((lng + lngOffset) * 10000) / 10000,
  };
}

/**
 * Sanitize volunteer data for map display:
 * Replaces exact street address with generalized neighborhood and applies fuzzed coordinates.
 */
export function sanitizeVolunteerForMap(volunteer: {
  id: string;
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  vehicleType?: string;
  preferredRadius?: number;
  availabilityStatus?: string;
  verificationStatus?: string;
}) {
  const baseLat = volunteer.latitude || 37.7702;
  const baseLng = volunteer.longitude || -122.4225;

  const fuzzed = fuzzCoordinates(baseLat, baseLng, 0.75, volunteer.id);

  // Extract city or district from address, hiding house number and street name
  let generalizedLocation = "Service Radius Zone";
  if (volunteer.address) {
    const parts = volunteer.address.split(",").map((s) => s.trim());
    if (parts.length > 1) {
      // Pick city/state part or last 2 segments
      generalizedLocation = parts.slice(1).join(", ");
    } else {
      generalizedLocation = "San Francisco Metro Area";
    }
  }

  return {
    id: volunteer.id,
    name: volunteer.name.split(" ")[0] + " (Volunteer)", // First name only for privacy
    vehicleType: volunteer.vehicleType || "Bike",
    preferredRadius: volunteer.preferredRadius || 5,
    availabilityStatus: volunteer.availabilityStatus || "available",
    verificationStatus: volunteer.verificationStatus || "verified",
    location: generalizedLocation,
    latitude: fuzzed.latitude,
    longitude: fuzzed.longitude,
    isExactLocation: false, // Flag indicating privacy fuzzing
  };
}

/**
 * Generate intermediate route waypoints between pickup and delivery for realistic map polylines.
 */
export function generateRouteWaypoints(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number },
  steps: number = 8
): [number, number][] {
  const points: [number, number][] = [];
  points.push([start.latitude, start.longitude]);

  // Manhattan / grid urban midpoint adjustment for realism
  const midLat = (start.latitude + end.latitude) / 2;
  const midLng = (start.longitude + end.longitude) / 2;

  // Slight perpendicular offset to simulate city street corridors
  const dLat = end.latitude - start.latitude;
  const dLng = end.longitude - start.longitude;
  const perpOffsetLat = -dLng * 0.15;
  const perpOffsetLng = dLat * 0.15;

  const bend1Lat = start.latitude + dLat * 0.35 + perpOffsetLat;
  const bend1Lng = start.longitude + dLng * 0.35 + perpOffsetLng;

  const bend2Lat = start.latitude + dLat * 0.7 + perpOffsetLat * 0.5;
  const bend2Lng = start.longitude + dLng * 0.7 + perpOffsetLng * 0.5;

  points.push([bend1Lat, bend1Lng]);
  points.push([midLat, midLng]);
  points.push([bend2Lat, bend2Lng]);
  points.push([end.latitude, end.longitude]);

  return points;
}

/**
 * Local city coordinates directory for instant zero-latency address geocoding.
 */
export const LOCAL_GEO_DIRECTORY: Record<string, { lat: number; lng: number }> = {
  "market street": { lat: 37.7915, lng: -122.3999 },
  "420 market street": { lat: 37.7915, lng: -122.3999 },
  "mission blvd": { lat: 37.7858, lng: -122.4042 },
  "782 mission blvd": { lat: 37.7858, lng: -122.4042 },
  "valencia st": { lat: 37.7702, lng: -122.4225 },
  "154 valencia st": { lat: 37.7702, lng: -122.4225 },
  "san francisco": { lat: 37.7749, lng: -122.4194 },
  "oakland": { lat: 37.8044, lng: -122.2712 },
  "berkeley": { lat: 37.8715, lng: -122.273 },
  "san jose": { lat: 37.3382, lng: -121.8863 },
};

/**
 * Approximate geocoder helper for user input addresses.
 */
export function approximateGeocode(address: string): Coordinates {
  const lower = address.toLowerCase();
  for (const [key, coords] of Object.entries(LOCAL_GEO_DIRECTORY)) {
    if (lower.includes(key)) {
      return { latitude: coords.lat, longitude: coords.lng };
    }
  }

  // Fallback to central San Francisco with pseudo-offset for distinct locations
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = (hash * 31 + address.charCodeAt(i)) & 0xffff;
  }
  const offsetLat = ((hash % 100) - 50) * 0.0005;
  const offsetLng = (((hash >> 8) % 100) - 50) * 0.0005;

  return {
    latitude: Math.round((37.7749 + offsetLat) * 10000) / 10000,
    longitude: Math.round((-122.4194 + offsetLng) * 10000) / 10000,
  };
}

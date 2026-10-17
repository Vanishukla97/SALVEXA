import { fetchApiJson } from './api';

export type NearbyHospital = {
  osm_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  speciality?: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  is_preferred?: boolean;
};

export type PreferredHospital = NearbyHospital;

export type GuardianInfo = {
  name: string | null;
  relation: string | null;
  phone: string | null;
};

export type EmergencyProfileSummary = {
  name: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  allergies: string[];
  current_medicines: string[];
  recent_symptoms: string | null;
};

export type EmergencyContext = {
  radiusKm: number;
  source: string;
  error: string | null;
  setupComplete: boolean;
  guardian: GuardianInfo;
  profile: EmergencyProfileSummary;
  messagePreview: string;
  preferredHospitals: NearbyHospital[];
  otherHospitals: NearbyHospital[];
};

export type EmergencyDispatchResult = {
  dispatchId: number;
  status: string;
  message: string;
  recipients: {
    hospital: { name: string | null; phone: string | null; status: string };
    guardian: { name: string | null; phone: string | null; status: string };
  };
};

export type GeoCoords = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

const COORDS_KEY = 'salvexa_last_coords';

export function getCachedCoords(): GeoCoords | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch {
    // Ignore malformed cache.
  }
  return null;
}

export function setCachedCoords(coords: GeoCoords) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      COORDS_KEY,
      JSON.stringify({ lat: coords.lat, lng: coords.lng })
    );
  } catch {
    // Storage may be unavailable; ignore.
  }
}

export function getUserLocation(): Promise<GeoCoords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCachedCoords(coords);
        resolve(coords);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          reject(new Error('Location permission denied. Enable location to find nearby hospitals.'));
          return;
        }
        reject(new Error('Unable to determine your location right now.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export function formatDistance(distanceKm: number | null | undefined) {
  if (distanceKm == null || Number.isNaN(Number(distanceKm))) return 'Distance unknown';
  const value = Number(distanceKm);
  if (value < 1) return `${Math.round(value * 1000)} m away`;
  return `${value.toFixed(1)} km away`;
}

export async function fetchEmergencyContext(
  token: string,
  coords: GeoCoords | null
): Promise<EmergencyContext> {
  const query = coords ? `?lat=${coords.lat}&lng=${coords.lng}` : '';
  const result = await fetchApiJson<{ success?: boolean; data?: EmergencyContext; message?: string }>(
    `/emergency/context${query}`,
    { token }
  );
  if (!result.response.ok || !result.payload?.success || !result.payload.data) {
    throw new Error(result.payload?.message || 'Unable to load emergency hospitals');
  }
  return result.payload.data;
}

const nearbyCache = new Map<string, { at: number; data: NearbyHospital[] }>();
const nearbyInFlight = new Map<string, Promise<NearbyHospital[]>>();
const NEARBY_CLIENT_TTL_MS = 5 * 60 * 1000;

export function clearNearbyHospitalsCache() {
  nearbyCache.clear();
}

export async function fetchNearbyHospitals(
  token: string,
  coords: GeoCoords,
  radiusKm?: number
): Promise<NearbyHospital[]> {
  const cacheKey = `${coords.lat.toFixed(3)},${coords.lng.toFixed(3)},${radiusKm ?? ''}`;
  const cached = nearbyCache.get(cacheKey);
  if (cached && Date.now() - cached.at < NEARBY_CLIENT_TTL_MS) {
    return cached.data;
  }
  const pending = nearbyInFlight.get(cacheKey);
  if (pending) {
    return pending;
  }

  const params = new URLSearchParams({
    lat: String(coords.lat),
    lng: String(coords.lng),
  });
  if (radiusKm) params.set('radiusKm', String(radiusKm));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  const request = (async () => {
    try {
      const result = await fetchApiJson<{
        success?: boolean;
        data?: { hospitals?: NearbyHospital[]; source?: string; error?: string | null };
        message?: string;
      }>(`/emergency/hospitals?${params.toString()}`, { token, signal: controller.signal });
      if (!result.response.ok || !result.payload?.success) {
        throw new Error(result.payload?.message || 'Unable to load nearby hospitals');
      }
      const data = result.payload.data;
      if (data?.error || data?.source === 'unavailable') {
        throw new Error(
          'Could not reach the hospital service for this area. Please check your connection and retry.'
        );
      }
      const hospitals = data?.hospitals || [];
      if (hospitals.length) {
        nearbyCache.set(cacheKey, { at: Date.now(), data: hospitals });
      }
      return hospitals;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Still searching for nearby hospitals... It is taking longer than usual. Please retry.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  nearbyInFlight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    nearbyInFlight.delete(cacheKey);
  }
}

export async function prefetchNearbyHospitals(
  token: string,
  coords?: GeoCoords | null
): Promise<NearbyHospital[]> {
  const target = coords || getCachedCoords();
  if (!target || !token) return [];
  try {
    return await fetchNearbyHospitals(token, target);
  } catch {
    return [];
  }
}

export async function dispatchEmergencyAlert(
  token: string,
  payload: { hospital: NearbyHospital; coords: GeoCoords | null }
): Promise<EmergencyDispatchResult> {
  const result = await fetchApiJson<{ success?: boolean; data?: EmergencyDispatchResult; message?: string }>(
    '/emergency/dispatch',
    {
      token,
      method: 'POST',
      body: {
        hospital: {
          osm_id: payload.hospital.osm_id,
          name: payload.hospital.name,
          address: payload.hospital.address,
          phone: payload.hospital.phone,
          latitude: payload.hospital.latitude,
          longitude: payload.hospital.longitude,
        },
        lat: payload.coords?.lat ?? null,
        lng: payload.coords?.lng ?? null,
      },
    }
  );
  if (!result.response.ok || !result.payload?.success || !result.payload.data) {
    throw new Error(result.payload?.message || 'Unable to dispatch the emergency alert');
  }
  return result.payload.data;
}

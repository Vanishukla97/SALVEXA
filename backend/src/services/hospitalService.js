const env = require('../config/env');
const HospitalCacheModel = require('../models/HospitalCacheModel');
const HospitalModel = require('../models/HospitalModel');

const OVERPASS_USER_AGENT =
  'Salvexa/1.0 (emergency hospital locator; contact@salvexa.app)';

const OVERPASS_MIRRORS = [
  env.hospital.overpassUrl,
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
].filter((url, index, list) => url && list.indexOf(url) === index);

const FRESH_TTL_MS = 10 * 60 * 1000;
const STALE_TTL_MS = 24 * 60 * 60 * 1000;

const memoryCache = new Map();
const backgroundRefreshes = new Map();

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function buildOverpassQuery(lat, lng, radiusMeters) {
  const around = `around:${radiusMeters},${lat},${lng}`;
  return [
    '[out:json][timeout:20];',
    '(',
    `  node["amenity"="hospital"](${around});`,
    `  way["amenity"="hospital"](${around});`,
    `  node["healthcare"="hospital"](${around});`,
    `  way["healthcare"="hospital"](${around});`,
    ');',
    'out center tags;',
  ].join('\n');
}

function extractPhone(tags) {
  return (
    tags['emergency:phone'] ||
    tags.emergency_phone ||
    tags['contact:phone'] ||
    tags['phone:emergency'] ||
    tags.phone ||
    tags['contact:mobile'] ||
    null
  );
}

function extractSpeciality(tags) {
  const raw =
    tags['healthcare:speciality'] ||
    tags.healthcare_speciality ||
    tags.speciality ||
    tags.specialty ||
    null;
  if (!raw) return null;
  const cleaned = String(raw)
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .join(', ');
  return cleaned || null;
}

function extractAddress(tags) {
  const parts = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:suburb'] || tags['addr:neighbourhood'],
    tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
    tags['addr:state'],
    tags['addr:postcode'],
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

function normalizeElement(element, origin) {
  const latitude = element.lat != null ? element.lat : element.center?.lat;
  const longitude = element.lon != null ? element.lon : element.center?.lon;
  if (latitude == null || longitude == null) return null;

  const tags = element.tags || {};
  const name = tags.name || tags['name:en'] || tags['official_name'] || null;

  return {
    osm_id: `${element.type}/${element.id}`,
    name: name || 'Unnamed hospital',
    address: extractAddress(tags),
    phone: extractPhone(tags),
    speciality: extractSpeciality(tags),
    latitude,
    longitude,
    distance_km: Number(haversineKm(origin.lat, origin.lng, latitude, longitude).toFixed(2)),
  };
}

async function queryOverpassMirror(url, query) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.hospital.timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': OVERPASS_USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.elements)) {
      throw new Error('invalid payload');
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function fetchFromMirror(mirror, query) {
  return queryOverpassMirror(mirror, query).then((payload) => {
    if (payload.elements.length === 0) {
      const error = new Error(`empty result from ${mirror}`);
      error.empty = true;
      throw error;
    }
    return payload;
  });
}

async function fetchOverpass(query) {
  const attempts = OVERPASS_MIRRORS.map((mirror) => fetchFromMirror(mirror, query));

  try {
    return await Promise.any(attempts);
  } catch (aggregate) {
    const errors = Array.isArray(aggregate?.errors) ? aggregate.errors : [];
    if (errors.length && errors.every((error) => error?.empty)) {
      return { elements: [] };
    }
    const detail = errors.map((error) => error?.message || String(error)).join('; ');
    throw new Error(`All Overpass mirrors failed (${detail})`);
  }
}

function normalizeHospitals(elements, origin) {
  return elements
    .map((element) => normalizeElement(element, origin))
    .filter(Boolean)
    .filter((hospital) => hospital.name !== 'Unnamed hospital' || hospital.phone)
    .sort((a, b) => a.distance_km - b.distance_km);
}

function toHospitalRow(hospital) {
  return {
    osm_id: String(hospital.osm_id).slice(0, 64),
    name: String(hospital.name || 'Unnamed hospital').slice(0, 255),
    address: hospital.address ? String(hospital.address) : null,
    phone: hospital.phone ? String(hospital.phone).slice(0, 255) : null,
    speciality: hospital.speciality ? String(hospital.speciality).slice(0, 255) : null,
    latitude: hospital.latitude,
    longitude: hospital.longitude,
  };
}

// Persist Overpass results into the local hospitals table so the region becomes
// instant on the next lookup. Best-effort: never fail a request over this.
async function persistHospitals(hospitals) {
  if (!hospitals.length) return;
  const rows = hospitals.map(toHospitalRow);
  const batchSize = 400;
  for (let i = 0; i < rows.length; i += batchSize) {
    try {
      await HospitalModel.bulkInsert(rows.slice(i, i + batchSize));
    } catch (error) {
      // Ignore persistence failures (schema, transient DB issues, etc.).
    }
  }
}

const MAX_PERSIST = 800;

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

function normalizeNominatim(item, origin) {
  const latitude = Number(item.lat);
  const longitude = Number(item.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const tags = item.extratags || {};
  const displayName = typeof item.display_name === 'string' ? item.display_name : '';
  const name =
    item.name || displayName.split(',')[0]?.trim() || null;

  return {
    osm_id:
      item.osm_type && item.osm_id
        ? `${item.osm_type}/${item.osm_id}`
        : `nominatim/${item.place_id ?? `${latitude},${longitude}`}`,
    name: name || 'Unnamed hospital',
    address: displayName || null,
    phone: extractPhone(tags),
    speciality: extractSpeciality(tags),
    latitude,
    longitude,
    distance_km: Number(haversineKm(origin.lat, origin.lng, latitude, longitude).toFixed(2)),
  };
}

async function fetchNominatim(lat, lng, radiusKm) {
  const dLat = radiusKm / 111.0;
  const safeCos = Math.max(0.01, Math.abs(Math.cos((lat * Math.PI) / 180)));
  const dLng = radiusKm / (111.0 * safeCos);
  const params = new URLSearchParams({
    format: 'jsonv2',
    limit: String(env.hospital.maxResults),
    bounded: '1',
    'accept-language': 'en',
    viewbox: `${(lng - dLng).toFixed(5)},${(lat + dLat).toFixed(5)},${(lng + dLng).toFixed(5)},${(lat - dLat).toFixed(5)}`,
    extratags: '1',
    q: 'hospital',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.hospital.timeoutMs);
  try {
    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        'User-Agent': OVERPASS_USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`nominatim status ${response.status}`);
    }
    const payload = await response.json();
    if (!Array.isArray(payload)) return [];
    return payload
      .map((item) => normalizeNominatim(item, { lat, lng }))
      .filter(Boolean)
      .filter((hospital) => hospital.name !== 'Unnamed hospital')
      .sort((a, b) => a.distance_km - b.distance_km);
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchAndStoreNominatim(cacheKey, latitude, longitude, radius) {
  const all = await fetchNominatim(latitude, longitude, radius);

  await persistHospitals(all.slice(0, MAX_PERSIST));

  const hospitals = all.slice(0, env.hospital.maxResults);
  if (hospitals.length) {
    memoryCache.set(cacheKey, { hospitals, storedAt: Date.now() });
    try {
      await HospitalCacheModel.set(cacheKey, hospitals);
    } catch (error) {
      // Cache persistence is best-effort.
    }
  }

  return hospitals;
}

async function findViaOverpass(cacheKey, latitude, longitude, radius) {
  const now = Date.now();

  const memory = memoryCache.get(cacheKey);
  if (memory && memory.hospitals.length && now - memory.storedAt < FRESH_TTL_MS) {
    return { hospitals: memory.hospitals, source: 'overpass' };
  }

  let persisted = null;
  try {
    persisted = await HospitalCacheModel.get(cacheKey);
  } catch (error) {
    persisted = null;
  }

  if (persisted && persisted.hospitals.length) {
    memoryCache.set(cacheKey, persisted);
    const age = now - persisted.storedAt;
    if (age < FRESH_TTL_MS) {
      return { hospitals: persisted.hospitals, source: 'overpass' };
    }
    if (age < STALE_TTL_MS) {
      refreshInBackground(cacheKey, latitude, longitude, radius);
      return { hospitals: persisted.hospitals, source: 'overpass' };
    }
  }

  const hospitals = await fetchAndStore(cacheKey, latitude, longitude, radius);
  return { hospitals, source: 'overpass' };
}

async function fetchAndStore(cacheKey, latitude, longitude, radius) {
  const radiusMeters = Math.min(50000, Math.round(radius * 1000));
  const query = buildOverpassQuery(latitude, longitude, radiusMeters);
  const payload = await fetchOverpass(query);
  const elements = Array.isArray(payload.elements) ? payload.elements : [];
  const all = normalizeHospitals(elements, { lat: latitude, lng: longitude });

  await persistHospitals(all.slice(0, MAX_PERSIST));

  const hospitals = all.slice(0, env.hospital.maxResults);
  if (hospitals.length) {
    memoryCache.set(cacheKey, { hospitals, storedAt: Date.now() });
    try {
      await HospitalCacheModel.set(cacheKey, hospitals);
    } catch (error) {
      // Cache persistence is best-effort; never fail the request over it.
    }
  }

  return hospitals;
}

function refreshInBackground(cacheKey, latitude, longitude, radius) {
  if (backgroundRefreshes.has(cacheKey)) {
    return;
  }
  const task = fetchAndStore(cacheKey, latitude, longitude, radius)
    .catch(() => {})
    .finally(() => backgroundRefreshes.delete(cacheKey));
  backgroundRefreshes.set(cacheKey, task);
}

async function findInLocalDb(latitude, longitude, radius) {
  const cosLat = Math.cos((latitude * Math.PI) / 180);
  const safeCos = Math.max(0.01, Math.abs(cosLat));
  const latDelta = radius / 111.0;
  const lngDelta = radius / (111.0 * safeCos);

  const candidates = await HospitalModel.findByBounds({
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLng: longitude - lngDelta,
    maxLng: longitude + lngDelta,
    limit: 800,
  });

  const within = candidates
    .map((hospital) => ({
      ...hospital,
      distance_km: Number(
        haversineKm(latitude, longitude, hospital.latitude, hospital.longitude).toFixed(2)
      ),
    }))
    .filter((hospital) => hospital.distance_km <= radius)
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, env.hospital.maxResults);

  if (within.length) {
    return { hospitals: within, covered: true };
  }

  // No hospitals within radius. Check whether this region is covered at all
  // (larger box) so an empty result can be trusted instead of hitting Overpass.
  const coverageRadius = Math.max(60, radius * 3);
  const covLatDelta = coverageRadius / 111.0;
  const covLngDelta = coverageRadius / (111.0 * safeCos);
  const nearbyAny = await HospitalModel.countNearby({
    minLat: latitude - covLatDelta,
    maxLat: latitude + covLatDelta,
    minLng: longitude - covLngDelta,
    maxLng: longitude + covLngDelta,
  });
  return { hospitals: within, covered: nearbyAny > 0 };
}

async function findNearbyHospitals({ lat, lng, radiusKm } = {}) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('Valid latitude and longitude are required');
  }

  const radius = Number.isFinite(Number(radiusKm)) && Number(radiusKm) > 0
    ? Number(radiusKm)
    : env.hospital.defaultRadiusKm;

  // 1) Local database first — instant when the region is preloaded.
  try {
    const local = await findInLocalDb(latitude, longitude, radius);
    if (local.covered) {
      return { hospitals: local.hospitals, source: 'local-db' };
    }
  } catch (error) {
    // Fall through to Overpass if the local lookup fails.
  }

  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)},${radius}`;

  // 2) Race Overpass and Nominatim — whichever returns first wins. This keeps
  //    lookups fast and resilient when a source is down (e.g. Overpass outages).
  const overpassAttempt = findViaOverpass(cacheKey, latitude, longitude, radius);

  const nominatimAttempt = (async () => {
    const hospitals = await fetchAndStoreNominatim(cacheKey, latitude, longitude, radius);
    if (!hospitals.length) {
      throw new Error('No results from Nominatim');
    }
    return { hospitals, source: 'nominatim' };
  })();

  try {
    return await Promise.any([overpassAttempt, nominatimAttempt]);
  } catch (aggregate) {
    const errors = Array.isArray(aggregate?.errors) ? aggregate.errors : [];
    const detail = errors.map((error) => error?.message || String(error)).join('; ');
    throw new Error(
      detail ? `No hospital data available for this area (${detail})` : 'No hospital data available for this area right now'
    );
  }
}

module.exports = {
  findNearbyHospitals,
  haversineKm,
  buildOverpassQuery,
  normalizeElement,
  fetchOverpass,
};

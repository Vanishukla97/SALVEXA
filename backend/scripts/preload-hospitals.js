/*
 * One-time (or occasional) preload of hospitals from OpenStreetMap Overpass
 * into the local `hospitals` table so runtime lookups are instant.
 *
 * Usage (from backend/):
 *   node scripts/preload-hospitals.js --cities          # around major Indian cities (recommended)
 *   node scripts/preload-hospitals.js                    # whole-India grid (slow, many queries)
 *   node scripts/preload-hospitals.js --bbox=72.8,18.9,73.1,19.2 --tile=0.3
 *
 * Options:
 *   --cities                           Preload around built-in major-city list.
 *   --city-radius=<km>                 Radius per city (default: 45).
 *   --bbox=minLng,minLat,maxLng,maxLat Region to cover in grid mode (default: India).
 *   --tile=<degrees>                   Tile size for grid mode (default: 2).
 *   --sleep=<ms>                       Pause between queries to avoid rate limits (default: 1000).
 *   --retries=<n>                      Attempts per query (default: 3).
 *   --batch=<n>                        Rows per INSERT (default: 400).
 */

const { pool } = require('../src/config/db');
const HospitalModel = require('../src/models/HospitalModel');
const {
  normalizeElement,
  fetchOverpass,
  buildOverpassQuery,
} = require('../src/services/hospitalService');

// Default: India bounding box.
const DEFAULT_BBOX = { minLng: 68.0, minLat: 8.0, maxLng: 97.5, maxLat: 37.2 };

// Major Indian metros/cities: [name, lat, lng]
const INDIA_CITIES = [
  ['Mumbai', 19.076, 72.8777],
  ['Pune', 18.5204, 73.8567],
  ['Delhi', 28.6139, 77.209],
  ['Bengaluru', 12.9716, 77.5946],
  ['Hyderabad', 17.385, 78.4867],
  ['Chennai', 13.0827, 80.2707],
  ['Kolkata', 22.5726, 88.3639],
  ['Ahmedabad', 23.0225, 72.5714],
  ['Surat', 21.1702, 72.8311],
  ['Jaipur', 26.9124, 75.7873],
  ['Lucknow', 26.8467, 80.9462],
  ['Kanpur', 26.4499, 80.3319],
  ['Nagpur', 21.1458, 79.0882],
  ['Indore', 22.7196, 75.8577],
  ['Thane', 19.2183, 72.9781],
  ['Bhopal', 23.2599, 77.4126],
  ['Visakhapatnam', 17.6868, 83.2185],
  ['Patna', 25.5941, 85.1376],
  ['Vadodara', 22.3072, 73.1812],
  ['Ghaziabad', 28.6692, 77.4538],
  ['Ludhiana', 30.901, 75.8573],
  ['Agra', 27.1767, 78.0081],
  ['Nashik', 19.9975, 73.7898],
  ['Faridabad', 28.4089, 77.3178],
  ['Meerut', 28.9845, 77.7064],
  ['Rajkot', 22.3039, 70.8022],
  ['Varanasi', 25.3176, 82.9739],
  ['Aurangabad', 19.8762, 75.3433],
  ['Amritsar', 31.634, 74.8723],
  ['Navi Mumbai', 19.033, 73.0297],
  ['Prayagraj', 25.4358, 81.8463],
  ['Ranchi', 23.3441, 85.3096],
  ['Coimbatore', 11.0168, 76.9558],
  ['Jabalpur', 23.1815, 79.9864],
  ['Gwalior', 26.2183, 78.1828],
  ['Vijayawada', 16.5062, 80.648],
  ['Jodhpur', 26.2389, 73.0243],
  ['Madurai', 9.9252, 78.1198],
  ['Raipur', 21.2514, 81.6296],
  ['Kota', 25.2138, 75.8648],
  ['Guwahati', 26.1445, 91.7362],
  ['Chandigarh', 30.7333, 76.7794],
  ['Thiruvananthapuram', 8.5241, 76.9366],
  ['Mysuru', 12.2958, 76.6394],
  ['Bareilly', 28.367, 79.4304],
  ['Tiruchirappalli', 10.7905, 78.7047],
  ['Jalandhar', 31.326, 75.5762],
  ['Bhubaneswar', 20.2961, 85.8245],
  ['Salem', 11.6643, 78.146],
  ['Warangal', 17.9689, 79.5941],
  ['Guntur', 16.3067, 80.4365],
  ['Gorakhpur', 26.7606, 83.3732],
  ['Noida', 28.5355, 77.391],
  ['Jamshedpur', 22.8046, 86.2029],
  ['Cuttack', 20.4625, 85.8828],
  ['Kochi', 9.9312, 76.2673],
  ['Dehradun', 30.3165, 78.0322],
  ['Durgapur', 23.5204, 87.3119],
  ['Asansol', 23.6739, 86.9524],
  ['Kolhapur', 16.705, 74.2433],
  ['Ajmer', 26.4499, 74.6399],
  ['Jammu', 32.7266, 74.857],
  ['Mangalore', 12.9141, 74.856],
  ['Belagavi', 15.8497, 74.4977],
  ['Tirunelveli', 8.7139, 77.7567],
  ['Udaipur', 24.5854, 73.7125],
  ['Tiruppur', 11.1085, 77.3411],
  ['Kozhikode', 11.2588, 75.7804],
  ['Kurnool', 15.8281, 78.0373],
  ['Rajahmundry', 17.0005, 81.804],
  ['Patiala', 30.3398, 76.3869],
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    ...DEFAULT_BBOX,
    cities: false,
    cityRadiusKm: 45,
    tile: 2,
    sleep: 1000,
    retries: 3,
    batch: 400,
  };
  for (const arg of args) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    if (key === 'cities') {
      out.cities = true;
    } else if (key === 'city-radius' && value) {
      out.cityRadiusKm = Math.max(1, Number(value) || out.cityRadiusKm);
    } else if (key === 'bbox' && value) {
      const parts = value.split(',').map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        [out.minLng, out.minLat, out.maxLng, out.maxLat] = parts;
      }
    } else if (key === 'tile' && value) {
      out.tile = Math.max(0.1, Number(value) || out.tile);
    } else if (key === 'sleep' && value) {
      out.sleep = Math.max(0, Number(value) || 0);
    } else if (key === 'retries' && value) {
      out.retries = Math.max(1, Number(value) || out.retries);
    } else if (key === 'batch' && value) {
      out.batch = Math.max(1, Number(value) || out.batch);
    }
  }
  return out;
}

function buildBboxQuery(minLat, minLng, maxLat, maxLng) {
  const bbox = `${minLat},${minLng},${maxLat},${maxLng}`;
  return [
    '[out:json][timeout:90];',
    '(',
    `  node["amenity"="hospital"](${bbox});`,
    `  way["amenity"="hospital"](${bbox});`,
    `  node["healthcare"="hospital"](${bbox});`,
    `  way["healthcare"="hospital"](${bbox});`,
    ');',
    'out center tags;',
  ].join('\n');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(query, retries) {
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const payload = await fetchOverpass(query);
      return Array.isArray(payload.elements) ? payload.elements : [];
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(1500 * attempt);
    }
  }
  throw lastError || new Error('Overpass fetch failed');
}

function normalizeForStorage(elements, origin) {
  return elements
    .map((element) => normalizeElement(element, origin))
    .filter(Boolean)
    .filter((hospital) => hospital.name !== 'Unnamed hospital' || hospital.phone)
    .map(({ distance_km, ...rest }) => rest);
}

async function insertBatch(rows, batch) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batch) {
    const slice = rows.slice(i, i + batch);
    inserted += await HospitalModel.bulkInsert(slice);
  }
  return inserted;
}

async function preloadCity(name, lat, lng, opts) {
  const radiusMeters = Math.round(opts.cityRadiusKm * 1000);
  const query = buildOverpassQuery(lat, lng, radiusMeters);
  const elements = await fetchWithRetry(query, opts.retries);
  const hospitals = normalizeForStorage(elements, { lat, lng });
  let inserted = 0;
  if (hospitals.length) {
    inserted = await insertBatch(hospitals, opts.batch);
  }
  return { elements: elements.length, kept: hospitals.length, inserted, name };
}

async function preloadCities(opts) {
  let inserted = 0;
  let failed = 0;

  console.log(
    `Preloading around ${INDIA_CITIES.length} cities (radius ${opts.cityRadiusKm} km, retries ${opts.retries})`
  );

  for (let i = 0; i < INDIA_CITIES.length; i += 1) {
    const [name, lat, lng] = INDIA_CITIES[i];
    try {
      const r = await preloadCity(name, lat, lng, opts);
      inserted += r.inserted;
      console.log(
        `[${i + 1}/${INDIA_CITIES.length}] ${name}: ${r.elements} elements, ${r.kept} kept (${inserted} total)`
      );
    } catch (error) {
      failed += 1;
      console.warn(`[${i + 1}/${INDIA_CITIES.length}] ${name} FAILED: ${error.message}`);
    }
    if (opts.sleep) await sleep(opts.sleep);
  }

  return { failed, inserted };
}

async function preloadGrid(opts) {
  const tilesX = Math.ceil((opts.maxLng - opts.minLng) / opts.tile);
  const tilesY = Math.ceil((opts.maxLat - opts.minLat) / opts.tile);
  const totalTiles = tilesX * tilesY;

  console.log(
    `Preloading grid: bbox=[${opts.minLng},${opts.minLat},${opts.maxLng},${opts.maxLat}] tile=${opts.tile}° tiles=${totalTiles}`
  );

  let inserted = 0;
  let failed = 0;
  let tileIndex = 0;

  for (let y = 0; y < tilesY; y += 1) {
    const minLat = opts.minLat + y * opts.tile;
    const maxLat = Math.min(opts.maxLat, minLat + opts.tile);
    for (let x = 0; x < tilesX; x += 1) {
      tileIndex += 1;
      const minLng = opts.minLng + x * opts.tile;
      const maxLng = Math.min(opts.maxLng, minLng + opts.tile);
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      try {
        const query = buildBboxQuery(minLat, minLng, maxLat, maxLng);
        const elements = await fetchWithRetry(query, opts.retries);
        const hospitals = normalizeForStorage(elements, { lat: centerLat, lng: centerLng });
        if (hospitals.length) {
          inserted += await insertBatch(hospitals, opts.batch);
        }
        console.log(
          `[${tileIndex}/${totalTiles}] ${elements.length} elements, ${hospitals.length} kept (${inserted} total)`
        );
      } catch (error) {
        failed += 1;
        console.warn(`[${tileIndex}/${totalTiles}] FAILED: ${error.message}`);
      }
      if (opts.sleep) await sleep(opts.sleep);
    }
  }

  return { failed, inserted };
}

async function main() {
  const opts = parseArgs();
  const result = opts.cities ? await preloadCities(opts) : await preloadGrid(opts);
  const total = await HospitalModel.count();
  console.log(
    `\nDone. failed=${result.failed} upserted=${result.inserted} table_total=${total}`
  );
  await pool.end();
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Preload failed:', error.message);
    process.exitCode = 1;
    pool.end().finally(() => process.exit(1));
  });
}

module.exports = {
  INDIA_CITIES,
  DEFAULT_BBOX,
  parseArgs,
  preloadCity,
  preloadCities,
  normalizeForStorage,
  fetchWithRetry,
  insertBatch,
  sleep,
};

/*
 * Background auto-preload watcher.
 *
 * Skips cities that are already covered in the local `hospitals` table, probes
 * Overpass, and fills in the remaining cities as soon as a mirror recovers.
 * Designed to be launched detached and left running.
 *
 * Usage (from backend/):
 *   node scripts/auto-preload.js [--poll=<sec>] [--max-hours=<h>] [--radius=<km>]
 *                                [--coverage-km=<km>] [--min-existing=<n>]
 *
 * Defaults: poll=180s, max-hours=6, radius=45km, coverage-km=15, min-existing=8.
 */

const { pool } = require('../src/config/db');
const HospitalModel = require('../src/models/HospitalModel');
const { fetchOverpass } = require('../src/services/hospitalService');
const { INDIA_CITIES, preloadCity, sleep } = require('./preload-hospitals');

const PROBE_QUERY =
  '[out:json][timeout:25];node["amenity"="hospital"](28.60,77.19,28.62,77.21);out center 1;';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    pollSec: 180,
    maxHours: 6,
    radiusKm: 45,
    coverageKm: 15,
    minExisting: 8,
    retries: 3,
    batch: 400,
    sleep: 700,
    focus: null,
  };
  for (const arg of args) {
    const [key, value] = arg.replace(/^--/, '').split('=');
    const num = Number(value);
    if (key === 'focus' && value) {
      const parts = value.split(',').map(Number);
      if (parts.length === 2 && parts.every(Number.isFinite)) {
        out.focus = { lat: parts[0], lng: parts[1] };
      }
    } else if (key === 'poll' && num) out.pollSec = Math.max(30, num);
    else if (key === 'max-hours' && num) out.maxHours = Math.max(0.1, num);
    else if (key === 'radius' && num) out.radiusKm = Math.max(1, num);
    else if (key === 'coverage-km' && num) out.coverageKm = Math.max(1, num);
    else if (key === 'min-existing' && num) out.minExisting = Math.max(1, num);
    else if (key === 'retries' && num) out.retries = Math.max(1, num);
    else if (key === 'batch' && num) out.batch = Math.max(1, num);
    else if (key === 'sleep' && value !== undefined) out.sleep = Math.max(0, num);
  }
  return out;
}

function squaredDistance(a, b) {
  const dx = a.lng - b.lng;
  const dy = a.lat - b.lat;
  return dx * dx + dy * dy;
}

function orderedNames(pending, focus) {
  const names = [...pending.keys()];
  if (focus) {
    names.sort((a, b) => {
      const [alat, alng] = pending.get(a);
      const [blat, blng] = pending.get(b);
      return (
        squaredDistance({ lat: alat, lng: alng }, focus) -
        squaredDistance({ lat: blat, lng: blng }, focus)
      );
    });
  }
  return names;
}

function bboxAround(lat, lng, km) {
  const dLat = km / 110.574;
  const dLng = km / (111.32 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

async function isCovered(lat, lng, coverageKm, minExisting) {
  const count = await HospitalModel.countNearby(bboxAround(lat, lng, coverageKm));
  return count >= minExisting;
}

async function probe() {
  try {
    await fetchOverpass(PROBE_QUERY);
    return true;
  } catch {
    return false;
  }
}

function log(...parts) {
  console.log(`[${new Date().toISOString()}]`, ...parts);
}

async function main() {
  const opts = parseArgs();
  const deadline = Date.now() + opts.maxHours * 3600 * 1000;
  const pending = new Map(INDIA_CITIES.map(([name, lat, lng]) => [name, [lat, lng]]));

  log(
    `auto-preload start: ${pending.size} cities, poll=${opts.pollSec}s, maxHours=${opts.maxHours}, radius=${opts.radiusKm}km, minExisting=${opts.minExisting}` +
      (opts.focus ? `, focus=${opts.focus.lat},${opts.focus.lng}` : '')
  );

  let totalInserted = 0;
  let cycle = 0;

  while (pending.size > 0 && Date.now() < deadline) {
    cycle += 1;

    for (const name of [...pending.keys()]) {
      const [lat, lng] = pending.get(name);
      if (await isCovered(lat, lng, opts.coverageKm, opts.minExisting)) {
        pending.delete(name);
        log(`covered: ${name} (skipped)`);
      }
    }

    if (pending.size === 0) break;

    if (!(await probe())) {
      log(`probe failed (Overpass down). ${pending.size} pending. Sleeping ${opts.pollSec}s.`);
      await sleep(opts.pollSec * 1000);
      continue;
    }

    log(`cycle ${cycle}: Overpass up, ${pending.size} cities pending`);

    for (const name of orderedNames(pending, opts.focus)) {
      if (Date.now() >= deadline) break;
      const [lat, lng] = pending.get(name);
      try {
        const r = await preloadCity(name, lat, lng, {
          cityRadiusKm: opts.radiusKm,
          retries: opts.retries,
          batch: opts.batch,
        });
        totalInserted += r.inserted;
        pending.delete(name);
        log(`OK ${name}: ${r.elements} elements, ${r.kept} kept (+${r.inserted}) | ${pending.size} left`);
      } catch (error) {
        log(`fail ${name}: ${error.message}`);
      }
      await sleep(opts.sleep);
    }
  }

  const total = await HospitalModel.count();
  if (pending.size === 0) {
    log(`ALL DONE. upserted=${totalInserted} table_total=${total}`);
  } else {
    log(
      `STOPPED (time budget). remaining=${pending.size} [${[...pending.keys()].join(', ')}] table_total=${total}`
    );
  }
  await pool.end();
}

main().catch((error) => {
  console.error('auto-preload fatal:', error.message);
  pool.end().finally(() => process.exit(1));
});

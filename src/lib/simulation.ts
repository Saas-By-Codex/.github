import type { NormalizedTelemetry } from "@/integrations/types";

/**
 * Deterministic-ish EV telemetry simulator for demo mode.
 *
 * Produces plausible battery / range / location values so the whole product
 * can be demoed without any real vehicle connection. Values are seeded by the
 * vehicle's external id so a given vehicle looks stable across calls but still
 * drifts over time.
 */

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function seededRandom(seed: number): () => number {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

// Roughly central locations to scatter demo vehicles around (Austin, TX area).
const BASE_LAT = 30.2672;
const BASE_LNG = -97.7431;

export function simulateTelemetrySnapshot(externalId: string): NormalizedTelemetry {
  const rand = seededRandom(hashSeed(externalId) + Math.floor(Date.now() / 3_600_000));
  const baseRand = seededRandom(hashSeed(externalId));

  const batteryHealth = Math.round((88 + baseRand() * 11) * 10) / 10; // 88-99%
  const batteryLevel = Math.round((15 + rand() * 80) * 10) / 10; // 15-95%
  const ratedRange = 380 + baseRand() * 120;
  const rangeKm = Math.round((ratedRange * batteryLevel) / 100);
  const odometerKm = Math.round(8000 + baseRand() * 60000 + rand() * 200);
  const isCharging = rand() > 0.78;
  const temperatureC = Math.round((10 + rand() * 25) * 10) / 10;

  return {
    externalId,
    batteryLevel,
    batteryHealth,
    rangeKm,
    odometerKm,
    isCharging,
    temperatureC,
    latitude: BASE_LAT + (rand() - 0.5) * 0.4,
    longitude: BASE_LNG + (rand() - 0.5) * 0.4,
    recordedAt: new Date(),
  };
}

/** Generate a back-dated telemetry series for seeding history/charts. */
export function simulateTelemetryHistory(
  externalId: string,
  days: number,
  perDay = 4,
): NormalizedTelemetry[] {
  const out: NormalizedTelemetry[] = [];
  const baseRand = seededRandom(hashSeed(externalId));
  const ratedRange = 380 + baseRand() * 120;
  let level = 60 + baseRand() * 30;

  for (let d = days; d >= 0; d--) {
    for (let p = 0; p < perDay; p++) {
      const rand = seededRandom(hashSeed(externalId) + d * 100 + p);
      // Drift: discharge during the day, occasional recharge.
      const charging = rand() > 0.8;
      level = charging
        ? Math.min(100, level + 15 + rand() * 20)
        : Math.max(8, level - (3 + rand() * 12));

      const recordedAt = new Date();
      recordedAt.setDate(recordedAt.getDate() - d);
      recordedAt.setHours(Math.floor((24 / perDay) * p), 0, 0, 0);

      out.push({
        externalId,
        batteryLevel: Math.round(level * 10) / 10,
        batteryHealth: Math.round((88 + baseRand() * 11) * 10) / 10,
        rangeKm: Math.round((ratedRange * level) / 100),
        odometerKm: Math.round(8000 + (days - d) * 70 + p * 18),
        isCharging: charging,
        temperatureC: Math.round((10 + rand() * 25) * 10) / 10,
        latitude: BASE_LAT + (rand() - 0.5) * 0.4,
        longitude: BASE_LNG + (rand() - 0.5) * 0.4,
        recordedAt,
      });
    }
  }
  return out;
}

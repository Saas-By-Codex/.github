/**
 * Pure calculation helpers used by the cost, ESG, and driver-analytics modules.
 * Kept free of I/O so they are trivially unit-testable.
 */

/** Charging cost for a session given energy and price per kWh. */
export function chargingCost(energyKwh: number, pricePerKwh: number): number {
  return Math.round(energyKwh * pricePerKwh * 100) / 100;
}

const KWH_PER_LITRE_GASOLINE_EQUIV = 8.9; // approx energy in 1 L gasoline
const CO2_KG_PER_LITRE_GASOLINE = 2.31; // tailpipe CO2 per litre

/**
 * Carbon saved vs. an equivalent internal-combustion vehicle.
 *
 * We estimate the gasoline a comparable ICE car would have burned for the same
 * distance, convert to avoided tailpipe CO2, then subtract the grid emissions
 * actually incurred charging the EV.
 */
export function carbonSavings(params: {
  distanceKm: number;
  energyUsedKwh: number;
  gridCo2PerKwh: number;
  iceLitresPer100Km?: number;
}): { evCo2Kg: number; iceCo2Kg: number; savedCo2Kg: number } {
  const ice = params.iceLitresPer100Km ?? 8.0;
  const iceLitres = (params.distanceKm / 100) * ice;
  const iceCo2Kg = iceLitres * CO2_KG_PER_LITRE_GASOLINE;
  const evCo2Kg = params.energyUsedKwh * params.gridCo2PerKwh;
  const savedCo2Kg = Math.max(0, iceCo2Kg - evCo2Kg);
  return {
    evCo2Kg: round(evCo2Kg),
    iceCo2Kg: round(iceCo2Kg),
    savedCo2Kg: round(savedCo2Kg),
  };
}

/** Equivalent litres of gasoline displaced (handy for ESG storytelling). */
export function litresGasolineDisplaced(energyUsedKwh: number): number {
  return round(energyUsedKwh / KWH_PER_LITRE_GASOLINE_EQUIV);
}

/**
 * Composite 0-100 driver score. Starts at 100 and deducts weighted penalties
 * for unsafe events, normalized per 100 km so long and short trips compare.
 */
export function driverScore(params: {
  distanceKm: number;
  hardBrakingEvents: number;
  rapidAccelEvents: number;
  speedingEvents: number;
}): number {
  const per100 = Math.max(params.distanceKm, 1) / 100;
  const braking = params.hardBrakingEvents / per100;
  const accel = params.rapidAccelEvents / per100;
  const speeding = params.speedingEvents / per100;
  const penalty = braking * 2 + accel * 1.5 + speeding * 3;
  return Math.max(0, Math.min(100, round(100 - penalty)));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

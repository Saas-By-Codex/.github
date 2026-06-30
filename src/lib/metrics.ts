import { prisma } from "@/lib/db";
import { carbonSavings, litresGasolineDisplaced } from "@/lib/calculators";

/**
 * Server-side aggregation queries that power the dashboards. All queries are
 * scoped to a single organization id (multi-tenant isolation).
 */

export async function getFleetSummary(organizationId: string) {
  const [vehicles, openAlerts, integrations, drivers] = await Promise.all([
    prisma.vehicle.findMany({ where: { organizationId } }),
    prisma.maintenanceAlert.count({
      where: { vehicle: { organizationId }, status: "OPEN" },
    }),
    prisma.integrationAccount.count({
      where: { organizationId, status: "CONNECTED" },
    }),
    prisma.driver.count({ where: { organizationId } }),
  ]);

  // Latest telemetry per vehicle for battery/charging rollups.
  const latest = await Promise.all(
    vehicles.map((v) =>
      prisma.vehicleTelemetry.findFirst({
        where: { vehicleId: v.id },
        orderBy: { recordedAt: "desc" },
      }),
    ),
  );

  const withTelemetry = latest.filter(Boolean) as NonNullable<(typeof latest)[number]>[];
  const avgBattery = avg(withTelemetry.map((t) => t.batteryLevel));
  const avgHealth = avg(withTelemetry.map((t) => t.batteryHealth));
  const charging = withTelemetry.filter((t) => t.isCharging).length;

  return {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter((v) => v.status !== "OFFLINE").length,
    chargingNow: charging,
    openAlerts,
    connectedIntegrations: integrations,
    drivers,
    avgBatteryLevel: round(avgBattery),
    avgBatteryHealth: round(avgHealth),
  };
}

export async function getChargingSummary(organizationId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const sessions = await prisma.chargingSession.findMany({
    where: { vehicle: { organizationId }, startedAt: { gte: since } },
    orderBy: { startedAt: "asc" },
  });

  const totalEnergy = sum(sessions.map((s) => s.energyKwh));
  const totalCost = sum(sessions.map((s) => s.costAmount));

  // Bucket energy + cost by day for charting.
  const byDay = new Map<string, { energyKwh: number; cost: number }>();
  for (const s of sessions) {
    const key = s.startedAt.toISOString().slice(0, 10);
    const bucket = byDay.get(key) ?? { energyKwh: 0, cost: 0 };
    bucket.energyKwh += s.energyKwh;
    bucket.cost += s.costAmount;
    byDay.set(key, bucket);
  }

  return {
    sessionCount: sessions.length,
    totalEnergyKwh: round(totalEnergy),
    totalCost: round(totalCost),
    avgCostPerSession: round(sessions.length ? totalCost / sessions.length : 0),
    series: Array.from(byDay.entries()).map(([date, v]) => ({
      date,
      energyKwh: round(v.energyKwh),
      cost: round(v.cost),
    })),
  };
}

export async function getEsgReport(organizationId: string, days = 90) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [org, trips] = await Promise.all([
    prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
    prisma.driverTrip.findMany({
      where: { vehicle: { organizationId }, startedAt: { gte: since } },
    }),
  ]);

  const distanceKm = sum(trips.map((t) => t.distanceKm));
  const energyUsedKwh = sum(trips.map((t) => t.energyUsedKwh));
  const co2 = carbonSavings({
    distanceKm,
    energyUsedKwh,
    gridCo2PerKwh: org.gridCo2PerKwh,
  });

  return {
    periodDays: days,
    distanceKm: round(distanceKm),
    energyUsedKwh: round(energyUsedKwh),
    ...co2,
    litresGasolineDisplaced: litresGasolineDisplaced(energyUsedKwh),
    treesEquivalent: round(co2.savedCo2Kg / 21), // ~21 kg CO2/tree/yr
  };
}

function avg(xs: number[]): number {
  return xs.length ? sum(xs) / xs.length : 0;
}
function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

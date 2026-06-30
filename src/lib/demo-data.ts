import { prisma } from "@/lib/db";
import { VehicleProvider } from "@prisma/client";
import { simulateTelemetryHistory } from "@/lib/simulation";
import { chargingCost, driverScore } from "@/lib/calculators";

/**
 * Populate an organization with a realistic demo fleet: vehicles, telemetry
 * history, charging sessions, drivers, trips, and rule-derived maintenance
 * alerts. Idempotent-ish: it no-ops if the org already has vehicles so the
 * "Load demo data" button can't create duplicates.
 */
const DEMO_FLEET: Array<{
  name: string;
  make: string;
  model: string;
  provider: VehicleProvider;
  batteryCapacityKwh: number;
  ratedRangeKm: number;
}> = [
  { name: "Delivery 01", make: "Tesla", model: "Model Y", provider: VehicleProvider.TESLA, batteryCapacityKwh: 75, ratedRangeKm: 533 },
  { name: "Delivery 02", make: "Ford", model: "F-150 Lightning", provider: VehicleProvider.FORD, batteryCapacityKwh: 131, ratedRangeKm: 515 },
  { name: "Service Van A", make: "Hyundai", model: "IONIQ 5", provider: VehicleProvider.HYUNDAI, batteryCapacityKwh: 77, ratedRangeKm: 488 },
  { name: "Service Van B", make: "Kia", model: "EV9", provider: VehicleProvider.KIA, batteryCapacityKwh: 99, ratedRangeKm: 563 },
  { name: "Exec Sedan", make: "BMW", model: "i4", provider: VehicleProvider.BMW, batteryCapacityKwh: 84, ratedRangeKm: 590 },
  { name: "Pool Car", make: "Generic", model: "Connected EV", provider: VehicleProvider.SMARTCAR, batteryCapacityKwh: 64, ratedRangeKm: 420 },
];

const DEMO_DRIVERS = ["Alex Rivera", "Jordan Lee", "Sam Okafor", "Priya Patel"];

const LOCATIONS: Array<{ type: "HOME" | "DEPOT" | "PUBLIC" | "FAST_DC"; name: string }> = [
  { type: "DEPOT", name: "Main Depot" },
  { type: "FAST_DC", name: "Highway Supercharger" },
  { type: "PUBLIC", name: "Downtown Garage" },
  { type: "HOME", name: "Driver Home" },
];

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}
function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1));
}

export async function seedOrganizationDemoData(organizationId: string) {
  const existing = await prisma.vehicle.count({ where: { organizationId } });
  if (existing > 0) return { created: false };

  const org = await prisma.organization.findUniqueOrThrow({ where: { id: organizationId } });

  // Drivers
  const drivers = await Promise.all(
    DEMO_DRIVERS.map((name) =>
      prisma.driver.create({
        data: {
          organizationId,
          name,
          email: name.toLowerCase().replace(/\s+/g, ".") + "@demo.evfleetiq.com",
        },
      }),
    ),
  );

  for (let i = 0; i < DEMO_FLEET.length; i++) {
    const spec = DEMO_FLEET[i];
    const driver = drivers[i % drivers.length];

    const vehicle = await prisma.vehicle.create({
      data: {
        organizationId,
        name: spec.name,
        make: spec.make,
        model: spec.model,
        year: 2024,
        provider: spec.provider,
        batteryCapacityKwh: spec.batteryCapacityKwh,
        ratedRangeKm: spec.ratedRangeKm,
        assignedDriverId: driver.id,
        status: "ACTIVE",
        externalId: `demo-${spec.provider.toLowerCase()}-${i}`,
      },
    });

    // Telemetry history (30 days, 4/day)
    const history = simulateTelemetryHistory(vehicle.id, 30, 4);
    await prisma.vehicleTelemetry.createMany({
      data: history.map((t) => ({
        vehicleId: vehicle.id,
        recordedAt: t.recordedAt,
        batteryLevel: t.batteryLevel,
        batteryHealth: t.batteryHealth,
        rangeKm: t.rangeKm,
        odometerKm: t.odometerKm,
        isCharging: t.isCharging,
        temperatureC: t.temperatureC,
        latitude: t.latitude,
        longitude: t.longitude,
      })),
    });
    const latestHealth = history[history.length - 1]?.batteryHealth ?? 95;
    const latestOdo = history[history.length - 1]?.odometerKm ?? 10000;

    // Charging sessions (~3/week over 30 days)
    const sessions = randInt(10, 16);
    for (let s = 0; s < sessions; s++) {
      const startedAt = new Date();
      startedAt.setDate(startedAt.getDate() - randInt(0, 29));
      startedAt.setHours(randInt(6, 22), randInt(0, 59), 0, 0);
      const startPercent = rand(15, 45);
      const endPercent = Math.min(100, startPercent + rand(30, 55));
      const energyKwh = ((endPercent - startPercent) / 100) * spec.batteryCapacityKwh;
      const loc = LOCATIONS[randInt(0, LOCATIONS.length - 1)];
      // Fast DC costs more per kWh.
      const price = org.electricityPricePerKwh * (loc.type === "FAST_DC" ? 2.2 : loc.type === "PUBLIC" ? 1.6 : 1);
      const endedAt = new Date(startedAt.getTime() + rand(0.5, 2.5) * 3_600_000);

      await prisma.chargingSession.create({
        data: {
          vehicleId: vehicle.id,
          startedAt,
          endedAt,
          startPercent: Math.round(startPercent * 10) / 10,
          endPercent: Math.round(endPercent * 10) / 10,
          energyKwh: Math.round(energyKwh * 10) / 10,
          costAmount: chargingCost(energyKwh, price),
          currency: org.currency,
          locationType: loc.type,
          locationName: loc.name,
          peakPowerKw: loc.type === "FAST_DC" ? rand(120, 250) : rand(7, 22),
        },
      });
    }

    // Trips (driver behaviour)
    const trips = randInt(12, 24);
    for (let tr = 0; tr < trips; tr++) {
      const startedAt = new Date();
      startedAt.setDate(startedAt.getDate() - randInt(0, 29));
      const distanceKm = rand(8, 120);
      const endedAt = new Date(startedAt.getTime() + (distanceKm / 50) * 3_600_000);
      const hardBrakingEvents = randInt(0, 5);
      const rapidAccelEvents = randInt(0, 4);
      const speedingEvents = randInt(0, 3);
      const energyUsedKwh = (distanceKm / 100) * rand(15, 22);

      await prisma.driverTrip.create({
        data: {
          driverId: driver.id,
          vehicleId: vehicle.id,
          startedAt,
          endedAt,
          distanceKm: Math.round(distanceKm * 10) / 10,
          energyUsedKwh: Math.round(energyUsedKwh * 10) / 10,
          hardBrakingEvents,
          rapidAccelEvents,
          speedingEvents,
          score: driverScore({ distanceKm, hardBrakingEvents, rapidAccelEvents, speedingEvents }),
        },
      });
    }

    // Rule-derived maintenance alerts
    await createRuleAlerts(vehicle.id, latestHealth, latestOdo);
  }

  return { created: true };
}

/** Simple, transparent maintenance rules over latest telemetry. */
async function createRuleAlerts(vehicleId: string, batteryHealth: number, odometerKm: number) {
  const alerts: Array<{ code: string; title: string; description: string; severity: "INFO" | "WARNING" | "CRITICAL" }> = [];

  if (batteryHealth < 85) {
    alerts.push({
      code: "BATTERY_HEALTH_LOW",
      title: "Battery health degraded",
      description: `State of health is ${batteryHealth}%. Schedule a battery inspection.`,
      severity: batteryHealth < 80 ? "CRITICAL" : "WARNING",
    });
  }
  if (odometerKm > 40000) {
    alerts.push({
      code: "SERVICE_INTERVAL_DUE",
      title: "Service interval due",
      description: `Odometer at ${Math.round(odometerKm)} km — tyre and brake check recommended.`,
      severity: "INFO",
    });
  }
  // Always add a tyre rotation reminder on one vehicle for demo richness.
  if (Math.random() > 0.6) {
    alerts.push({
      code: "TYRE_ROTATION",
      title: "Tyre rotation recommended",
      description: "Routine tyre rotation keeps efficiency and safety optimal.",
      severity: "INFO",
    });
  }

  if (alerts.length) {
    await prisma.maintenanceAlert.createMany({
      data: alerts.map((a) => ({ vehicleId, ...a })),
    });
  }
}

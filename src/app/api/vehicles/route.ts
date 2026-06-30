import { withApi, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { createVehicleSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";
import { simulateTelemetryHistory } from "@/lib/simulation";

// GET /api/vehicles — list vehicles for the active org.
export async function GET(req: Request) {
  return withApi(req, async (ctx) => {
    assertCan(ctx.role, "fleet:read");
    const vehicles = await prisma.vehicle.findMany({
      where: { organizationId: ctx.organizationId },
      orderBy: { createdAt: "desc" },
    });
    return json({ vehicles });
  });
}

// POST /api/vehicles — create a vehicle (Manager+). Seeds demo telemetry so the
// vehicle is immediately useful in demo mode.
export async function POST(req: Request) {
  return withApi(req, async (ctx) => {
    assertCan(ctx.role, "fleet:write");
    const body = await req.json();
    const data = createVehicleSchema.parse(body);

    const vehicle = await prisma.vehicle.create({
      data: {
        organizationId: ctx.organizationId,
        name: data.name,
        make: data.make,
        model: data.model,
        year: data.year,
        vin: data.vin,
        provider: data.provider,
        batteryCapacityKwh: data.batteryCapacityKwh,
        ratedRangeKm: data.ratedRangeKm,
        assignedDriverId: data.assignedDriverId,
      },
    });

    // Seed a short telemetry history so charts render immediately.
    const history = simulateTelemetryHistory(vehicle.id, 7, 2);
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

    await recordAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "vehicle.create",
      targetType: "Vehicle",
      targetId: vehicle.id,
      metadata: { name: vehicle.name, provider: vehicle.provider },
      ipAddress: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    });

    return json({ vehicle }, 201);
  });
}

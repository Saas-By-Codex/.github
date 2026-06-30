import { VehicleProvider } from "@prisma/client";
import { MockVehicleAdapter } from "./mock-adapter";

/**
 * Per-manufacturer adapters. Each is a thin subclass declaring brand metadata,
 * the read-only OAuth scopes it would request, and a small sample catalog.
 *
 * Replace the inherited mock methods with real official-API calls when ready:
 *   - Tesla     → Fleet API (fleet-telemetry, vehicle data)        developer.tesla.com
 *   - Ford      → FordConnect API                                  developer.ford.com
 *   - Hyundai   → Bluelink / Connected Car API (region-specific)
 *   - Kia       → Kia Connect API (region-specific)
 *   - BMW       → BMW CarData / Connected Drive
 *   - Smartcar  → Generic telematics aggregator (multi-brand)      smartcar.com
 */

export class TeslaAdapter extends MockVehicleAdapter {
  readonly provider = VehicleProvider.TESLA;
  readonly displayName = "Tesla";
  readonly requestedScopes = ["vehicle_device_data", "vehicle_charging_cmds:read"];
  protected readonly catalog = [
    { model: "Model 3 LR", batteryCapacityKwh: 75, ratedRangeKm: 602 },
    { model: "Model Y", batteryCapacityKwh: 75, ratedRangeKm: 533 },
  ];
}

export class FordAdapter extends MockVehicleAdapter {
  readonly provider = VehicleProvider.FORD;
  readonly displayName = "Ford";
  readonly requestedScopes = ["vehicle.status.read", "vehicle.location.read"];
  protected readonly catalog = [
    { model: "F-150 Lightning", batteryCapacityKwh: 131, ratedRangeKm: 515 },
    { model: "Mustang Mach-E", batteryCapacityKwh: 91, ratedRangeKm: 491 },
  ];
}

export class HyundaiAdapter extends MockVehicleAdapter {
  readonly provider = VehicleProvider.HYUNDAI;
  readonly displayName = "Hyundai";
  readonly requestedScopes = ["bluelink.vehicle.read"];
  protected readonly catalog = [
    { model: "IONIQ 5", batteryCapacityKwh: 77, ratedRangeKm: 488 },
    { model: "IONIQ 6", batteryCapacityKwh: 77, ratedRangeKm: 581 },
  ];
}

export class KiaAdapter extends MockVehicleAdapter {
  readonly provider = VehicleProvider.KIA;
  readonly displayName = "Kia";
  readonly requestedScopes = ["kiaconnect.vehicle.read"];
  protected readonly catalog = [
    { model: "EV6", batteryCapacityKwh: 77, ratedRangeKm: 528 },
    { model: "EV9", batteryCapacityKwh: 99, ratedRangeKm: 563 },
  ];
}

export class BmwAdapter extends MockVehicleAdapter {
  readonly provider = VehicleProvider.BMW;
  readonly displayName = "BMW";
  readonly requestedScopes = ["cardata.read"];
  protected readonly catalog = [
    { model: "i4 eDrive40", batteryCapacityKwh: 84, ratedRangeKm: 590 },
    { model: "iX xDrive50", batteryCapacityKwh: 112, ratedRangeKm: 630 },
  ];
}

export class SmartcarAdapter extends MockVehicleAdapter {
  readonly provider = VehicleProvider.SMARTCAR;
  readonly displayName = "Smartcar (generic telematics)";
  readonly requestedScopes = [
    "read_vehicle_info",
    "read_battery",
    "read_charge",
    "read_location",
    "read_odometer",
  ];
  protected readonly catalog = [
    { model: "Connected EV", batteryCapacityKwh: 64, ratedRangeKm: 420 },
  ];
}

// Registry keyed by provider. The SIMULATED provider has no external adapter —
// its data is produced directly by the simulation engine.
const REGISTRY = {
  [VehicleProvider.TESLA]: new TeslaAdapter(),
  [VehicleProvider.FORD]: new FordAdapter(),
  [VehicleProvider.HYUNDAI]: new HyundaiAdapter(),
  [VehicleProvider.KIA]: new KiaAdapter(),
  [VehicleProvider.BMW]: new BmwAdapter(),
  [VehicleProvider.SMARTCAR]: new SmartcarAdapter(),
} as const;

export type ConnectableProvider = keyof typeof REGISTRY;

export function getAdapter(provider: ConnectableProvider) {
  return REGISTRY[provider];
}

export function listAdapters() {
  return Object.values(REGISTRY);
}

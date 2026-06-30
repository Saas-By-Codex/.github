import type { VehicleProvider } from "@prisma/client";

/**
 * Provider-agnostic vehicle integration contract.
 *
 * SAFETY / LEGAL: Adapters may ONLY read data exposed by official manufacturer
 * APIs or approved telematics aggregators, after the fleet owner has explicitly
 * authorized access via OAuth. This interface intentionally exposes NO
 * vehicle-control surface (no unlock, no start, no charge-stop). Adding control
 * features later requires (a) official API support and (b) an explicit,
 * audited authorization scope — and must never be inferred or "bypassed".
 */

export interface NormalizedVehicle {
  externalId: string;
  vin?: string;
  name: string;
  make: string;
  model: string;
  year?: number;
  batteryCapacityKwh: number;
  ratedRangeKm: number;
}

export interface NormalizedTelemetry {
  externalId: string;
  batteryLevel: number; // %
  batteryHealth: number; // %
  rangeKm: number;
  odometerKm: number;
  isCharging: boolean;
  temperatureC?: number;
  latitude?: number;
  longitude?: number;
  recordedAt: Date;
}

export interface ProviderCredentials {
  accessToken: string;
  refreshToken?: string;
  scopes?: string;
}

export interface VehicleIntegrationAdapter {
  readonly provider: VehicleProvider;
  readonly displayName: string;
  /** Human-readable scopes this integration requests (read-only). */
  readonly requestedScopes: string[];

  /** Validate credentials and confirm the account is reachable. */
  verify(creds: ProviderCredentials): Promise<boolean>;

  /** List vehicles the authorized account can read. */
  listVehicles(creds: ProviderCredentials): Promise<NormalizedVehicle[]>;

  /** Fetch the latest telemetry snapshot for a vehicle. */
  getTelemetry(
    creds: ProviderCredentials,
    externalId: string,
  ): Promise<NormalizedTelemetry>;
}

import type { VehicleProvider } from "@prisma/client";
import type {
  NormalizedTelemetry,
  NormalizedVehicle,
  ProviderCredentials,
  VehicleIntegrationAdapter,
} from "./types";
import { simulateTelemetrySnapshot } from "@/lib/simulation";

/**
 * Reusable mock adapter for the MVP. Every manufacturer adapter extends this
 * and supplies provider-specific metadata. In demo mode it returns simulated
 * data instead of calling any external API.
 *
 * To wire a REAL official API later: override `verify`, `listVehicles`, and
 * `getTelemetry` to call the manufacturer's documented REST endpoints with the
 * OAuth access token, then map responses into the Normalized* shapes. The rest
 * of the application is unchanged.
 */
export abstract class MockVehicleAdapter implements VehicleIntegrationAdapter {
  abstract readonly provider: VehicleProvider;
  abstract readonly displayName: string;
  abstract readonly requestedScopes: string[];
  // Sample catalog used to fabricate demo vehicles for this brand.
  protected abstract readonly catalog: Array<{
    model: string;
    batteryCapacityKwh: number;
    ratedRangeKm: number;
  }>;

  async verify(creds: ProviderCredentials): Promise<boolean> {
    // A real adapter would call the provider's token-introspection / "me"
    // endpoint here. The mock simply checks a non-empty token is present.
    return Boolean(creds.accessToken);
  }

  async listVehicles(_creds: ProviderCredentials): Promise<NormalizedVehicle[]> {
    return this.catalog.map((entry, i) => ({
      externalId: `${this.provider.toLowerCase()}-demo-${i + 1}`,
      vin: `DEMO${this.provider}${String(i + 1).padStart(11, "0")}`,
      name: `${this.displayName} ${entry.model}`,
      make: this.displayName,
      model: entry.model,
      year: 2024,
      batteryCapacityKwh: entry.batteryCapacityKwh,
      ratedRangeKm: entry.ratedRangeKm,
    }));
  }

  async getTelemetry(
    _creds: ProviderCredentials,
    externalId: string,
  ): Promise<NormalizedTelemetry> {
    return simulateTelemetrySnapshot(externalId);
  }
}

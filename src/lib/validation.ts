import { z } from "zod";

// Centralized input schemas. Every API route validates with these before
// touching the database, satisfying the "validate all inputs" requirement.

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const signupSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export const onboardingSchema = z.object({
  organizationName: z.string().min(2).max(120),
  industry: z.string().max(120).optional(),
  currency: z.string().length(3).default("USD"),
});

export const createVehicleSchema = z.object({
  name: z.string().min(1).max(120),
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.coerce.number().int().min(1990).max(2100).optional(),
  vin: z.string().max(32).optional(),
  provider: z
    .enum(["TESLA", "FORD", "HYUNDAI", "KIA", "BMW", "SMARTCAR", "SIMULATED"])
    .default("SIMULATED"),
  batteryCapacityKwh: z.coerce.number().positive().max(500).default(60),
  ratedRangeKm: z.coerce.number().positive().max(2000).default(400),
  assignedDriverId: z.string().cuid().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const connectIntegrationSchema = z.object({
  provider: z.enum(["TESLA", "FORD", "HYUNDAI", "KIA", "BMW", "SMARTCAR"]),
  // In demo mode this is a mock token; in production it comes from OAuth.
  accessToken: z.string().min(1),
  refreshToken: z.string().optional(),
  scopes: z.string().optional(),
});

export const updateMemberRoleSchema = z.object({
  memberId: z.string().cuid(),
  role: z.enum(["OWNER", "ADMIN", "MANAGER", "VIEWER"]),
});

export const alertStatusSchema = z.object({
  status: z.enum(["OPEN", "ACKNOWLEDGED", "RESOLVED"]),
});

export const orgSettingsSchema = z.object({
  electricityPricePerKwh: z.coerce.number().min(0).max(10),
  gridCo2PerKwh: z.coerce.number().min(0).max(2),
  currency: z.string().length(3),
});

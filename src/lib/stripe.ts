import Stripe from "stripe";

/**
 * Lazily-initialized Stripe client. Billing is optional for the MVP — if
 * STRIPE_SECRET_KEY is unset (e.g. demo mode), `getStripe()` returns null and
 * billing endpoints respond with a clear "not configured" message instead of
 * crashing.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) {
    // Use the SDK's pinned API version (omit to avoid literal-type drift).
    client = new Stripe(key);
  }
  return client;
}

// Plan → Stripe price id mapping. Fill these from your Stripe dashboard.
export const PLAN_PRICES: Record<string, string | undefined> = {
  STARTER: process.env.STRIPE_PRICE_STARTER,
  GROWTH: process.env.STRIPE_PRICE_GROWTH,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
};

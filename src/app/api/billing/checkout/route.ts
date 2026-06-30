import { z } from "zod";
import { withApi, json } from "@/lib/api";
import { prisma } from "@/lib/db";
import { assertCan } from "@/lib/rbac";
import { getStripe, PLAN_PRICES } from "@/lib/stripe";
import { recordAudit } from "@/lib/audit";

const schema = z.object({ plan: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]) });

// POST /api/billing/checkout — create a Stripe Checkout session (Owner only).
// Returns the hosted checkout URL. No-ops gracefully when Stripe isn't set up.
export async function POST(req: Request) {
  return withApi(req, async (ctx) => {
    assertCan(ctx.role, "billing:manage");
    const stripe = getStripe();
    if (!stripe) {
      return json({ error: "Billing is not configured (set STRIPE_SECRET_KEY)." }, 501);
    }

    const { plan } = schema.parse(await req.json());
    const priceId = PLAN_PRICES[plan];
    if (!priceId) return json({ error: `No Stripe price configured for ${plan}` }, 400);

    const org = await prisma.organization.findUniqueOrThrow({
      where: { id: ctx.organizationId },
      include: { subscription: true },
    });

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: org.subscription?.seats ?? 3 }],
      customer: org.subscription?.stripeCustomerId ?? undefined,
      customer_email: org.subscription?.stripeCustomerId ? undefined : ctx.email,
      client_reference_id: ctx.organizationId,
      success_url: `${baseUrl}/settings?billing=success`,
      cancel_url: `${baseUrl}/settings?billing=cancelled`,
      metadata: { organizationId: ctx.organizationId, plan },
    });

    await recordAudit({
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      action: "billing.checkout_started",
      metadata: { plan },
    });

    return json({ url: session.url });
  });
}

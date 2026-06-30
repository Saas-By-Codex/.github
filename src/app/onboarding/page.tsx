import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { onboardingSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/audit";

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // If already in an org, skip onboarding.
  const existing = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
  });
  if (existing) redirect("/dashboard");

  async function createOrg(formData: FormData) {
    "use server";
    const s = await auth();
    if (!s?.user?.id) redirect("/login");

    const parsed = onboardingSchema.safeParse({
      organizationName: formData.get("organizationName"),
      industry: formData.get("industry") || undefined,
      currency: formData.get("currency") || "USD",
    });
    if (!parsed.success) redirect("/onboarding?error=invalid");

    const { organizationName, industry, currency } = parsed.data;

    const org = await prisma.organization.create({
      data: {
        name: organizationName,
        slug: slugify(organizationName),
        industry,
        currency,
        members: {
          create: { userId: s.user.id, role: "OWNER" },
        },
        subscription: {
          create: { plan: "FREE", status: "TRIALING", seats: 3 },
        },
      },
    });

    await recordAudit({
      organizationId: org.id,
      userId: s.user.id,
      action: "organization.create",
      targetType: "Organization",
      targetId: org.id,
      metadata: { name: organizationName },
    });

    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <span className="text-2xl">⚡</span>
          <h1 className="mt-3 text-xl font-semibold">Set up your organization</h1>
          <p className="mt-1 text-sm text-slate-500">
            This is your fleet workspace. You can invite teammates and connect vehicles next.
          </p>

          <form action={createOrg} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="organizationName">Organization name</label>
              <input id="organizationName" name="organizationName" required className="input" placeholder="Acme Logistics" />
            </div>
            <div>
              <label className="label" htmlFor="industry">Industry (optional)</label>
              <input id="industry" name="industry" className="input" placeholder="Last-mile delivery" />
            </div>
            <div>
              <label className="label" htmlFor="currency">Currency</label>
              <select id="currency" name="currency" className="input" defaultValue="USD">
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
            <button type="submit" className="btn-primary w-full">Create workspace</button>
          </form>
        </div>
      </div>
    </main>
  );
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedOrganizationDemoData } from "../src/lib/demo-data";

const prisma = new PrismaClient();

/**
 * Seeds a ready-to-explore demo account:
 *   email:    owner@demo.evfleetiq.com
 *   password: demo12345
 * plus a sample organization full of simulated fleet data.
 */
async function main() {
  const email = "owner@demo.evfleetiq.com";
  const passwordHash = await bcrypt.hash("demo12345", 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: "Demo Owner", passwordHash },
  });

  let membership = await prisma.teamMember.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  if (!membership) {
    const org = await prisma.organization.create({
      data: {
        name: "Demo Fleet Co.",
        slug: "demo-fleet-co",
        industry: "Last-mile delivery",
        currency: "USD",
        members: { create: { userId: user.id, role: "OWNER" } },
        subscription: { create: { plan: "GROWTH", status: "ACTIVE", seats: 10 } },
      },
    });
    membership = await prisma.teamMember.findFirst({
      where: { userId: user.id },
      include: { organization: true },
    });
    console.log(`Created organization: ${org.name}`);
  }

  if (membership) {
    const result = await seedOrganizationDemoData(membership.organizationId);
    console.log(
      result.created
        ? "Seeded demo fleet (vehicles, telemetry, charging, drivers, trips, alerts)."
        : "Demo fleet already present — skipped.",
    );
  }

  console.log("\n✅ Seed complete.");
  console.log("   Login: owner@demo.evfleetiq.com / demo12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

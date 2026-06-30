import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getActiveContext } from "@/lib/session";
import { databaseReady } from "@/lib/db-check";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fresh deploy without a database → guide to setup instead of a 500.
  if (!(await databaseReady())) redirect("/setup");

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const ctx = await getActiveContext();
  if (!ctx) redirect("/onboarding");

  const demoMode = process.env.DEMO_MODE !== "false";

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="md:pl-64">
        <Topbar
          email={ctx.email}
          orgName={ctx.organizationName}
          role={ctx.role}
          demoMode={demoMode}
        />
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

import { signOut } from "@/lib/auth";
import { Badge } from "@/components/ui";

export function Topbar({
  email,
  orgName,
  role,
  demoMode,
}: {
  email: string;
  orgName: string;
  role: string;
  demoMode: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3 pl-10 md:pl-0">
        <span className="font-medium text-slate-800">{orgName}</span>
        <Badge tone="blue">{role}</Badge>
        {demoMode && <Badge tone="amber">Demo Mode</Badge>}
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-500 sm:inline">{email}</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button className="btn-secondary text-sm">Sign out</button>
        </form>
      </div>
    </header>
  );
}

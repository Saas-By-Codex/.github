import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { databaseReady } from "@/lib/db-check";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (!(await databaseReady())) redirect("/setup");

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/dashboard",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=invalid");
      }
      throw err; // re-throw redirect signals
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-lg font-semibold">EVFleetIQ</span>
        </Link>
        <div className="card">
          <h1 className="text-xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to your fleet dashboard.</p>

          {searchParams.error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              Invalid email or password.
            </p>
          )}

          <form action={login} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" name="email" type="email" required className="input" placeholder="you@company.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full">Log in</button>
          </form>

          <p className="mt-2 text-center text-xs text-slate-400">
            Demo account: <code>owner@demo.evfleetiq.com</code> / <code>demo12345</code>
          </p>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-brand-600">Sign up</Link>
        </p>
      </div>
    </main>
  );
}

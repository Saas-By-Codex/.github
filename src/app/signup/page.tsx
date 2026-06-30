import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";
import { databaseReady } from "@/lib/db-check";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (!(await databaseReady())) redirect("/setup");

  async function signup(formData: FormData) {
    "use server";
    const parsed = signupSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) redirect("/signup?error=invalid");

    const { name, email, password } = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) redirect("/signup?error=exists");

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, passwordHash } });

    await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  }

  const errorMessage =
    searchParams.error === "exists"
      ? "An account with that email already exists."
      : searchParams.error
        ? "Please check your details and try again (password must be 8+ characters)."
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-lg font-semibold">EVFleetIQ</span>
        </Link>
        <div className="card">
          <h1 className="text-xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Start monitoring your EV fleet in minutes.</p>

          {errorMessage && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          )}

          <form action={signup} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" name="name" required className="input" placeholder="Jane Operator" />
            </div>
            <div>
              <label className="label" htmlFor="email">Work email</label>
              <input id="email" name="email" type="email" required className="input" placeholder="you@company.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="At least 8 characters" />
            </div>
            <button type="submit" className="btn-primary w-full">Create account</button>
          </form>
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-600">Log in</Link>
        </p>
      </div>
    </main>
  );
}

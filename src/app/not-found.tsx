import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center">
      <div className="text-5xl">⚡</div>
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-slate-500">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/dashboard" className="btn-primary">Back to dashboard</Link>
    </main>
  );
}

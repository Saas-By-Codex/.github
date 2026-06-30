import Link from "next/link";

const FEATURES = [
  { icon: "🔋", title: "Battery & Health", desc: "Real-time state of charge and long-term battery health across every brand." },
  { icon: "🔌", title: "Charging Insights", desc: "Charging sessions, history, and a built-in cost calculator." },
  { icon: "🗺️", title: "Range & Location", desc: "Live range and location tracking — only where the owner has authorized it." },
  { icon: "🛠️", title: "Maintenance Alerts", desc: "Proactive alerts before small issues become expensive downtime." },
  { icon: "🧑‍✈️", title: "Driver Analytics", desc: "Safety and efficiency scores from authorized trip telematics." },
  { icon: "🌱", title: "ESG Reporting", desc: "Quantify carbon savings vs. combustion fleets for stakeholders." },
];

const BRANDS = ["Tesla", "Ford", "Hyundai", "Kia", "BMW", "Smartcar"];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="text-lg font-semibold">EVFleetIQ</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">Log in</Link>
          <Link href="/signup" className="btn-primary">Get started</Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-12 pt-16 text-center">
        <span className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
          Legal & authorized integrations only
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
          One dashboard for your entire <span className="text-brand-600">EV fleet</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
          EVFleetIQ unifies battery health, charging costs, maintenance, driver behaviour, and ESG
          reporting across every electric vehicle you operate — using official manufacturer APIs and
          approved telematics providers.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/signup" className="btn-primary px-6 py-3 text-base">Start free</Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-base">Try the demo</Link>
        </div>
        <p className="mt-4 text-xs text-slate-400">
          Demo mode uses simulated vehicle data — no real vehicle connection required.
        </p>
      </section>

      {/* Brands */}
      <section className="mx-auto max-w-4xl px-6 py-8">
        <p className="text-center text-sm font-medium uppercase tracking-wide text-slate-400">
          Built to integrate with
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-slate-500">
          {BRANDS.map((b) => (
            <span key={b} className="text-lg font-semibold">{b}</span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-6">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety note */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-6 text-center">
          <h3 className="text-lg font-semibold text-brand-800">Responsible by design</h3>
          <p className="mt-2 text-sm text-brand-700">
            EVFleetIQ only reads data from official manufacturer APIs and approved telematics
            providers, after the fleet owner explicitly authorizes access. It never bypasses,
            reverse-engineers, or sends unsafe vehicle-control commands.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} EVFleetIQ. For demonstration purposes.
      </footer>
    </main>
  );
}

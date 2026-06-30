import { requireContext } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatCard } from "@/components/ui";
import { ScoreBarChart } from "@/components/charts";
import { formatNumber } from "@/lib/utils";

export default async function DriversPage() {
  const ctx = await requireContext();
  const drivers = await prisma.driver.findMany({
    where: { organizationId: ctx.organizationId },
    include: { trips: { orderBy: { startedAt: "desc" }, take: 50 } },
    orderBy: { name: "asc" },
  });

  if (drivers.length === 0) {
    return (
      <>
        <PageHeader title="Driver Analytics" description="Safety and efficiency scores from authorized trip telematics." />
        <EmptyState icon="🧑‍✈️" title="No drivers yet" description="Add drivers and assign vehicles, or load demo data to see analytics." />
      </>
    );
  }

  const rows = drivers.map((d) => {
    const trips = d.trips;
    const distance = trips.reduce((a, t) => a + t.distanceKm, 0);
    const energy = trips.reduce((a, t) => a + t.energyUsedKwh, 0);
    const score = trips.length
      ? trips.reduce((a, t) => a + t.score, 0) / trips.length
      : 100;
    const events = trips.reduce(
      (a, t) => a + t.hardBrakingEvents + t.rapidAccelEvents + t.speedingEvents,
      0,
    );
    return {
      id: d.id,
      name: d.name,
      trips: trips.length,
      distance: Math.round(distance),
      efficiency: distance ? Math.round((energy / distance) * 1000) / 10 : 0, // kWh/100km
      events,
      score: Math.round(score * 10) / 10,
    };
  });

  const fleetScore = rows.length
    ? Math.round((rows.reduce((a, r) => a + r.score, 0) / rows.length) * 10) / 10
    : 0;

  return (
    <>
      <PageHeader title="Driver Analytics" description="Composite 0–100 score from braking, acceleration, and speeding events." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Drivers" value={rows.length} />
        <StatCard label="Fleet avg score" value={fleetScore} accent={fleetScore >= 85 ? "green" : "amber"} />
        <StatCard label="Total trips" value={rows.reduce((a, r) => a + r.trips, 0)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Driver scores</h2>
          <ScoreBarChart data={rows.map((r) => ({ name: r.name, score: r.score }))} />
        </Card>

        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Driver</th>
                <th className="px-5 py-3 font-medium">Trips</th>
                <th className="px-5 py-3 font-medium">Distance</th>
                <th className="px-5 py-3 font-medium">Efficiency</th>
                <th className="px-5 py-3 font-medium">Events</th>
                <th className="px-5 py-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{r.name}</td>
                  <td className="px-5 py-3 text-slate-600">{r.trips}</td>
                  <td className="px-5 py-3 text-slate-600">{formatNumber(r.distance)} km</td>
                  <td className="px-5 py-3 text-slate-600">{r.efficiency} kWh/100km</td>
                  <td className="px-5 py-3 text-slate-600">{r.events}</td>
                  <td className="px-5 py-3 font-semibold" style={{ color: r.score >= 85 ? "#13874f" : r.score >= 70 ? "#d97706" : "#dc2626" }}>
                    {r.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

import { requireContext } from "@/lib/session";
import { getEsgReport } from "@/lib/metrics";
import { Card, PageHeader, StatCard } from "@/components/ui";
import { formatNumber } from "@/lib/utils";

export default async function EsgPage() {
  const ctx = await requireContext();
  const esg = await getEsgReport(ctx.organizationId, 90);

  return (
    <>
      <PageHeader
        title="ESG / Carbon Report"
        description="Estimated carbon savings vs. an equivalent combustion fleet over the last 90 days."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="CO₂ saved" value={`${formatNumber(esg.savedCo2Kg)} kg`} accent="green" hint="vs. combustion" />
        <StatCard label="Distance driven" value={`${formatNumber(esg.distanceKm)} km`} />
        <StatCard label="Energy used" value={`${formatNumber(esg.energyUsedKwh)} kWh`} />
        <StatCard label="≈ Trees / year" value={formatNumber(esg.treesEquivalent)} accent="green" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Emissions comparison</h2>
          <div className="space-y-4">
            <Bar label="Combustion equivalent" value={esg.iceCo2Kg} max={esg.iceCo2Kg} tone="bg-slate-400" suffix="kg CO₂" />
            <Bar label="Your EV fleet (grid)" value={esg.evCo2Kg} max={esg.iceCo2Kg} tone="bg-brand-500" suffix="kg CO₂" />
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Net avoided emissions: <strong className="text-brand-700">{formatNumber(esg.savedCo2Kg)} kg CO₂</strong>
          </p>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Methodology</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>• Combustion baseline assumes 8.0 L/100km at 2.31 kg CO₂/L.</li>
            <li>• EV grid emissions use your org&apos;s grid factor (editable in Settings).</li>
            <li>• Gasoline displaced ≈ {formatNumber(esg.litresGasolineDisplaced)} L.</li>
            <li>• Tree equivalence assumes ~21 kg CO₂ sequestered per tree per year.</li>
          </ul>
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Figures are estimates for internal reporting and stakeholder communication, not certified
            carbon accounting.
          </p>
        </Card>
      </div>
    </>
  );
}

function Bar({ label, value, max, tone, suffix }: { label: string; value: number; max: number; tone: string; suffix: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium">{formatNumber(value)} {suffix}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

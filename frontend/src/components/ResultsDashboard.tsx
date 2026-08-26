import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PredictResponse } from '../api'

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
      <div className="truncate text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 break-words text-xl font-semibold text-slate-50">{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

export default function ResultsDashboard({ result }: { result: PredictResponse }) {
  const isSeedData = result.model_source === 'physics_fallback_seed_climatology'

  return (
    <div className="flex flex-col gap-5">
      {isSeedData && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
          Using placeholder seed climatology &mdash; swap in the trained model's real
          historical-data output for final numbers.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="System size" value={`${result.capacity_kwp.toFixed(2)} kWp`} />
        <StatCard
          label="Annual generation"
          value={`${result.annual_generation_kwh.toLocaleString('en-IN')} kWh`}
        />
        <StatCard label="Install cost" value={formatINR(result.install_cost_inr)} />
        <StatCard
          label="Payback period"
          value={`${result.payback_period_years.toFixed(1)} yrs`}
        />
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
        <div className="mb-3 text-sm font-medium text-slate-300">
          Monthly generation (kWh) &mdash; seasonal fluctuation
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={result.monthly_generation}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
              labelStyle={{ color: '#e2e8f0' }}
            />
            <Bar dataKey="generation_kwh" fill="#22d3ee" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <StatCard label="Annual bill savings" value={formatINR(result.annual_savings_inr)} />
        <StatCard label="5-year savings" value={formatINR(result.savings_5yr_inr)} />
        <StatCard label="10-year savings" value={formatINR(result.savings_10yr_inr)} />
      </div>
      <p className="text-xs text-slate-500">
        Panel degradation is not modeled, matching the original project's scope. Cost and
        tariff figures are illustrative averages, not a bankable quote.
      </p>
    </div>
  )
}

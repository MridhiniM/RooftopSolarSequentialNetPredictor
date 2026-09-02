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
    <div style={{ background: 'white', border: '2px solid #fbbf24', padding: '14px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#6b7280', fontWeight: 500 }}>{label}</div>
      <div style={{ marginTop: '6px', wordBreak: 'break-word', fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>{value}</div>
      {sub && <div style={{ marginTop: '4px', fontSize: '12px', color: '#6b7280' }}>{sub}</div>}
    </div>
  )
}

export default function ResultsDashboard({ result }: { result: PredictResponse }) {
  const isSeedData = result.model_source === 'physics_fallback_seed_climatology'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with pulsing sun */}
      <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px solid #fbbf24' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px', animation: 'pulse 2s infinite' }} className="pulse-animation">☀️</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>Prediction Results</div>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>Your solar energy potential</p>
      </div>

      {isSeedData && (
        <div style={{ border: '2px solid #f59e0b', background: 'rgba(245, 158, 11, 0.08)', padding: '12px', fontSize: '13px', color: '#92400e', fontWeight: 500 }}>
          Using placeholder seed climatology — swap in the trained model's real historical-data output for final numbers.
        </div>
      )}

      {/* Main Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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

      {/* Chart */}
      <div style={{ background: 'white', border: '2px solid #fbbf24', padding: '16px' }}>
        <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
          📊 Monthly generation (kWh)
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={result.monthly_generation}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{ background: '#fffbf0', border: '2px solid #fbbf24', fontFamily: 'Poppins, system-ui, sans-serif' }}
              labelStyle={{ color: '#1f2937' }}
            />
            <Bar dataKey="generation_kwh" fill="#f59e0b" radius={0} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <StatCard label="💰 Annual bill savings" value={formatINR(result.annual_savings_inr)} />
        <StatCard label="5-year savings" value={formatINR(result.savings_5yr_inr)} />
        <StatCard label="10-year savings" value={formatINR(result.savings_10yr_inr)} />
      </div>

      {/* Footer note */}
      <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', marginTop: '8px', lineHeight: '1.5' }}>
        Panel degradation is not modeled, matching the original project's scope. Cost and tariff figures are illustrative averages, not a bankable quote.
      </p>
    </div>
  )
}
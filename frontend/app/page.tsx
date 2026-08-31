'use client';
import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import MetricCard from '@/components/ui/MetricCard';
import AnomalyCard from '@/components/ui/AnomalyCard';
import RiskBadge from '@/components/ui/RiskBadge';
import { api } from '@/lib/api';
import { DashboardSummary, Anomaly, PriorityItem } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string>('');

  async function load() {
    setLoading(true);
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (e: any) {
      setError('Could not connect to backend. Make sure the server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  }

  async function runAll() {
    setRunning(true);
    setRunResult('');
    try {
      const r = await api.runAllChecks();
      setRunResult('All analysis engines completed successfully.');
      await load();
    } catch {
      setRunResult('Analysis failed — check backend logs.');
    } finally {
      setRunning(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <AppLayout><div className="text-gray-400 text-sm p-8">Loading dashboard...</div></AppLayout>;
  if (error) return <AppLayout><div className="p-8 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div></AppLayout>;
  if (!data) return <AppLayout><div className="p-8 text-gray-400">No data</div></AppLayout>;

  const dist = data.risk_distribution;

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Monitoring Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Employability Development Scheme — Overview</p>
        </div>
        <div className="flex gap-3 items-center">
          {runResult && (
            <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded">{runResult}</span>
          )}
          <button onClick={runAll} disabled={running}
            className="px-4 py-2 text-sm font-semibold text-white rounded disabled:opacity-50"
            style={{ backgroundColor: '#1D6FA4' }}>
            {running ? 'Running...' : 'RUN ALL CHECKS'}
          </button>
          <button onClick={load} className="px-4 py-2 text-sm border border-gray-200 rounded bg-white text-gray-700">
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Training Centres" value={data.total_centres} sub="Registered" />
        <MetricCard label="Active Batches" value={data.active_batches} sub="Currently running" />
        <MetricCard label="Total Beneficiaries" value={data.total_beneficiaries} sub="Enrolled" />
        <MetricCard label="Open Anomalies" value={data.open_anomalies} color="#DC3545" sub="Requiring review" bg="#FFF5F5" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Critical Risk Centres" value={data.critical_risk_centres} color="#DC3545" bg="#FFF5F5" />
        <MetricCard label="High + Critical" value={data.high_risk_centres} color="#FD7E14" bg="#FFF8F0" />
        <MetricCard label="Pending Inspections" value={data.pending_inspections} color="#1D6FA4" />
        <MetricCard label="Overdue Actions" value={data.overdue_actions} color="#DC3545" bg="#FFF5F5" sub="Past deadline" />
      </div>

      {/* Risk Distribution Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Risk Distribution — All Centres</h2>
        <div className="flex gap-3 items-end h-20">
          {(['critical', 'high', 'medium', 'low'] as const).map(level => {
            const count = dist[level] || 0;
            const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1;
            const pct = Math.max((count / total) * 100, 4);
            const colors: Record<string, string> = { critical: '#DC3545', high: '#FD7E14', medium: '#FFC107', low: '#198754' };
            return (
              <div key={level} className="flex flex-col items-center flex-1">
                <span className="text-xs font-bold mb-1" style={{ color: colors[level] }}>{count}</span>
                <div className="w-full rounded-t" style={{ height: `${pct}%`, backgroundColor: colors[level], opacity: 0.85 }} />
                <span className="text-xs text-gray-500 mt-1 capitalize">{level}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Anomalies */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Recent Anomalies</h2>
            <Link href="/anomalies" className="text-xs text-blue-600 hover:underline">View All</Link>
          </div>
          {data.recent_anomalies.length === 0 ? (
            <p className="text-gray-400 text-sm">No open anomalies detected.</p>
          ) : (
            <div className="space-y-2">
              {data.recent_anomalies.slice(0, 5).map(a => (
                <Link key={a.id} href={`/anomalies?id=${a.id}`}>
                  <AnomalyCard anomaly={a as Anomaly} compact />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Priority Centres */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Top Priority — Pending Inspection</h2>
            <Link href="/priority" className="text-xs text-blue-600 hover:underline">Full List</Link>
          </div>
          {data.top_priorities.length === 0 ? (
            <p className="text-gray-400 text-sm">No centres flagged.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th style={{ width: 32 }}>#</th>
                  <th>Centre</th>
                  <th>Risk</th>
                  <th>Score</th>
                  <th>Days Since Insp.</th>
                </tr>
              </thead>
              <tbody>
                {data.top_priorities.map((p: PriorityItem) => (
                  <tr key={p.centre_id}>
                    <td className="font-bold text-gray-500">{p.rank}</td>
                    <td>
                      <Link href={`/centres/${p.centre_id}`} className="text-blue-600 hover:underline font-medium">
                        {p.centre_name}
                      </Link>
                      <div className="text-xs text-gray-400">{p.district}</div>
                    </td>
                    <td><RiskBadge level={p.risk_level} /></td>
                    <td className="font-bold">{p.risk_score}</td>
                    <td className={p.days_since_inspection > 365 ? 'text-red-600 font-semibold' : ''}>
                      {p.days_since_inspection}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

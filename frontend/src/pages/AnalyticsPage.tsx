import React, { useMemo } from 'react';
import { useGetTrades } from '../hooks/useQueries';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

function formatCurrency(val: number) {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const COLORS = [
  'oklch(0.72 0.18 55)',
  'oklch(0.65 0.2 145)',
  'oklch(0.58 0.22 25)',
  'oklch(0.65 0.18 200)',
  'oklch(0.6 0.15 280)',
];

export default function AnalyticsPage() {
  const { data: trades = [], isLoading } = useGetTrades();

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; pnl: number; trades: number; wins: number }> = {};
    trades.forEach((t) => {
      const d = new Date(Number(t.date) / 1_000_000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      if (!map[key]) map[key] = { month: label, pnl: 0, trades: 0, wins: 0 };
      map[key].pnl += t.pnl;
      map[key].trades++;
      if (t.pnl > 0) map[key].wins++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, pnl: parseFloat(v.pnl.toFixed(2)) }));
  }, [trades]);

  const emotionData = useMemo(() => {
    const map: Record<string, { count: number; pnl: number }> = {};
    trades.forEach((t) => {
      if (!map[t.emotion]) map[t.emotion] = { count: 0, pnl: 0 };
      map[t.emotion].count++;
      map[t.emotion].pnl += t.pnl;
    });
    return Object.entries(map).map(([emotion, d]) => ({
      emotion,
      count: d.count,
      avgPnl: parseFloat((d.pnl / d.count).toFixed(2)),
    }));
  }, [trades]);

  const directionData = useMemo(() => {
    const buy = trades.filter((t) => t.direction === 'Buy');
    const sell = trades.filter((t) => t.direction === 'Sell');
    return [
      { name: 'Buy', value: buy.length },
      { name: 'Sell', value: sell.length },
    ].filter((d) => d.value > 0);
  }, [trades]);

  const mistakeData = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => {
      if (t.mistakeType) {
        map[t.mistakeType] = (map[t.mistakeType] || 0) + 1;
      }
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [trades]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card-strong rounded-xl px-3 py-2 text-sm">
          <p className="text-muted-foreground text-xs mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ color: p.color }} className="font-semibold">
              {p.name}: {typeof p.value === 'number' && p.name?.includes('P&L') ? formatCurrency(p.value) : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (trades.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Analytics</h1>
        <div className="glass-card rounded-2xl p-16 text-center">
          <p className="text-muted-foreground">Log some trades to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Performance insights from your trades</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly P&L */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Monthly P&amp;L</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'oklch(0.6 0.03 240)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'oklch(0.6 0.03 240)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.pnl >= 0 ? 'oklch(0.65 0.2 145)' : 'oklch(0.58 0.22 25)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Direction Split */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Buy vs Sell</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={directionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {directionData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? 'oklch(0.65 0.2 145)' : 'oklch(0.58 0.22 25)'}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Emotion vs Avg P&L */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Emotion vs Avg P&amp;L</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={emotionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="emotion" tick={{ fill: 'oklch(0.6 0.03 240)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'oklch(0.6 0.03 240)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgPnl" name="Avg P&L" radius={[4, 4, 0, 0]}>
                {emotionData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.avgPnl >= 0 ? 'oklch(0.65 0.2 145)' : 'oklch(0.58 0.22 25)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mistake Frequency */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Mistake Frequency</h2>
          {mistakeData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No mistakes recorded 🎉
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mistakeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fill: 'oklch(0.6 0.03 240)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'oklch(0.6 0.03 240)', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" fill="oklch(0.58 0.22 25)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

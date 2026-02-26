import React, { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { TrendingUp, TrendingDown, Activity, Target, Award, BarChart3, Plus } from 'lucide-react';
import { useGetTrades } from '../hooks/useQueries';
import { Trade } from '../backend';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

function formatCurrency(val: number) {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });
}

function StatCard({
  label,
  value,
  icon: Icon,
  positive,
  neutral,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  positive?: boolean;
  neutral?: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
          neutral
            ? 'bg-primary/15'
            : positive
            ? 'bg-profit/15'
            : 'bg-loss/15'
        }`}
      >
        <Icon
          size={22}
          className={neutral ? 'text-primary' : positive ? 'text-profit' : 'text-loss'}
        />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p
          className={`text-xl font-display font-bold mt-0.5 ${
            neutral ? 'text-foreground' : positive ? 'text-profit' : 'text-loss'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function PnLChart({ trades }: { trades: Trade[] }) {
  const data = useMemo(() => {
    const days: { label: string; pnl: number; date: Date }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
        pnl: 0,
        date: d,
      });
    }

    trades.forEach((t) => {
      const tradeDate = new Date(Number(t.date) / 1_000_000);
      tradeDate.setHours(0, 0, 0, 0);
      const idx = days.findIndex((d) => d.date.getTime() === tradeDate.getTime());
      if (idx !== -1) {
        days[idx].pnl += t.pnl;
      }
    });

    return days.map((d) => ({ label: d.label, pnl: parseFloat(d.pnl.toFixed(2)) }));
  }, [trades]);

  const maxAbs = Math.max(...data.map((d) => Math.abs(d.pnl)), 1);
  const totalPnl = data.reduce((s, d) => s + d.pnl, 0);
  const isPositive = totalPnl >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const val = payload[0].value as number;
      return (
        <div className="glass-card-strong rounded-xl px-3 py-2 text-sm">
          <p className="text-muted-foreground text-xs mb-1">{label}</p>
          <p className={val >= 0 ? 'text-profit font-semibold' : 'text-loss font-semibold'}>
            {formatCurrency(val)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-semibold text-foreground text-base">
            7-Day P&amp;L Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Daily net profit &amp; loss</p>
        </div>
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
            isPositive ? 'bg-profit/15 text-profit' : 'bg-loss/15 text-loss'
          }`}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {formatCurrency(totalPnl)}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlGradientPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.65 0.2 145)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.65 0.2 145)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="pnlGradientNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.58 0.22 25)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="oklch(0.58 0.22 25)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="label"
            tick={{ fill: 'oklch(0.6 0.03 240)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'oklch(0.6 0.03 240)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${v}`}
            domain={[-maxAbs * 1.2, maxAbs * 1.2]}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="pnl"
            stroke={isPositive ? 'oklch(0.65 0.2 145)' : 'oklch(0.58 0.22 25)'}
            strokeWidth={2}
            fill={isPositive ? 'url(#pnlGradientPos)' : 'url(#pnlGradientNeg)'}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              const color =
                payload.pnl >= 0 ? 'oklch(0.65 0.2 145)' : 'oklch(0.58 0.22 25)';
              return (
                <circle
                  key={`dot-${cx}-${cy}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill={color}
                  stroke="oklch(0.13 0.02 240)"
                  strokeWidth={1.5}
                />
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function DashboardPage() {
  const { data: trades = [], isLoading } = useGetTrades();

  const stats = useMemo(() => {
    if (!trades.length) {
      return { total: 0, winRate: 0, netPnl: 0, avgRR: 0, profitFactor: 0 };
    }
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl < 0);
    const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
    const avgRR =
      trades.reduce((s, t) => s + t.riskRewardRatio, 0) / trades.length;
    const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0;
    return {
      total: trades.length,
      winRate: (wins.length / trades.length) * 100,
      netPnl,
      avgRR,
      profitFactor,
    };
  }, [trades]);

  const recentTrades = useMemo(() => [...trades].reverse().slice(0, 5), [trades]);

  const monthlyStats = useMemo(() => {
    const map: Record<string, { total: number; netPnl: number; wins: number }> = {};
    trades.forEach((t) => {
      const d = new Date(Number(t.date) / 1_000_000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { total: 0, netPnl: 0, wins: 0 };
      map[key].total++;
      map[key].netPnl += t.pnl;
      if (t.pnl > 0) map[key].wins++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 3)
      .map(([month, data]) => ({ month, ...data }));
  }, [trades]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <Link
          to="/new-trade"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-neon-orange"
        >
          <Plus size={16} />
          New Trade
        </Link>
      </div>

      {/* 7-Day P&L Chart */}
      <PnLChart trades={trades} />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Trades"
          value={String(stats.total)}
          icon={Activity}
          neutral
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate.toFixed(1)}%`}
          icon={Target}
          positive={stats.winRate >= 50}
        />
        <StatCard
          label="Net P&L"
          value={formatCurrency(stats.netPnl)}
          icon={stats.netPnl >= 0 ? TrendingUp : TrendingDown}
          positive={stats.netPnl >= 0}
        />
        <StatCard
          label="Avg R:R"
          value={stats.avgRR.toFixed(2)}
          icon={BarChart3}
          positive={stats.avgRR >= 1}
        />
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor === 999 ? '∞' : stats.profitFactor.toFixed(2)}
          icon={Award}
          positive={stats.profitFactor >= 1}
        />
      </div>

      {/* Recent Trades + Monthly Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Trades */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-foreground">Recent Trades</h2>
            <Link
              to="/trade-log"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              View all →
            </Link>
          </div>
          {recentTrades.length === 0 ? (
            <div className="text-center py-10">
              <Activity size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground text-sm">No trades yet</p>
              <Link
                to="/new-trade"
                className="inline-block mt-3 text-xs text-primary hover:underline"
              >
                Log your first trade →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTrades.map((t) => (
                <div
                  key={String(t.id)}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                        t.direction === 'Buy' ? 'badge-buy' : 'badge-sell'
                      }`}
                    >
                      {t.direction}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.stockName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.date)}</p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      t.pnl >= 0 ? 'text-profit' : 'text-loss'
                    }`}
                  >
                    {t.pnl >= 0 ? '+' : ''}
                    {formatCurrency(t.pnl)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Stats */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Monthly Stats</h2>
          {monthlyStats.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {monthlyStats.map((m) => (
                <div key={m.month} className="p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{m.month}</span>
                    <span
                      className={`text-xs font-semibold ${
                        m.netPnl >= 0 ? 'text-profit' : 'text-loss'
                      }`}
                    >
                      {m.netPnl >= 0 ? '+' : ''}
                      {formatCurrency(m.netPnl)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{m.total} trades</span>
                    <span>
                      {m.total > 0 ? ((m.wins / m.total) * 100).toFixed(0) : 0}% win
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-muted-foreground py-4 border-t border-white/5">
        © {new Date().getFullYear()} Operator Journal · Built with{' '}
        <span className="text-loss">♥</span> using{' '}
        <a
          href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

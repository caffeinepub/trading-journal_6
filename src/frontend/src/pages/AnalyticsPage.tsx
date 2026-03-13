import { ArrowUpDown, TrendingUp, Trophy } from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Trade } from "../backend";
import { useGetTrades } from "../hooks/useQueries";

function formatCurrency(val: number) {
  return `₹${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const _COLORS = [
  "oklch(0.72 0.18 55)",
  "oklch(0.65 0.2 145)",
  "oklch(0.58 0.22 25)",
  "oklch(0.65 0.18 200)",
  "oklch(0.6 0.15 280)",
];

type SortKey =
  | "strategy"
  | "totalTrades"
  | "winRate"
  | "totalPnl"
  | "avgRR"
  | "avgRisk";
type SortDir = "asc" | "desc";

interface StrategyStats {
  strategy: string;
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  avgRR: number;
  avgRisk: number;
}

function computeStrategyStats(trades: Trade[]): StrategyStats[] {
  const map: Record<string, Trade[]> = {};
  for (const t of trades) {
    const key = t.strategy?.trim() || "Untagged";
    if (!map[key]) map[key] = [];
    map[key].push(t);
  }

  return Object.entries(map).map(([strategy, ts]) => {
    const wins = ts.filter((t) => t.pnl > 0).length;
    const winRate = ts.length > 0 ? (wins / ts.length) * 100 : 0;
    const totalPnl = ts.reduce((sum, t) => sum + t.pnl, 0);
    const avgRR = ts.reduce((sum, t) => sum + t.riskRewardRatio, 0) / ts.length;
    const avgRisk =
      ts.reduce((sum, t) => sum + Math.abs(t.entryPrice - t.stopLoss), 0) /
      ts.length;
    return {
      strategy,
      totalTrades: ts.length,
      winRate: Number.parseFloat(winRate.toFixed(1)),
      totalPnl: Number.parseFloat(totalPnl.toFixed(2)),
      avgRR: Number.parseFloat(avgRR.toFixed(2)),
      avgRisk: Number.parseFloat(avgRisk.toFixed(2)),
    };
  });
}

function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
      onClick={() => onSort(sortKey)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSort(sortKey);
      }}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          size={11}
          className={active ? "text-primary" : "text-muted-foreground/40"}
        />
        {active && (
          <span className="text-primary text-[10px]">
            {currentDir === "asc" ? "↑" : "↓"}
          </span>
        )}
      </span>
    </th>
  );
}

export default function AnalyticsPage() {
  const { data: trades = [], isLoading } = useGetTrades();

  const [sortKey, setSortKey] = useState<SortKey>("totalPnl");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const monthlyData = useMemo(() => {
    const map: Record<
      string,
      { month: string; pnl: number; trades: number; wins: number }
    > = {};
    for (const t of trades) {
      const d = new Date(Number(t.date) / 1_000_000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
      });
      if (!map[key]) map[key] = { month: label, pnl: 0, trades: 0, wins: 0 };
      map[key].pnl += t.pnl;
      map[key].trades++;
      if (t.pnl > 0) map[key].wins++;
    }
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, pnl: Number.parseFloat(v.pnl.toFixed(2)) }));
  }, [trades]);

  const emotionData = useMemo(() => {
    const map: Record<string, { count: number; pnl: number }> = {};
    for (const t of trades) {
      if (!map[t.emotion]) map[t.emotion] = { count: 0, pnl: 0 };
      map[t.emotion].count++;
      map[t.emotion].pnl += t.pnl;
    }
    return Object.entries(map).map(([emotion, d]) => ({
      emotion,
      count: d.count,
      avgPnl: Number.parseFloat((d.pnl / d.count).toFixed(2)),
    }));
  }, [trades]);

  const directionData = useMemo(() => {
    const buy = trades.filter((t) => t.direction === "Buy");
    const sell = trades.filter((t) => t.direction === "Sell");
    return [
      { name: "Buy", value: buy.length },
      { name: "Sell", value: sell.length },
    ].filter((d) => d.value > 0);
  }, [trades]);

  const mistakeData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of trades) {
      if (t.mistakeType) {
        map[t.mistakeType] = (map[t.mistakeType] || 0) + 1;
      }
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [trades]);

  const strategyStats = useMemo(() => computeStrategyStats(trades), [trades]);

  const bestStrategy = useMemo(() => {
    if (strategyStats.length === 0) return null;
    return strategyStats.reduce((best, s) =>
      s.totalPnl > best.totalPnl ? s : best,
    );
  }, [strategyStats]);

  const sortedStrategyStats = useMemo(() => {
    return [...strategyStats].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      const an = av as number;
      const bn = bv as number;
      return sortDir === "asc" ? an - bn : bn - an;
    });
  }, [strategyStats, sortKey, sortDir]);

  const strategyChartData = useMemo(() => {
    return [...strategyStats]
      .sort((a, b) => b.totalPnl - a.totalPnl)
      .slice(0, 10)
      .map((s) => ({
        name: s.strategy,
        pnl: s.totalPnl,
        isBest: s.strategy === bestStrategy?.strategy,
      }));
  }, [strategyStats, bestStrategy]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card-strong rounded-xl px-3 py-2 text-sm">
          <p className="text-muted-foreground text-xs mb-1">{label}</p>
          {payload.map((p: any) => (
            <p
              key={p.name}
              style={{ color: p.color }}
              className="font-semibold"
            >
              {p.name}:{" "}
              {typeof p.value === "number" && p.name?.includes("P&L")
                ? formatCurrency(p.value)
                : p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const StrategyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card-strong rounded-xl px-3 py-2 text-sm">
          <p className="text-foreground text-xs font-medium mb-1">{label}</p>
          <p
            className={`font-semibold ${payload[0].value >= 0 ? "text-profit" : "text-loss"}`}
          >
            P&L: {formatCurrency(payload[0].value)}
          </p>
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
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Analytics
        </h1>
        <div className="glass-card rounded-2xl p-16 text-center">
          <p className="text-muted-foreground">
            Log some trades to see analytics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Performance insights from your trades
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly P&L */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Monthly P&amp;L
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="month"
                tick={{ fill: "oklch(0.6 0.03 240)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.6 0.03 240)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                {monthlyData.map((entry) => (
                  <Cell
                    key={entry.month}
                    fill={
                      entry.pnl >= 0
                        ? "oklch(0.65 0.2 145)"
                        : "oklch(0.58 0.22 25)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Direction Split */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Buy vs Sell
          </h2>
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
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {directionData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.name === "Buy"
                        ? "oklch(0.65 0.2 145)"
                        : "oklch(0.58 0.22 25)"
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Emotion vs Avg P&L */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Emotion vs Avg P&amp;L
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={emotionData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="emotion"
                tick={{ fill: "oklch(0.6 0.03 240)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "oklch(0.6 0.03 240)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avgPnl" name="Avg P&L" radius={[4, 4, 0, 0]}>
                {emotionData.map((entry) => (
                  <Cell
                    key={entry.emotion}
                    fill={
                      entry.avgPnl >= 0
                        ? "oklch(0.65 0.2 145)"
                        : "oklch(0.58 0.22 25)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mistake Frequency */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">
            Mistake Frequency
          </h2>
          {mistakeData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              No mistakes recorded 🎉
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={mistakeData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  type="number"
                  tick={{ fill: "oklch(0.6 0.03 240)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "oklch(0.6 0.03 240)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  name="Count"
                  fill="oklch(0.58 0.22 25)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Strategy Performance ── */}
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-primary" />
          <h2 className="font-display text-xl font-bold text-foreground">
            Strategy Performance
          </h2>
        </div>

        {/* Best strategy callout */}
        {bestStrategy && (
          <div className="glass-card rounded-2xl p-4 border border-[#F59E0B]/30 bg-[#F59E0B]/5 flex items-center gap-3">
            <Trophy size={20} className="text-[#F59E0B] shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">
                Best Performing Strategy
              </p>
              <p className="font-display font-bold text-foreground">
                {bestStrategy.strategy}
                <span className="ml-2 text-sm font-normal text-profit">
                  {bestStrategy.totalPnl >= 0 ? "+" : ""}
                  {formatCurrency(bestStrategy.totalPnl)}
                </span>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Sortable Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <SortableHeader
                      label="Strategy"
                      sortKey="strategy"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Trades"
                      sortKey="totalTrades"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Win %"
                      sortKey="winRate"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Total P&L"
                      sortKey="totalPnl"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Avg R:R"
                      sortKey="avgRR"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Avg Risk"
                      sortKey="avgRisk"
                      currentKey={sortKey}
                      currentDir={sortDir}
                      onSort={handleSort}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedStrategyStats.map((s) => {
                    const isBest = s.strategy === bestStrategy?.strategy;
                    return (
                      <tr
                        key={s.strategy}
                        className={`border-b border-white/5 transition-colors ${
                          isBest
                            ? "bg-[#F59E0B]/8 hover:bg-[#F59E0B]/12"
                            : "hover:bg-white/3"
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {isBest && (
                              <Trophy
                                size={12}
                                className="text-[#F59E0B] shrink-0"
                              />
                            )}
                            <span
                              className={`font-medium truncate max-w-[120px] ${isBest ? "text-[#F59E0B]" : "text-foreground"}`}
                            >
                              {s.strategy}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {s.totalTrades}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={
                              s.winRate >= 50 ? "text-profit" : "text-loss"
                            }
                          >
                            {s.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td
                          className={`px-3 py-2.5 font-semibold ${s.totalPnl >= 0 ? "text-profit" : "text-loss"}`}
                        >
                          {s.totalPnl >= 0 ? "+" : ""}
                          {formatCurrency(s.totalPnl)}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          {s.avgRR !== 0 ? `1:${s.avgRR.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          ₹{s.avgRisk.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-display font-semibold text-foreground mb-4 text-sm">
              Total P&amp;L by Strategy
            </h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={strategyChartData}
                margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "oklch(0.6 0.03 240)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fill: "oklch(0.6 0.03 240)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip content={<StrategyTooltip />} />
                <Bar dataKey="pnl" name="P&L" radius={[4, 4, 0, 0]}>
                  {strategyChartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.isBest
                          ? "oklch(0.72 0.18 55)"
                          : entry.pnl >= 0
                            ? "oklch(0.65 0.2 145)"
                            : "oklch(0.58 0.22 25)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

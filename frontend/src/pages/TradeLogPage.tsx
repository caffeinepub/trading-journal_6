import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, Trash2, Edit2, ChevronDown, X } from 'lucide-react';
import { useGetTrades, useDeleteTrade } from '../hooks/useQueries';
import { Trade } from '../backend';
import { toast } from 'sonner';

function formatCurrency(val: number) {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(ts: bigint) {
  return new Date(Number(ts) / 1_000_000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function ConvictionStars({ level }: { level: bigint }) {
  const n = Number(level);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= n ? 'star-filled fill-current' : 'star-empty'}
          fill={s <= n ? 'currentColor' : 'none'}
        />
      ))}
    </div>
  );
}

const ALL_MISTAKES = [
  'FOMO',
  'Early Entry',
  'Late Entry',
  'Overtrading',
  'Revenge Trade',
  'No Stop Loss',
  'Moved Stop Loss',
  'Sized Too Big',
  'Ignored Signal',
];

const ALL_SETUPS = [
  'Breakout',
  'Pullback',
  'Reversal',
  'Momentum',
  'Gap Fill',
  'Support/Resistance',
  'Trend Follow',
  'Scalp',
  'Swing',
  'Other',
];

export default function TradeLogPage() {
  const { data: trades = [], isLoading } = useGetTrades();
  const deleteTrade = useDeleteTrade();

  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [strategyFilter, setStrategyFilter] = useState('All');
  const [mistakeFilter, setMistakeFilter] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState<bigint | null>(null);

  // Unique strategies from trades
  const uniqueStrategies = useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => {
      if (t.notes) {
        // strategy is stored in notes or tradeType; we use tradeType as setup proxy
      }
      if (t.tradeType) set.add(t.tradeType);
    });
    return Array.from(set).sort();
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return [...trades]
      .reverse()
      .filter((t) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          t.stockName.toLowerCase().includes(q) ||
          t.tradeType.toLowerCase().includes(q) ||
          t.emotion.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q);
        const matchDir = directionFilter === 'All' || t.direction === directionFilter;
        const matchType = typeFilter === 'All' || t.tradeType === typeFilter;
        const matchStrategy = strategyFilter === 'All' || t.tradeType === strategyFilter;
        const matchMistake = mistakeFilter === 'All' || t.mistakeType === mistakeFilter;
        return matchSearch && matchDir && matchType && matchStrategy && matchMistake;
      });
  }, [trades, search, directionFilter, typeFilter, strategyFilter, mistakeFilter]);

  const handleDelete = async (id: bigint) => {
    try {
      await deleteTrade.mutateAsync(id);
      toast.success('Trade deleted');
      setDeleteConfirm(null);
    } catch {
      toast.error('Failed to delete trade');
    }
  };

  const selectClass =
    'bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all appearance-none cursor-pointer';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Trade Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {trades.length} total trades · {filteredTrades.length} shown
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search symbol, type, notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Direction */}
          <div className="relative">
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className={selectClass}
            >
              <option value="All" className="bg-card">All Directions</option>
              <option value="Buy" className="bg-card">Buy / Long</option>
              <option value="Sell" className="bg-card">Sell / Short</option>
            </select>
          </div>

          {/* Market Type */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className={selectClass}
            >
              <option value="All" className="bg-card">All Markets</option>
              {['Equity', 'Futures', 'Options', 'Forex', 'Crypto', 'Commodity'].map((t) => (
                <option key={t} value={t} className="bg-card">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Strategy Filter */}
          <div className="relative">
            <select
              value={strategyFilter}
              onChange={(e) => setStrategyFilter(e.target.value)}
              className={selectClass}
            >
              <option value="All" className="bg-card">All Strategies</option>
              {ALL_SETUPS.map((s) => (
                <option key={s} value={s} className="bg-card">
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Mistake Type Filter */}
          <div className="relative">
            <select
              value={mistakeFilter}
              onChange={(e) => setMistakeFilter(e.target.value)}
              className={selectClass}
            >
              <option value="All" className="bg-card">All Mistakes</option>
              {ALL_MISTAKES.map((m) => (
                <option key={m} value={m} className="bg-card">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(search || directionFilter !== 'All' || typeFilter !== 'All' || strategyFilter !== 'All' || mistakeFilter !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setDirectionFilter('All');
                setTypeFilter('All');
                setStrategyFilter('All');
                setMistakeFilter('All');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground border border-white/10 hover:border-white/20 transition-all"
            >
              <X size={13} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filteredTrades.length === 0 ? (
          <div className="text-center py-16">
            <Filter size={32} className="text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">
              {trades.length === 0 ? 'No trades logged yet' : 'No trades match your filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Date', 'Symbol', 'Direction', 'Type', 'Qty', 'Entry', 'Exit', 'P&L', 'R:R', 'Conviction', 'Mistake', 'Actions'].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade) => (
                  <tr
                    key={String(trade.id)}
                    className="border-b border-white/3 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(trade.date)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground whitespace-nowrap">
                      {trade.stockName}
                      {trade.isAPlusSetup && (
                        <span className="ml-1.5 text-xs text-primary">A+</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          trade.direction === 'Buy' ? 'badge-buy' : 'badge-sell'
                        }`}
                      >
                        {trade.direction === 'Buy' ? '▲' : '▼'} {trade.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {trade.tradeType}
                    </td>
                    <td className="px-4 py-3 text-foreground">{String(trade.quantity)}</td>
                    <td className="px-4 py-3 text-foreground">₹{trade.entryPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-foreground">₹{trade.exitPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          trade.pnl >= 0 ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {trade.pnl >= 0 ? '+' : ''}
                        {formatCurrency(trade.pnl)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {trade.riskRewardRatio.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <ConvictionStars level={trade.convictionLevel} />
                    </td>
                    <td className="px-4 py-3">
                      {trade.mistakeType ? (
                        <span className="px-2 py-0.5 rounded-md text-xs bg-loss/10 border border-loss/30 text-loss">
                          {trade.mistakeType}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {deleteConfirm === trade.id ? (
                          <>
                            <button
                              onClick={() => handleDelete(trade.id)}
                              disabled={deleteTrade.isPending}
                              className="text-xs px-2 py-1 rounded-lg bg-loss/20 text-loss border border-loss/30 hover:bg-loss/30 transition-colors disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="text-xs px-2 py-1 rounded-lg bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10 transition-colors"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(trade.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-loss hover:bg-loss/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

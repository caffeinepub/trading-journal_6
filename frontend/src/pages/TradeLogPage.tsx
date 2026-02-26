import React, { useState, useMemo } from 'react';
import { Search, Filter, Star, Trash2, ChevronDown, X, Pencil } from 'lucide-react';
import { useGetTrades, useDeleteTrade } from '../hooks/useQueries';
import { Trade, MarketType } from '../backend';
import { formatMarketType, getPnLColorClass } from '../lib/tradeUtils';
import { toast } from 'sonner';
import EditTradeModal from '../components/EditTradeModal';

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

const ALL_MARKET_TYPES: MarketType[] = [
  MarketType.stocks,
  MarketType.future,
  MarketType.option,
  MarketType.forex,
  MarketType.cryptocurrency,
];

export default function TradeLogPage() {
  const { data: trades = [], isLoading } = useGetTrades();
  const deleteTrade = useDeleteTrade();

  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [strategyFilter, setStrategyFilter] = useState('');
  const [mistakeFilter, setMistakeFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<bigint | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const tradeMarketTypes = useMemo(() => {
    const set = new Set<string>();
    trades.forEach((t) => { if (t.marketType) set.add(String(t.marketType)); });
    return Array.from(set);
  }, [trades]);

  const filtered = useMemo(() => {
    return trades.filter((t) => {
      const strategyStr = typeof t.strategy === 'string' ? t.strategy : '';
      const matchSearch =
        !search ||
        t.stockName.toLowerCase().includes(search.toLowerCase()) ||
        strategyStr.toLowerCase().includes(search.toLowerCase());
      const matchDirection = directionFilter === 'All' || t.direction === directionFilter;
      const matchType = typeFilter === 'All' || String(t.marketType) === typeFilter;
      const matchStrategy =
        !strategyFilter.trim() ||
        strategyStr.toLowerCase().includes(strategyFilter.toLowerCase().trim());
      const matchMistake = mistakeFilter === 'All' || t.mistakeType === mistakeFilter;
      return matchSearch && matchDirection && matchType && matchStrategy && matchMistake;
    });
  }, [trades, search, directionFilter, typeFilter, strategyFilter, mistakeFilter]);

  const handleDelete = async (id: bigint) => {
    if (!confirm('Delete this trade?')) return;
    try {
      await deleteTrade.mutateAsync(id);
      toast.success('Trade deleted');
    } catch {
      toast.error('Failed to delete trade');
    }
  };

  const selectClass =
    'bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50 transition-all';

  const hasActiveFilters =
    search ||
    directionFilter !== 'All' ||
    typeFilter !== 'All' ||
    strategyFilter.trim() !== '' ||
    mistakeFilter !== 'All';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Trade Log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {filtered.length} of {trades.length} trades
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search trades…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-muted-foreground" />

          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className={selectClass}
          >
            <option value="All" className="bg-card">All Directions</option>
            <option value="Buy" className="bg-card">Buy / Long</option>
            <option value="Sell" className="bg-card">Sell / Short</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={selectClass}
          >
            <option value="All" className="bg-card">All Types</option>
            {tradeMarketTypes.map((mt) => (
              <option key={mt} value={mt} className="bg-card">
                {formatMarketType(mt)}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Filter by strategy…"
            value={strategyFilter}
            onChange={(e) => setStrategyFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
          />

          <select
            value={mistakeFilter}
            onChange={(e) => setMistakeFilter(e.target.value)}
            className={selectClass}
          >
            <option value="All" className="bg-card">All Mistakes</option>
            {ALL_MISTAKES.map((m) => (
              <option key={m} value={m} className="bg-card">{m}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch('');
                setDirectionFilter('All');
                setTypeFilter('All');
                setStrategyFilter('');
                setMistakeFilter('All');
              }}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-muted-foreground hover:text-foreground transition-all"
            >
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Trade List */}
      {isLoading ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
          Loading trades…
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground">
          {trades.length === 0
            ? 'No trades logged yet. Start by logging your first trade!'
            : 'No trades match your filters.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((trade) => {
            const isExpanded = expandedId === trade.id;
            const pnlColorClass = getPnLColorClass(trade.pnl);
            const strategyStr = typeof trade.strategy === 'string' ? trade.strategy : '';

            return (
              <div
                key={String(trade.id)}
                className="glass-card rounded-2xl overflow-hidden transition-all duration-200 hover:border-white/15"
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : trade.id)}
                >
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      trade.direction === 'Buy' ? 'badge-buy' : 'badge-sell'
                    }`}
                  >
                    {trade.direction === 'Buy' ? '▲ BUY' : '▼ SELL'}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{trade.stockName}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(trade.date)}</p>
                  </div>

                  {strategyStr && (
                    <div className="hidden sm:flex items-center gap-1 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/25 text-[#F59E0B] text-xs font-medium max-w-[120px] truncate">
                        {strategyStr}
                      </span>
                    </div>
                  )}

                  <div className="hidden md:block shrink-0">
                    <ConvictionStars level={trade.convictionLevel} />
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${pnlColorClass}`}>
                      {trade.pnl > 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatMarketType(String(trade.marketType))}</p>
                  </div>

                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-white/5 p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Entry</p>
                        <p className="text-sm font-semibold text-foreground">₹{trade.entryPrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Exit</p>
                        <p className="text-sm font-semibold text-foreground">₹{trade.exitPrice.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
                        <p className="text-sm font-semibold text-foreground">₹{trade.stopLoss.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Target</p>
                        <p className="text-sm font-semibold text-foreground">₹{trade.target.toFixed(2)}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Quantity</p>
                        <p className="text-sm font-semibold text-foreground">{String(trade.quantity)}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">R:R Ratio</p>
                        <p className="text-sm font-semibold text-foreground">
                          {trade.riskRewardRatio !== 0 ? `1:${trade.riskRewardRatio.toFixed(2)}` : '—'}
                        </p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Market</p>
                        <p className="text-sm font-semibold text-foreground">{formatMarketType(String(trade.marketType))}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">P&L</p>
                        <p className={`text-sm font-bold ${pnlColorClass}`}>
                          {trade.pnl > 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Emotion</p>
                        <p className="text-sm font-semibold text-foreground">{trade.emotion}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Followed Plan</p>
                        <p className="text-sm font-semibold text-foreground">{trade.followedPlan ? '✓ Yes' : '✗ No'}</p>
                      </div>
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">A+ Setup</p>
                        <p className="text-sm font-semibold text-foreground">{trade.isAPlusSetup ? '⭐ Yes' : 'No'}</p>
                      </div>
                      {trade.mistakeType && (
                        <div className="bg-white/3 rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">Mistake</p>
                          <p className="text-sm font-semibold text-loss">{trade.mistakeType}</p>
                        </div>
                      )}
                      {strategyStr && (
                        <div className="bg-white/3 rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">Strategy</p>
                          <p className="text-sm font-semibold text-foreground">{strategyStr}</p>
                        </div>
                      )}
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Conviction</p>
                        <ConvictionStars level={trade.convictionLevel} />
                      </div>
                    </div>

                    {trade.notes && (
                      <div className="bg-white/3 rounded-xl p-3">
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm text-foreground leading-relaxed">{trade.notes}</p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTrade(trade);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-primary/70 hover:text-primary hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-200"
                      >
                        <Pencil size={13} />
                        Edit Trade
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(trade.id);
                        }}
                        disabled={deleteTrade.isPending}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-loss/70 hover:text-loss hover:bg-loss/10 border border-loss/20 hover:border-loss/40 transition-all duration-200 disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Delete Trade
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Trade Modal */}
      {editingTrade && (
        <EditTradeModal
          trade={editingTrade}
          onClose={() => setEditingTrade(null)}
        />
      )}
    </div>
  );
}

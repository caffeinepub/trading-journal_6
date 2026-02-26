import type { Trade } from '../backend';

export function calcRiskPerTrade(entryPrice: number, stopLoss: number, quantity: number): number {
  return Math.abs(entryPrice - stopLoss) * quantity;
}

export function calcRiskRewardRatio(entryPrice: number, stopLoss: number, target: number): number {
  const risk = Math.abs(entryPrice - stopLoss);
  if (risk === 0) return 0;
  return Math.abs(target - entryPrice) / risk;
}

export function calcPnl(direction: string, entryPrice: number, exitPrice: number, quantity: number): number {
  if (direction === 'Buy') {
    return (exitPrice - entryPrice) * quantity;
  } else {
    return (entryPrice - exitPrice) * quantity;
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

export function timestampToDateString(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toISOString().split('T')[0];
}

export function dateStringToTimestamp(dateStr: string): bigint {
  const ms = new Date(dateStr).getTime();
  return BigInt(ms * 1_000_000);
}

export function getTradeStats(trades: Trade[]) {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      avgRR: 0,
      totalPnl: 0,
      bestTrade: null as Trade | null,
      worstTrade: null as Trade | null,
      consecutiveWins: 0,
      consecutiveLosses: 0
    };
  }

  const wins = trades.filter(t => t.pnl > 0);
  const winRate = (wins.length / trades.length) * 100;
  const avgRR = trades.reduce((sum, t) => sum + t.riskRewardRatio, 0) / trades.length;
  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);

  const sortedByPnl = [...trades].sort((a, b) => b.pnl - a.pnl);
  const bestTrade = sortedByPnl[0] || null;
  const worstTrade = sortedByPnl[sortedByPnl.length - 1] || null;

  // Calculate consecutive wins/losses from most recent trades
  const sorted = [...trades].sort((a, b) => Number(b.date) - Number(a.date));
  let consecutiveWins = 0;
  let consecutiveLosses = 0;

  for (const t of sorted) {
    if (t.pnl > 0) {
      consecutiveWins++;
    } else {
      break;
    }
  }

  for (const t of sorted) {
    if (t.pnl <= 0) {
      consecutiveLosses++;
    } else {
      break;
    }
  }

  return {
    totalTrades: trades.length,
    winRate,
    avgRR,
    totalPnl,
    bestTrade,
    worstTrade,
    consecutiveWins,
    consecutiveLosses
  };
}

export function getMonthlyStats(trades: Trade[]) {
  const monthMap = new Map<string, { trades: Trade[]; month: string }>();

  for (const trade of trades) {
    const ms = Number(trade.date) / 1_000_000;
    const d = new Date(ms);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!monthMap.has(key)) {
      monthMap.set(key, { trades: [], month: label });
    }
    monthMap.get(key)!.trades.push(trade);
  }

  return Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([, { trades: monthTrades, month }]) => {
      const wins = monthTrades.filter(t => t.pnl > 0).length;
      const losses = monthTrades.filter(t => t.pnl <= 0).length;
      const netPnl = monthTrades.reduce((sum, t) => sum + t.pnl, 0);
      const winRate = monthTrades.length > 0 ? (wins / monthTrades.length) * 100 : 0;
      return { month, total: monthTrades.length, wins, losses, winRate, netPnl };
    });
}

export function exportToCsv(trades: Trade[]) {
  const headers = [
    'Date', 'Stock', 'Type', 'Direction', 'Entry Price', 'Exit Price',
    'Stop Loss', 'Target', 'Quantity', 'Risk/Trade', 'RR Ratio', 'P&L',
    'Entry Type', 'Timeframe', 'Session', 'A+ Setup',
    'Emotion', 'Followed Plan', 'Mistake Type', 'Notes'
  ];

  const rows = trades.map(t => {
    const dateStr = timestampToDateString(t.date);
    const risk = calcRiskPerTrade(t.entryPrice, t.stopLoss, Number(t.quantity));
    return [
      dateStr,
      t.stockName,
      t.tradeType,
      t.direction,
      t.entryPrice.toFixed(2),
      t.exitPrice.toFixed(2),
      t.stopLoss.toFixed(2),
      t.target.toFixed(2),
      t.quantity.toString(),
      risk.toFixed(2),
      t.riskRewardRatio.toFixed(2),
      t.pnl.toFixed(2),
      '', // entryType not in backend
      '', // timeframe not in backend
      '', // session not in backend
      t.isAPlusSetup ? 'Yes' : 'No',
      t.emotion,
      t.followedPlan ? 'Yes' : 'No',
      t.mistakeType,
      `"${t.notes.replace(/"/g, '""')}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `trading-journal-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

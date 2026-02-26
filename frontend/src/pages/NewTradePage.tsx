import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Star, Calculator, ChevronRight, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { useAddTrade } from '../hooks/useQueries';
import { MarketType } from '../backend';
import { calcPnl, getPnLColorClass } from '../lib/tradeUtils';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import StrategyAutocomplete from '../components/StrategyAutocomplete';

const MISTAKE_OPTIONS = [
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

const EMOTION_OPTIONS = ['Calm', 'Excited', 'Fearful', 'Greedy', 'Confident', 'Anxious', 'Neutral'];

const MARKET_TYPE_OPTIONS: { label: string; value: MarketType }[] = [
  { label: 'Stocks', value: MarketType.stocks },
  { label: 'Futures', value: MarketType.future },
  { label: 'Options', value: MarketType.option },
  { label: 'Forex', value: MarketType.forex },
  { label: 'Crypto', value: MarketType.cryptocurrency },
];

function ConvictionMeter({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star
            size={24}
            className={
              star <= (hovered || value)
                ? 'star-filled fill-current'
                : 'star-empty'
            }
            fill={star <= (hovered || value) ? 'currentColor' : 'none'}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground">
        {value === 0
          ? 'Not rated'
          : value === 1
          ? 'Very Low'
          : value === 2
          ? 'Low'
          : value === 3
          ? 'Medium'
          : value === 4
          ? 'High'
          : 'Very High'}
      </span>
    </div>
  );
}

function RiskCalculator({
  entry,
  stopLoss,
  target,
  quantity,
}: {
  entry: number;
  stopLoss: number;
  target: number;
  quantity: number;
}) {
  const riskPerShare = entry > 0 && stopLoss > 0 ? entry - stopLoss : 0;
  const riskAmount = entry > 0 && stopLoss > 0 && quantity > 0 ? riskPerShare * quantity : 0;
  const denominator = entry > 0 && stopLoss > 0 ? entry - stopLoss : 0;
  const rrRatio =
    denominator !== 0 && target > 0 && entry > 0
      ? (target - entry) / denominator
      : 0;

  const riskClass = riskAmount > 0 ? 'text-loss' : riskAmount < 0 ? 'text-profit' : 'text-muted-foreground';
  const rrClass = rrRatio >= 2 ? 'text-profit' : rrRatio >= 1 ? 'text-[#F59E0B]' : 'text-loss';

  return (
    <div className="glass-card rounded-xl p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Calculator size={16} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Live Risk Calculator</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
          <p className="text-xs text-muted-foreground mb-1">Risk/Share</p>
          <p className={`text-base font-bold ${riskClass}`}>
            {riskPerShare !== 0 ? `₹${Math.abs(riskPerShare).toFixed(2)}` : '—'}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
          <p className="text-xs text-muted-foreground mb-1">Total Risk</p>
          <p className={`text-base font-bold ${riskClass}`}>
            {riskAmount !== 0 ? `₹${Math.abs(riskAmount).toFixed(2)}` : '—'}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
          <p className="text-xs text-muted-foreground mb-1">R:R Ratio</p>
          <p className={`text-base font-bold ${rrClass}`}>
            {rrRatio !== 0 ? `1:${rrRatio.toFixed(2)}` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewTradePage() {
  const navigate = useNavigate();
  const addTrade = useAddTrade();
  const { identity } = useInternetIdentity();

  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [stockName, setStockName] = useState('');
  const [marketType, setMarketType] = useState<MarketType>(MarketType.stocks);
  const [direction, setDirection] = useState<'Buy' | 'Sell'>('Buy');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [target, setTarget] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isAPlusSetup, setIsAPlusSetup] = useState(false);
  const [emotion, setEmotion] = useState('Calm');
  const [convictionLevel, setConvictionLevel] = useState(3);
  const [strategy, setStrategy] = useState('');
  const [followedPlan, setFollowedPlan] = useState(true);
  const [mistakeType, setMistakeType] = useState('');
  const [notes, setNotes] = useState('');

  const entry = parseFloat(entryPrice) || 0;
  const exit = parseFloat(exitPrice) || 0;
  const sl = parseFloat(stopLoss) || 0;
  const tgt = parseFloat(target) || 0;
  const qty = parseInt(quantity) || 0;

  const livePnl = entry > 0 && exit > 0 && qty > 0 ? calcPnl(direction, entry, exit, qty) : null;
  const pnlColorClass = livePnl !== null ? getPnLColorClass(livePnl) : 'text-muted-foreground';

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identity) {
      toast.error('Please log in to add trades');
      return;
    }
    if (!stockName.trim()) {
      toast.error('Stock name is required');
      return;
    }
    if (!entryPrice || !exitPrice || !quantity) {
      toast.error('Entry, exit price and quantity are required');
      return;
    }
    if (convictionLevel < 1 || convictionLevel > 5) {
      toast.error('Conviction level must be between 1 and 5');
      return;
    }

    const dateMs = new Date(date).getTime();
    const dateNs = BigInt(dateMs) * BigInt(1_000_000);

    try {
      await addTrade.mutateAsync({
        date: dateNs,
        stockName: stockName.trim(),
        marketType,
        direction,
        entryPrice: entry,
        exitPrice: exit,
        stopLoss: sl,
        target: tgt,
        quantity: BigInt(qty),
        isAPlusSetup,
        emotion,
        convictionLevel: BigInt(convictionLevel),
        strategy: strategy.trim(),
        followedPlan,
        mistakeType,
        notes: notes.trim(),
      });
      toast.success('Trade logged successfully!');
      navigate({ to: '/trade-log' });
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to log trade');
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Log New Trade</h1>
        <p className="text-muted-foreground text-sm mt-1">Record your trade details and psychology</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wide opacity-60">
            Trade Details
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Market Type</label>
              <select
                value={marketType}
                onChange={(e) => setMarketType(e.target.value as MarketType)}
                className={inputClass}
              >
                {MARKET_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-card">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Stock / Symbol</label>
            <input
              type="text"
              value={stockName}
              onChange={(e) => setStockName(e.target.value)}
              placeholder="e.g. RELIANCE, NIFTY50, BTC"
              className={inputClass}
            />
          </div>

          {/* Direction toggle */}
          <div>
            <label className={labelClass}>Direction</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDirection('Buy')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  direction === 'Buy'
                    ? 'btn-buy'
                    : 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8'
                }`}
              >
                <TrendingUp size={16} /> Buy / Long
              </button>
              <button
                type="button"
                onClick={() => setDirection('Sell')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  direction === 'Sell'
                    ? 'btn-sell'
                    : 'bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/8'
                }`}
              >
                <TrendingDown size={16} /> Sell / Short
              </button>
            </div>
          </div>
        </div>

        {/* Price Details */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wide opacity-60">
            Price Details
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Entry Price</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Exit Price</label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stop Loss</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Target</label>
              <input
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Live P&amp;L</label>
              <div className={`${inputClass} flex items-center ${pnlColorClass} font-bold`}>
                {livePnl !== null
                  ? `${livePnl > 0 ? '+' : ''}₹${Math.abs(livePnl).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </div>
            </div>
          </div>

          {/* Risk Calculator */}
          {(entry > 0 || sl > 0 || tgt > 0) && (
            <RiskCalculator entry={entry} stopLoss={sl} target={tgt} quantity={qty} />
          )}
        </div>

        {/* Psychology */}
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wide opacity-60">
            Psychology &amp; Setup
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Emotion</label>
              <select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className={inputClass}
              >
                {EMOTION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-card">{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Mistake Type</label>
              <select
                value={mistakeType}
                onChange={(e) => setMistakeType(e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-card">None</option>
                {MISTAKE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-card">{opt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Strategy with autocomplete */}
          <div>
            <label className={labelClass}>Strategy</label>
            <StrategyAutocomplete
              value={strategy}
              onChange={setStrategy}
              placeholder="e.g. 90 EMA Pullback, Support & Resistance"
            />
          </div>

          <div>
            <label className={labelClass}>Conviction Level</label>
            <ConvictionMeter value={convictionLevel} onChange={setConvictionLevel} />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={followedPlan}
                onChange={(e) => setFollowedPlan(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-primary"
              />
              <span className="text-sm text-foreground">Followed Plan</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAPlusSetup}
                onChange={(e) => setIsAPlusSetup(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-primary"
              />
              <span className="text-sm text-foreground">A+ Setup ⭐</span>
            </label>
          </div>
        </div>

        {/* Notes */}
        <div className="glass-card rounded-2xl p-5">
          <label className={labelClass}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Trade rationale, observations, lessons learned…"
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={addTrade.isPending || !identity}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {addTrade.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Logging Trade…
            </>
          ) : !identity ? (
            'Please Log In'
          ) : (
            <>
              Log Trade
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Star, Calculator, ChevronRight, Loader2 } from 'lucide-react';
import { useAddTrade } from '../hooks/useQueries';
import { toast } from 'sonner';

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
const MARKET_TYPES = ['Equity', 'Futures', 'Options', 'Forex', 'Crypto', 'Commodity'];
const SETUP_TYPES = [
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
  const riskPerShare = entry > 0 && stopLoss > 0 ? Math.abs(entry - stopLoss) : 0;
  const riskAmount = riskPerShare * (quantity || 0);
  const rewardPerShare = entry > 0 && target > 0 ? Math.abs(target - entry) : 0;
  const rrRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;

  return (
    <div className="glass-card rounded-xl p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Calculator size={16} className="text-primary" />
        <span className="text-sm font-semibold text-foreground">Live Risk Calculator</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
          <p className="text-xs text-muted-foreground mb-1">Risk/Share</p>
          <p className={`text-base font-bold ${riskPerShare > 0 ? 'text-loss' : 'text-muted-foreground'}`}>
            ₹{riskPerShare.toFixed(2)}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
          <p className="text-xs text-muted-foreground mb-1">Risk Amount</p>
          <p className={`text-base font-bold ${riskAmount > 0 ? 'text-loss' : 'text-muted-foreground'}`}>
            ₹{riskAmount.toFixed(2)}
          </p>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/3 border border-white/5">
          <p className="text-xs text-muted-foreground mb-1">R:R Ratio</p>
          <p className={`text-base font-bold ${rrRatio >= 2 ? 'text-profit' : rrRatio >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            {rrRatio > 0 ? `1:${rrRatio.toFixed(2)}` : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewTradePage() {
  const navigate = useNavigate();
  const addTrade = useAddTrade();

  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    date: today,
    stockName: '',
    tradeType: 'Equity',
    direction: 'Buy',
    quantity: '',
    entryPrice: '',
    stopLoss: '',
    target: '',
    exitPrice: '',
    isAPlusSetup: false,
    setup: '',
    emotion: 'Calm',
    convictionLevel: 3,
    followedPlan: true,
    mistakeType: '',
    notes: '',
  });

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const entryNum = parseFloat(form.entryPrice) || 0;
  const slNum = parseFloat(form.stopLoss) || 0;
  const targetNum = parseFloat(form.target) || 0;
  const qtyNum = parseInt(form.quantity) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stockName.trim()) {
      toast.error('Please enter a stock/symbol name');
      return;
    }
    if (!form.entryPrice || !form.exitPrice) {
      toast.error('Entry and Exit prices are required');
      return;
    }

    const dateMs = new Date(form.date).getTime();
    const dateNs = BigInt(dateMs) * 1_000_000n;

    try {
      await addTrade.mutateAsync({
        date: dateNs,
        stockName: form.stockName.trim(),
        tradeType: form.tradeType,
        direction: form.direction,
        entryPrice: parseFloat(form.entryPrice),
        exitPrice: parseFloat(form.exitPrice),
        stopLoss: parseFloat(form.stopLoss) || 0,
        target: parseFloat(form.target) || 0,
        quantity: BigInt(parseInt(form.quantity) || 1),
        isAPlusSetup: form.isAPlusSetup,
        emotion: form.emotion,
        convictionLevel: BigInt(form.convictionLevel),
        followedPlan: form.followedPlan,
        mistakeType: form.mistakeType,
        notes: form.notes,
      });
      toast.success('Trade logged successfully!');
      navigate({ to: '/trade-log' });
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to log trade');
    }
  };

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider';
  const sectionClass = 'glass-card rounded-2xl p-5 space-y-4';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Log New Trade</h1>
        <p className="text-muted-foreground text-sm mt-1">Record your trade details and psychology</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Trade Details */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <ChevronRight size={16} className="text-primary" />
            Trade Details
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Market Type</label>
              <select
                value={form.tradeType}
                onChange={(e) => set('tradeType', e.target.value)}
                className={inputClass}
              >
                {MARKET_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-card">
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Symbol / Stock Name</label>
            <input
              type="text"
              placeholder="e.g. RELIANCE, NIFTY50"
              value={form.stockName}
              onChange={(e) => set('stockName', e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Direction - Neon Buy/Sell */}
          <div>
            <label className={labelClass}>Direction</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => set('direction', 'Buy')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 btn-buy ${
                  form.direction === 'Buy' ? 'selected' : ''
                }`}
              >
                ▲ BUY / LONG
              </button>
              <button
                type="button"
                onClick={() => set('direction', 'Sell')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 btn-sell ${
                  form.direction === 'Sell' ? 'selected' : ''
                }`}
              >
                ▼ SELL / SHORT
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Quantity</label>
              <input
                type="number"
                placeholder="100"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                className={inputClass}
                min="1"
              />
            </div>
            <div>
              <label className={labelClass}>Setup / Strategy</label>
              <select
                value={form.setup}
                onChange={(e) => set('setup', e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-card">Select setup…</option>
                {SETUP_TYPES.map((s) => (
                  <option key={s} value={s} className="bg-card">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Price Details */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <ChevronRight size={16} className="text-primary" />
            Price Details
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Entry Price</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.entryPrice}
                onChange={(e) => set('entryPrice', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Exit Price</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.exitPrice}
                onChange={(e) => set('exitPrice', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Stop Loss</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.stopLoss}
                onChange={(e) => set('stopLoss', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Target</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.target}
                onChange={(e) => set('target', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Live Risk Calculator */}
          <RiskCalculator
            entry={entryNum}
            stopLoss={slNum}
            target={targetNum}
            quantity={qtyNum}
          />
        </div>

        {/* Psychology */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <ChevronRight size={16} className="text-primary" />
            Psychology
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Emotion</label>
              <select
                value={form.emotion}
                onChange={(e) => set('emotion', e.target.value)}
                className={inputClass}
              >
                {EMOTION_OPTIONS.map((e) => (
                  <option key={e} value={e} className="bg-card">
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.followedPlan}
                  onChange={(e) => set('followedPlan', e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-foreground">Followed Plan</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAPlusSetup}
                  onChange={(e) => set('isAPlusSetup', e.target.checked)}
                  className="w-4 h-4 rounded accent-primary"
                />
                <span className="text-sm text-foreground">A+ Setup</span>
              </label>
            </div>
          </div>

          {/* Conviction Meter */}
          <div>
            <label className={labelClass}>Trade Conviction</label>
            <ConvictionMeter
              value={form.convictionLevel}
              onChange={(v) => set('convictionLevel', v)}
            />
          </div>

          {/* Mistakes */}
          <div>
            <label className={labelClass}>Mistake Type</label>
            <div className="flex flex-wrap gap-2">
              {MISTAKE_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => set('mistakeType', form.mistakeType === m ? '' : m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                    form.mistakeType === m
                      ? 'bg-loss/15 border-loss/50 text-loss'
                      : 'bg-white/3 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className={sectionClass}>
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <ChevronRight size={16} className="text-primary" />
            Notes
          </h2>
          <textarea
            placeholder="Trade rationale, observations, lessons learned…"
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={addTrade.isPending}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-neon-orange flex items-center justify-center gap-2"
        >
          {addTrade.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Logging Trade…
            </>
          ) : (
            'Log Trade'
          )}
        </button>
      </form>
    </div>
  );
}

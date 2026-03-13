import { Loader2, Save, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Trade } from "../backend";
import { useUpdateTrade } from "../hooks/useQueries";
import { calcPnl, getPnLColorClass } from "../lib/tradeUtils";
import StrategyAutocomplete from "./StrategyAutocomplete";

interface EditTradeModalProps {
  trade: Trade;
  onClose: () => void;
}

const EMOTION_OPTIONS = [
  "Calm",
  "Excited",
  "Fearful",
  "Greedy",
  "Confident",
  "Anxious",
  "Neutral",
];

export default function EditTradeModal({
  trade,
  onClose,
}: EditTradeModalProps) {
  const updateTrade = useUpdateTrade();

  const [entryPrice, setEntryPrice] = useState(String(trade.entryPrice));
  const [exitPrice, setExitPrice] = useState(String(trade.exitPrice));
  const [stopLoss, setStopLoss] = useState(String(trade.stopLoss));
  const [target, setTarget] = useState(String(trade.target));
  const [strategy, setStrategy] = useState(trade.strategy ?? "");
  const [emotion, setEmotion] = useState(trade.emotion ?? "");
  const [notes, setNotes] = useState(trade.notes ?? "");
  const [error, setError] = useState("");

  const parsedEntry = Number.parseFloat(entryPrice) || 0;
  const parsedExit = Number.parseFloat(exitPrice) || 0;
  const livePnl =
    parsedEntry > 0 && parsedExit > 0
      ? calcPnl(
          trade.direction,
          parsedEntry,
          parsedExit,
          Number(trade.quantity),
        )
      : null;
  const pnlColorClass =
    livePnl !== null ? getPnLColorClass(livePnl) : "text-muted-foreground";

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const parsedEntryVal = Number.parseFloat(entryPrice);
    const parsedExitVal = Number.parseFloat(exitPrice);
    const parsedSL = Number.parseFloat(stopLoss);
    const parsedTarget = Number.parseFloat(target);

    if (
      Number.isNaN(parsedEntryVal) ||
      Number.isNaN(parsedExitVal) ||
      Number.isNaN(parsedSL) ||
      Number.isNaN(parsedTarget)
    ) {
      setError(
        "Please enter valid numbers for Entry, Exit, Stop Loss, and Target.",
      );
      return;
    }

    const computedPnl = calcPnl(
      trade.direction,
      parsedEntryVal,
      parsedExitVal,
      Number(trade.quantity),
    );

    try {
      await updateTrade.mutateAsync({
        id: trade.id,
        update: {
          entryPrice: parsedEntryVal,
          stopLoss: parsedSL,
          target: parsedTarget,
          pnl: computedPnl,
          strategy,
          emotion,
          notes,
        },
      });
      toast.success("Trade updated successfully");
      onClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to update trade. Please try again.");
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all";
  const labelClass = "block text-xs font-medium text-muted-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card-strong rounded-2xl border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h2 className="font-display font-semibold text-foreground">
              Edit Trade
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {trade.stockName} · {trade.direction}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-5 space-y-4 max-h-[70vh] overflow-y-auto"
        >
          {/* Price fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-entry" className={labelClass}>
                Entry Price
              </label>
              <input
                id="edit-entry"
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className={inputClass}
                placeholder="0.00"
                data-ocid="edit_trade.entry_input"
              />
            </div>
            <div>
              <label htmlFor="edit-exit" className={labelClass}>
                Exit Price
              </label>
              <input
                id="edit-exit"
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className={inputClass}
                placeholder="0.00"
                data-ocid="edit_trade.exit_input"
              />
            </div>
            <div>
              <label htmlFor="edit-sl" className={labelClass}>
                Stop Loss
              </label>
              <input
                id="edit-sl"
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className={inputClass}
                placeholder="0.00"
                data-ocid="edit_trade.stoploss_input"
              />
            </div>
            <div>
              <label htmlFor="edit-target" className={labelClass}>
                Target
              </label>
              <input
                id="edit-target"
                type="number"
                step="any"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className={inputClass}
                placeholder="0.00"
                data-ocid="edit_trade.target_input"
              />
            </div>
          </div>

          {/* Live P&L Preview */}
          <div className="rounded-xl bg-white/3 border border-white/8 px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              P&amp;L Preview ({trade.direction})
            </span>
            <span className={`text-sm font-bold ${pnlColorClass}`}>
              {livePnl !== null
                ? `${livePnl >= 0 ? "+" : ""}₹${livePnl.toFixed(2)}`
                : "—"}
            </span>
          </div>

          {/* Strategy */}
          <div>
            <label htmlFor="edit-strategy" className={labelClass}>
              Strategy
            </label>
            <StrategyAutocomplete
              value={strategy}
              onChange={setStrategy}
              placeholder="e.g. 90 EMA Pullback"
            />
          </div>

          {/* Emotion */}
          <div>
            <label htmlFor="edit-emotion" className={labelClass}>
              Emotion
            </label>
            <select
              id="edit-emotion"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className={inputClass}
            >
              <option value="" className="bg-card">
                Select emotion…
              </option>
              {EMOTION_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-card">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="edit-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Trade notes, observations…"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-loss/10 border border-loss/30 px-3 py-2 text-sm text-loss">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateTrade.isPending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
            >
              {updateTrade.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save size={15} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

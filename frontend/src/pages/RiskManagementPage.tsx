import React, { useState, useEffect } from 'react';
import { ShieldAlert, TrendingUp, TrendingDown, Download, Upload, Loader2, AlertTriangle } from 'lucide-react';
import {
  useGetRiskStatus,
  useGetAccountSize,
  useGetDailyMaxLoss,
  useSetAccountSize,
  useSetDailyMaxLoss,
  useExportBackup,
  useImportBackup,
} from '../hooks/useQueries';
import { toast } from 'sonner';

function formatCurrency(val: number) {
  return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function RiskManagementPage() {
  const { data: riskStatus, isLoading: riskLoading } = useGetRiskStatus();
  const { data: accountSize } = useGetAccountSize();
  const { data: dailyMaxLoss } = useGetDailyMaxLoss();
  const setAccountSize = useSetAccountSize();
  const setDailyMaxLoss = useSetDailyMaxLoss();
  const exportBackup = useExportBackup();
  const importBackup = useImportBackup();

  const [accountInput, setAccountInput] = useState('');
  const [maxLossInput, setMaxLossInput] = useState('');

  useEffect(() => {
    if (accountSize !== undefined) setAccountInput(String(accountSize));
  }, [accountSize]);

  useEffect(() => {
    if (dailyMaxLoss !== undefined) setMaxLossInput(String(dailyMaxLoss));
  }, [dailyMaxLoss]);

  const handleSaveSettings = async () => {
    try {
      const promises: Promise<void>[] = [];
      if (accountInput) promises.push(setAccountSize.mutateAsync(parseFloat(accountInput)));
      if (maxLossInput) promises.push(setDailyMaxLoss.mutateAsync(parseFloat(maxLossInput)));
      await Promise.all(promises);
      toast.success('Risk settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleExport = async () => {
    try {
      const backup = await exportBackup.mutateAsync();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `operator-journal-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Backup exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const backup = JSON.parse(text);
      await importBackup.mutateAsync(backup);
      toast.success('Backup imported successfully');
    } catch {
      toast.error('Import failed — invalid backup file');
    }
    e.target.value = '';
  };

  const pnl = riskStatus?.totalPnl ?? 0;
  const maxLoss = riskStatus?.dailyMaxLoss ?? 20;
  const accSize = riskStatus?.accountSize ?? 1000;
  const maxLossAmount = (accSize * maxLoss) / 100;
  const pnlPercent = accSize > 0 ? (pnl / accSize) * 100 : 0;
  const isOverLimit = pnl < -maxLossAmount;

  const inputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all';
  const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wider';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Risk Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Monitor your risk exposure and account settings</p>
      </div>

      {/* Live P&L Status */}
      <div className={`glass-card rounded-2xl p-5 border ${isOverLimit ? 'border-loss/40' : 'border-white/8'}`}>
        <div className="flex items-center gap-2 mb-4">
          {isOverLimit ? (
            <AlertTriangle size={18} className="text-loss" />
          ) : (
            <ShieldAlert size={18} className="text-primary" />
          )}
          <h2 className="font-display font-semibold text-foreground">Today's Risk Status</h2>
        </div>

        {riskLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-white/3 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Total P&L</p>
              <p className={`text-lg font-bold font-display ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
              </p>
              <p className={`text-xs mt-0.5 ${pnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
              </p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/3 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Max Loss Limit</p>
              <p className="text-lg font-bold font-display text-foreground">{formatCurrency(maxLossAmount)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{maxLoss}% of account</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-white/3 border border-white/5">
              <p className="text-xs text-muted-foreground mb-1">Account Size</p>
              <p className="text-lg font-bold font-display text-foreground">{formatCurrency(accSize)}</p>
              <p className={`text-xs mt-0.5 ${isOverLimit ? 'text-loss font-semibold' : 'text-profit'}`}>
                {isOverLimit ? '⚠ Limit Breached' : '✓ Within Limit'}
              </p>
            </div>
          </div>
        )}

        {isOverLimit && (
          <div className="mt-4 p-3 rounded-xl bg-loss/10 border border-loss/30 text-sm text-loss">
            ⚠ Daily loss limit breached. Consider stopping trading for today.
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-foreground">Account Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Account Size (₹)</label>
            <input
              type="number"
              value={accountInput}
              onChange={(e) => setAccountInput(e.target.value)}
              placeholder="e.g. 100000"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Daily Max Loss (%)</label>
            <input
              type="number"
              value={maxLossInput}
              onChange={(e) => setMaxLossInput(e.target.value)}
              placeholder="e.g. 2"
              className={inputClass}
              min="0"
              max="100"
            />
          </div>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={setAccountSize.isPending || setDailyMaxLoss.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-neon-orange"
        >
          {(setAccountSize.isPending || setDailyMaxLoss.isPending) && (
            <Loader2 size={14} className="animate-spin" />
          )}
          Save Settings
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <h2 className="font-display font-semibold text-foreground">Backup &amp; Restore</h2>
        <p className="text-sm text-muted-foreground">
          Export your trade data as JSON or restore from a previous backup.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            disabled={exportBackup.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-foreground hover:bg-white/10 disabled:opacity-50 transition-all"
          >
            {exportBackup.isPending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            Export Backup
          </button>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-foreground hover:bg-white/10 cursor-pointer transition-all">
            <Upload size={15} />
            Import Backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}

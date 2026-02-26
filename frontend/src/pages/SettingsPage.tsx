import React from 'react';
import { Settings, Info, BookOpen, Trash2, Loader2 } from 'lucide-react';
import { useGetStrategies, useDeleteStrategy } from '../hooks/useQueries';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: strategiesRaw = [], isLoading: strategiesLoading } = useGetStrategies();
  const deleteStrategy = useDeleteStrategy();

  const strategies = strategiesRaw.map(([name]) => name).sort((a, b) => a.localeCompare(b));

  async function handleDeleteStrategy(name: string) {
    if (!confirm(`Delete strategy "${name}"?`)) return;
    try {
      await deleteStrategy.mutateAsync(name);
      toast.success(`Strategy "${name}" deleted`);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete strategy');
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Application preferences and information</p>
      </div>

      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Info size={18} className="text-primary" />
          <h2 className="font-display font-semibold text-foreground">About</h2>
        </div>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">Operator Journal</span> — A professional
            trading journal built on the Internet Computer.
          </p>
          <p>Version 2.0 · Dark Theme · Glassmorphism UI</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display font-semibold text-foreground mb-3">Theme</h2>
        <p className="text-sm text-muted-foreground">
          The application uses a fixed dark navy theme optimized for trading environments.
        </p>
      </div>

      {/* Strategy Manager */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-primary" />
          <h2 className="font-display font-semibold text-foreground">Strategy Manager</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Strategies are automatically saved when you log trades. Delete unused ones here.
        </p>

        {strategiesLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 size={14} className="animate-spin" />
            Loading strategies…
          </div>
        ) : strategies.length === 0 ? (
          <div className="rounded-xl bg-white/3 border border-white/8 px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">
              No saved strategies yet. Strategies are automatically saved when you log trades.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {strategies.map((name) => (
              <li
                key={name}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/3 border border-white/8 hover:border-white/15 transition-all"
              >
                <span className="text-sm text-foreground font-medium truncate">{name}</span>
                <button
                  onClick={() => handleDeleteStrategy(name)}
                  disabled={deleteStrategy.isPending}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-loss/60 hover:text-loss hover:bg-loss/10 border border-loss/15 hover:border-loss/35 transition-all disabled:opacity-50"
                >
                  {deleteStrategy.isPending ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Trash2 size={11} />
                  )}
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

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

import React from 'react';
import { Settings, Info } from 'lucide-react';

export default function SettingsPage() {
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

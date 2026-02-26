import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { TrendingUp, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginScreen() {
  const { login, loginStatus, isLoggingIn, isInitializing } = useInternetIdentity();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: unknown) {
      const err = error as Error;
      if (err?.message === 'User is already authenticated') {
        // Already authenticated, do nothing
      }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
        style={{ backgroundImage: "url('/assets/generated/trading-bg.dim_1920x1080.png')" }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80" />

      {/* Decorative grid lines */}
      <div className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(oklch(0.7 0.15 145) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.15 145) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-profit/15 border border-profit/30 mb-4">
              <img
                src="/assets/generated/logo-mark.dim_256x256.png"
                alt="Operator Trading Journal"
                className="w-10 h-10 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
              />
              <TrendingUp className="w-8 h-8 text-profit hidden" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Operator Trading Journal</h1>
            <p className="text-sm text-muted-foreground mt-1">Professional intraday trade tracking</p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-2 mb-8">
            {[
              'Track every trade with precision',
              'Analyze your performance & patterns',
              'Manage risk with discipline',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-profit flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          {/* Login button */}
          <Button
            onClick={handleLogin}
            disabled={isLoggingIn || isInitializing}
            className="w-full bg-profit text-background hover:bg-profit/90 font-semibold h-11 text-sm gap-2"
          >
            {isLoggingIn || isInitializing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isInitializing ? 'Initializing...' : 'Connecting...'}
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Login with Internet Identity
              </>
            )}
          </Button>

          {loginStatus === 'loginError' && (
            <p className="text-xs text-loss text-center mt-3">
              Login failed. Please try again.
            </p>
          )}

          <p className="text-xs text-muted-foreground text-center mt-4">
            Secure, decentralized authentication — no passwords needed
          </p>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          Built with <span className="text-loss">♥</span> using{' '}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'operator-trading-journal')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-profit hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}

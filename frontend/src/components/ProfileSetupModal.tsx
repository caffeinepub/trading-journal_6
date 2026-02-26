import { useState } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveCallerUserProfile } from '@/hooks/useSaveCallerUserProfile';

interface ProfileSetupModalProps {
  open: boolean;
}

export default function ProfileSetupModal({ open }: ProfileSetupModalProps) {
  const [name, setName] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    saveProfile.mutate({ name: trimmed });
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-sm bg-card border-border" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-profit/15 border border-profit/30">
              <TrendingUp className="w-5 h-5 text-profit" />
            </div>
            <DialogTitle className="text-foreground">Welcome, Trader!</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Set up your profile to get started. This name will appear in your journal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="trader-name" className="text-sm text-foreground">
              Your Name
            </Label>
            <Input
              id="trader-name"
              placeholder="e.g. Alex Trader"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-border text-foreground"
              autoFocus
              maxLength={50}
            />
          </div>

          {saveProfile.isError && (
            <p className="text-xs text-loss">
              Failed to save profile. Please try again.
            </p>
          )}

          <Button
            type="submit"
            disabled={!name.trim() || saveProfile.isPending}
            className="w-full bg-profit text-background hover:bg-profit/90 font-semibold gap-2"
          >
            {saveProfile.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Start Trading'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

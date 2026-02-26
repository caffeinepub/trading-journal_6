import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useGetStrategies } from '../hooks/useQueries';

interface StrategyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

/**
 * Checks if the query matches the strategy via abbreviation matching.
 * e.g. "SR" matches "Support & Resistance" (first letters of words)
 */
function abbreviationMatch(query: string, strategy: string): boolean {
  if (!query) return false;
  const words = strategy.split(/[\s&_\-/]+/).filter(Boolean);
  const firstLetters = words.map((w) => w[0]?.toLowerCase() ?? '').join('');
  return firstLetters.includes(query.toLowerCase());
}

export default function StrategyAutocomplete({
  value,
  onChange,
  placeholder = 'e.g. 90 EMA Pullback',
  className = '',
  id,
}: StrategyAutocompleteProps) {
  const { data: strategiesRaw = [] } = useGetStrategies();
  const strategies = strategiesRaw.map(([name]) => name);

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useCallback((): string[] => {
    if (!value.trim()) return strategies.slice(0, 8);
    const q = value.toLowerCase().trim();
    return strategies.filter(
      (s) =>
        s.toLowerCase().includes(q) || abbreviationMatch(q, s)
    );
  }, [value, strategies]);

  const filtered = suggestions();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [value]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.value);
    setOpen(true);
  }

  function handleSelect(strategy: string) {
    onChange(strategy);
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) {
      if (e.key === 'ArrowDown' && filtered.length > 0) {
        setOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filtered.length) {
          handleSelect(filtered[highlightedIndex]);
        }
        break;
      case 'Escape':
        setOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  }

  const baseInputClass =
    'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all';

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className={`${baseInputClass} ${className}`}
      />

      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 glass-card-strong rounded-xl border border-white/15 shadow-xl overflow-hidden">
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.map((strategy, index) => (
              <li
                key={strategy}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(strategy);
                }}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  index === highlightedIndex
                    ? 'bg-primary/20 text-foreground'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                }`}
              >
                {strategy}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

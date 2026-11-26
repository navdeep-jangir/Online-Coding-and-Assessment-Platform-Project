import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/utils/helpers';

export interface SearchInputProps {
  value?: string;
  onChange: (value: string) => void;
  onImmediateChange?: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  isLoading?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function SearchInput({
  value = '',
  onChange,
  onImmediateChange,
  placeholder = 'Search...',
  debounceMs = 300,
  isLoading = false,
  autoFocus = false,
  disabled = false,
  className,
  ariaLabel = 'Search',
}: SearchInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const debouncedValue = useDebounce(inputValue, debounceMs);
  const lastEmittedRef = useRef(value);
  const onChangeRef = useRef(onChange);

  onChangeRef.current = onChange;

  useEffect(() => {
    setInputValue(value);
    lastEmittedRef.current = value;
  }, [value]);

  useEffect(() => {
    if (debouncedValue !== lastEmittedRef.current) {
      lastEmittedRef.current = debouncedValue;
      onChangeRef.current(debouncedValue);
    }
  }, [debouncedValue]);

  const handleChange = (next: string) => {
    setInputValue(next);
    onImmediateChange?.(next);
  };

  const handleClear = () => {
    setInputValue('');
    lastEmittedRef.current = '';
    onImmediateChange?.('');
    onChangeRef.current('');
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search
        className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400 dark:text-text-muted"
        aria-hidden="true"
      />
      <input
        type="search"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-label={ariaLabel}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-accent-secondary focus:outline-none focus:ring-2 focus:ring-accent-secondary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700/80 dark:bg-sidebar dark:text-text-main dark:placeholder:text-text-muted [&::-webkit-search-cancel-button]:hidden"
      />

      <div className="absolute right-2.5 flex items-center">
        {isLoading ? (
          <Loader2
            className="h-4 w-4 animate-spin text-accent-secondary"
            aria-label="Searching"
          />
        ) : (
          inputValue.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Clear search"
              className="rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-text-muted dark:hover:bg-slate-800 dark:hover:text-text-main"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default SearchInput;

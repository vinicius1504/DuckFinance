import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[var(--text-secondary)]">{label}</label>
      )}
      <input
        className={`w-full px-3 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-primary)] border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent)] transition-colors placeholder:text-[var(--text-muted)] ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-[var(--danger)]">{error}</span>}
    </div>
  );
}

import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

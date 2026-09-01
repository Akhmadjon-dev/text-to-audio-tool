import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
  variant?: 'ghost' | 'solid';
  size?: 'md' | 'lg';
}

/** Accessible icon button with a required aria-label and visible focus ring. */
export function IconButton({
  label,
  children,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...rest
}: IconButtonProps) {
  const sizes = size === 'lg' ? 'h-14 w-14 text-2xl' : 'h-11 w-11 text-lg';
  const variants =
    variant === 'solid'
      ? 'bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-400'
      : 'text-slate-700 hover:bg-slate-200 disabled:text-slate-300 dark:text-slate-200 dark:hover:bg-slate-700 dark:disabled:text-slate-600';
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed ${sizes} ${variants} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

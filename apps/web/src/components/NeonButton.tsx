import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './NeonButton.css';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'cyan' | 'magenta' | 'ghost';
  children: ReactNode;
}

/** Reusable button with neon glow styling. */
export function NeonButton({ variant = 'cyan', children, className = '', ...props }: NeonButtonProps) {
  return (
    <button className={`neon-btn neon-btn--${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

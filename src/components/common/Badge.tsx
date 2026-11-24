import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'success' | 'warning' | 'terracotta';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  size = 'md',
}) => {
  const variantClasses: Record<BadgeVariant, string> = {
    primary: 'bg-terracotta/20 text-terracotta border-terracotta/40',
    secondary: 'bg-secondary/20 text-secondary border-secondary/40',
    accent: 'bg-accent/20 text-accent border-accent/40',
    terracotta: 'bg-terracotta/20 text-terracotta border-terracotta/40',
    neutral: 'bg-[#132334] text-[#E8DCC9] border-[#1E3246]',
    success: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    warning: 'bg-amber-950/60 text-amber-300 border-amber-800/60',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

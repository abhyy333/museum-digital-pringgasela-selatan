import React from 'react';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'success' | 'warning';

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
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/15 text-secondary border-secondary/25',
    accent: 'bg-accent/10 text-accent border-accent/20',
    neutral: 'bg-sand-200 text-muted border-border',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

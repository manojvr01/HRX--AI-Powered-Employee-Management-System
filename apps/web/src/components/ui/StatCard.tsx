import React from 'react';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor?: 'primary' | 'secondary' | 'tertiary' | 'error';
  delta?: {
    value: string;
    isPositive?: boolean;
    trend?: 'up' | 'down' | 'neutral';
  };
  progress?: {
    value: number; // 0 to 100
    color?: string;
  };
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'primary',
  delta,
  progress,
  onClick,
  className = '',
}) => {
  const iconColorClasses = {
    primary: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    secondary: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    tertiary: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    error: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  };

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl p-5 sm:p-6 glass-card ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between text-on-surface-variant mb-2">
        <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-slate-300">
          {title}
        </span>
        <div
          className={`p-2 rounded-xl border flex items-center justify-center transition-transform group-hover:scale-105 ${iconColorClasses[iconColor]}`}
        >
          {icon}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-2">
        <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
          {value}
        </span>
        {delta && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              delta.isPositive !== false
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
            }`}
          >
            {delta.value}
          </span>
        )}
      </div>

      {(progress || subtitle) && (
        <div className="mt-4 space-y-2">
          {progress && (
            <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  progress.color || 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(Math.max(progress.value, 0), 100)}%` }}
              />
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-on-surface-variant leading-tight truncate">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
};

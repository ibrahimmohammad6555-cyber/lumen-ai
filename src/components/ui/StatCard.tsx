'use client';

import React from 'react';
import { formatCurrency } from '@/lib/currencies';
import { useApp } from '@/context/AppContext';

interface StatCardProps {
  label: string;
  value: number;
  change?: number; // percentage
  icon: string;
  color: 'blue' | 'red' | 'green' | 'purple' | 'teal';
  prefix?: string;
}

const colorMap = {
  blue: { accent: '#4f8ef7', glow: 'rgba(79,142,247,0.15)' },
  red: { accent: '#f43f5e', glow: 'rgba(244,63,94,0.15)' },
  green: { accent: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  purple: { accent: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  teal: { accent: '#06b6d4', glow: 'rgba(6,182,212,0.15)' },
};

export function StatCard({ label, value, change, icon, color, prefix }: StatCardProps) {
  const { currency } = useApp();
  const { accent, glow } = colorMap[color];
  const isPositive = (change ?? 0) >= 0;

  const displayValue =
    prefix === '%'
      ? `${value.toFixed(1)}%`
      : formatCurrency(value, currency, true);

  return (
    <div
      className="glass-card stat-card p-5 flex flex-col gap-3 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ '--accent': accent } as React.CSSProperties}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
          style={{ background: glow, color: accent }}
        >
          {icon}
        </div>
        {change !== undefined && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: isPositive ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
              color: isPositive ? '#10b981' : '#f43f5e',
            }}
          >
            {isPositive ? '▲' : '▼'} {Math.abs(change ?? 0).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {displayValue}
        </p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

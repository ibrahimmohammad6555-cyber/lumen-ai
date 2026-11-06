'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DEMO_MONTHLY, DEMO_PROFIT_TREND } from '@/lib/demoData';
import { formatCurrency } from '@/lib/currencies';
import { useApp } from '@/context/AppContext';

interface MonthlyDataPoint {
  month: string;
  revenue: number;
  expenses: number;
}

interface ProfitDataPoint {
  month: string;
  profit: number;
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card p-3 text-sm border shadow-xl" style={{ minWidth: 160, borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
      <p className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span>
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {formatCurrency(p.value, currency)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RevenueExpensesChart({
  customData,
  isLive = false,
}: {
  customData?: MonthlyDataPoint[];
  isLive?: boolean;
}) {
  const { currency, theme } = useApp();
  const isDark = theme === 'dark';
  const textColor = isDark ? '#5a7a9a' : '#6b82a8';
  const gridColor = isDark ? 'rgba(79,142,247,0.08)' : 'rgba(79,142,247,0.1)';

  const chartData = customData && customData.length > 0 ? customData : DEMO_MONTHLY;

  return (
    <div className="glass-card p-5 rounded-2xl border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Revenue vs Expenses
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isLive ? 'Dynamic ledger trend' : 'Historical performance comparison'}
          </p>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            isLive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'demo-badge'
          }`}
        >
          {isLive ? 'Live Records' : 'Demo Data'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f8ef7" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: textColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v, currency, true)}
            width={60}
          />
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Legend wrapperStyle={{ fontSize: 12, color: textColor, paddingTop: 8 }} />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#4f8ef7" strokeWidth={2} fill="url(#revGrad)" />
          <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ProfitTrendChart({
  customData,
  isLive = false,
}: {
  customData?: ProfitDataPoint[];
  isLive?: boolean;
}) {
  const { currency, theme } = useApp();
  const isDark = theme === 'dark';
  const textColor = isDark ? '#5a7a9a' : '#6b82a8';
  const gridColor = isDark ? 'rgba(79,142,247,0.08)' : 'rgba(79,142,247,0.1)';

  const chartData = customData && customData.length > 0 ? customData : DEMO_PROFIT_TREND;

  return (
    <div className="glass-card p-5 rounded-2xl border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Profit Trend
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isLive ? 'Net profitability by timeframe' : 'Monthly net profit trajectory'}
          </p>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            isLive ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'demo-badge'
          }`}
        >
          {isLive ? 'Live Records' : 'Demo Data'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: textColor, fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCurrency(v, currency, true)}
            width={60}
          />
          <Tooltip content={<ChartTooltip currency={currency} />} />
          <Bar dataKey="profit" name="Profit" fill="#10b981" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

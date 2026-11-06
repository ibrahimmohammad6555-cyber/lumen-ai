'use client';

import React from 'react';
import Link from 'next/link';
import { formatCurrency, convertCurrency } from '@/lib/currencies';
import { useApp } from '@/context/AppContext';

export function RecentActivity() {
  const { transactions, currency } = useApp();

  const recentItems = transactions.slice(0, 6);

  return (
    <div className="glass-card p-5 rounded-2xl border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Activity
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Real-time transaction events recorded in local storage
          </p>
        </div>
        <Link
          href="/sales"
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
        >
          View All ({transactions.length}) →
        </Link>
      </div>

      <div className="space-y-2">
        {recentItems.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            No recent transactions yet. <Link href="/sales" className="text-blue-400 underline">Record your first transaction</Link>.
          </div>
        ) : (
          recentItems.map((item) => {
            const isSale = item.type === 'sale';
            const isPurchase = item.type === 'purchase';
            const converted = convertCurrency(item.amount, item.currency || 'INR', currency);

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 hover:bg-blue-500/5"
                style={{
                  background: 'var(--glass-dark, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border-color)',
                }}
              >
                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{
                    background: isSale
                      ? 'rgba(16,185,129,0.12)'
                      : isPurchase
                      ? 'rgba(245,158,11,0.12)'
                      : 'rgba(244,63,94,0.12)',
                    color: isSale ? '#10b981' : isPurchase ? '#f59e0b' : '#f43f5e',
                  }}
                >
                  {isSale ? '↑' : isPurchase ? '↓' : '•'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.description}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {item.category} · {item.date} · {item.paymentMethod || 'Cash'}
                  </p>
                </div>

                {/* Amount */}
                <span
                  className="text-sm font-bold flex-shrink-0"
                  style={{ color: isSale ? '#10b981' : '#f43f5e' }}
                >
                  {isSale ? '+' : '-'}{formatCurrency(converted, currency)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

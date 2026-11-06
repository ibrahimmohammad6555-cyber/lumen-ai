'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { CURRENCIES } from '@/lib/currencies';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡', emoji: true },
  { href: '/calculators', label: 'Calculators', icon: '◎', emoji: true },
  { href: '/sales', label: 'Sales & Expenses', icon: '↕', emoji: true },
  { href: '/analytics', label: 'Analytics', icon: '◈', emoji: true },
  { href: '/inventory', label: 'Inventory', icon: '▣', emoji: true },
  { href: '/reports', label: 'Reports', icon: '◫', emoji: true },
  { href: '/settings', label: 'Settings', icon: '⚙', emoji: true },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme, currency, setCurrency, authUser, isCloudConnected } = useApp();
  const isGuest = !authUser;

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)' }}
    >
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-lg"
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #22d3ee)', boxShadow: '0 0 20px rgba(79,142,247,0.4)' }}
          >
            L
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-gradient">LUMEN</span>
            <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text-secondary)' }}>.AI</span>
          </div>
        </div>
        {/* Cloud / Guest badge */}
        <div
          className="mt-3 px-3 py-1.5 rounded-lg text-xs flex items-center justify-between"
          style={{
            background: isCloudConnected ? 'rgba(16,185,129,0.08)' : 'rgba(79,142,247,0.08)',
            border: `1px solid ${isCloudConnected ? 'rgba(16,185,129,0.2)' : 'rgba(79,142,247,0.15)'}`,
            color: 'var(--text-muted)',
          }}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span style={{ color: isCloudConnected ? '#10b981' : '#4f8ef7' }}>●</span>
            <span className="truncate">{isCloudConnected ? authUser?.email : 'Guest Mode (Local)'}</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom controls */}
      <div className="px-4 py-5 space-y-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="sidebar-nav-item w-full text-left"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          <span className="text-base w-5 text-center">{theme === 'dark' ? '☀' : '☾'}</span>
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Currency selector */}
        <div>
          <label
            className="text-xs font-medium block mb-1.5"
            style={{ color: 'var(--text-muted)' }}
            htmlFor="currency-select"
          >
            Display Currency
          </label>
          <select
            id="currency-select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full text-sm rounded-lg px-3 py-2 cursor-pointer"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
            aria-label="Select display currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile header ────────────────────────────────────────────────────
export function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useApp();

  return (
    <>
      <header
        className="flex items-center justify-between px-4 py-3 md:hidden sticky top-0 z-40"
        style={{
          background: 'var(--bg-sidebar)',
          borderBottom: '1px solid var(--border-color)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #4f8ef7, #22d3ee)' }}
          >
            L
          </div>
          <span className="font-bold text-sm text-gradient">LUMEN.AI</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-72"
            style={{ background: 'var(--bg-sidebar)' }}
          >
            <div className="p-4 flex justify-end border-b" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

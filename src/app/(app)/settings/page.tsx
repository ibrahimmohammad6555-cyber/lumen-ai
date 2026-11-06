'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { CURRENCIES } from '@/lib/currencies';

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5 space-y-4 rounded-2xl border" style={{ borderColor: 'var(--border-color)' }}>
      <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const {
    theme,
    toggleTheme,
    currency,
    setCurrency,
    supabaseUrl,
    supabaseAnonKey,
    setSupabaseConfig,
    authUser,
    isCloudConnected,
    syncState,
    lastSyncTime,
    syncWithCloud,
    loginWithSupabase,
    signupWithSupabase,
    logoutSupabase,
    resetAllData,
    reloadSampleData,
  } = useApp();

  // Supabase form
  const [urlInput, setUrlInput] = useState(supabaseUrl);
  const [keyInput, setKeyInput] = useState(supabaseAnonKey);
  const [configSaved, setConfigSaved] = useState(false);

  // Auth form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMsg, setAuthMsg] = useState<{ text: string; success: boolean } | null>(null);
  const [syncMsg, setSyncMsg] = useState<{ text: string; success: boolean } | null>(null);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await setSupabaseConfig(urlInput.trim(), keyInput.trim());
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await loginWithSupabase(email, password);
    setAuthMsg({ text: res.message, success: res.success });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signupWithSupabase(email, password);
    setAuthMsg({ text: res.message, success: res.success });
  };

  const handleSync = async () => {
    const res = await syncWithCloud();
    setSyncMsg({ text: res.message, success: res.success });
  };

  return (
    <div className="p-5 md:p-7 max-w-screen-md mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Settings & Cloud Synchronization
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Manage display preferences, currency standards, local storage, and optional Supabase cloud backup.
        </p>
      </div>

      {/* Account / Cloud Status */}
      <SettingsSection title="Identity & Cloud Account">
        <div
          className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border"
          style={{ background: 'rgba(79,142,247,0.06)', borderColor: 'rgba(79,142,247,0.15)' }}
        >
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: 'rgba(79,142,247,0.15)', color: '#4f8ef7' }}
            >
              {authUser ? '☁' : '👤'}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {authUser ? authUser.email : 'Guest Mode (Local-First)'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {authUser
                  ? 'Authenticated via Supabase. Cloud sync available.'
                  : 'Zero account required. All business records stay private in IndexedDB.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                isCloudConnected ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}
            >
              {isCloudConnected ? 'Cloud Active' : 'Offline / Guest'}
            </span>
            {authUser && (
              <button
                onClick={logoutSupabase}
                className="text-xs px-3 py-1 rounded-lg border border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </SettingsSection>

      {/* Optional Supabase Integration */}
      <SettingsSection title="Optional Supabase Cloud Sync">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Connect your own Supabase project to enable cloud backup and cross-device sync. Leave blank to run 100% locally.
        </p>

        <form onSubmit={handleSaveConfig} className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
              Supabase Project URL
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border text-sm font-mono"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
              Supabase Anon Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border text-sm font-mono"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            />
          </div>

          <div className="flex justify-between items-center pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow"
            >
              Save Supabase Credentials
            </button>
            {configSaved && <span className="text-xs text-emerald-400 font-bold">Credentials Saved!</span>}
          </div>
        </form>

        {/* Auth form if Supabase is configured but not logged in */}
        {urlInput && keyInput && !authUser && (
          <div className="p-4 rounded-xl border space-y-3 mt-4" style={{ borderColor: 'var(--border-color)', background: 'rgba(79,142,247,0.03)' }}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Sign in to Supabase Account</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border text-xs"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border text-xs"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleLogin}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-500"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={handleSignup}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-500 text-blue-400 hover:bg-blue-500/10"
              >
                Sign Up
              </button>
            </div>
            {authMsg && (
              <p className={`text-xs ${authMsg.success ? 'text-emerald-400' : 'text-rose-400'}`}>{authMsg.text}</p>
            )}
          </div>
        )}

        {/* Sync Action */}
        {isCloudConnected && (
          <div className="p-4 rounded-xl border flex items-center justify-between mt-3" style={{ borderColor: 'var(--border-color)', background: 'rgba(16,185,129,0.05)' }}>
            <div>
              <p className="text-xs font-bold text-emerald-400">Cloud Sync Ready</p>
              <p className="text-xs text-gray-400 mt-0.5">Last Synced: {lastSyncTime || 'Never'}</p>
            </div>
            <button
              onClick={handleSync}
              disabled={syncState === 'syncing'}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow disabled:opacity-50"
            >
              {syncState === 'syncing' ? 'Syncing...' : 'Sync Now 🔄'}
            </button>
          </div>
        )}
        {syncMsg && (
          <p className={`text-xs mt-2 ${syncMsg.success ? 'text-emerald-400' : 'text-rose-400'}`}>{syncMsg.text}</p>
        )}
      </SettingsSection>

      {/* Theme Appearance */}
      <SettingsSection title="Visual Theme">
        <div className="grid grid-cols-2 gap-3">
          {(['dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => t !== theme && toggleTheme()}
              className="p-4 rounded-xl text-left transition-all border"
              style={{
                background: t === theme ? 'rgba(79,142,247,0.12)' : 'var(--bg-card)',
                borderColor: t === theme ? '#4f8ef7' : 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              <span className="text-2xl block mb-1">{t === 'dark' ? '🌙' : '☀️'}</span>
              <span className="text-sm font-bold capitalize">{t} Theme</span>
              {t === theme && <span className="text-xs block mt-0.5 text-blue-400">Active</span>}
            </button>
          ))}
        </div>
      </SettingsSection>

      {/* Currency */}
      <SettingsSection title="Display Currency & Precision">
        <select
          id="settings-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full text-sm rounded-xl px-3 py-2.5 border"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code} — {c.name}
            </option>
          ))}
        </select>
      </SettingsSection>

      {/* Data Management */}
      <SettingsSection title="Database & Sample Data Management">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={async () => {
              if (window.confirm('Reload fresh demo business records?')) {
                await reloadSampleData();
                alert('Sample business records restored!');
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
          >
            Reload Sample Data
          </button>
          <button
            onClick={async () => {
              if (window.confirm('Reset all transactions and inventory to zero? This cannot be undone.')) {
                await resetAllData();
                alert('All records cleared.');
              }
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
          >
            Clear All Data
          </button>
        </div>
      </SettingsSection>
    </div>
  );
}

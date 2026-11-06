'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { DEFAULT_CURRENCY } from '@/lib/currencies';
import {
  getDb,
  getPref,
  setPref,
  seedInitialDataIfEmpty,
  type Transaction,
  type Product,
} from '@/lib/db';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export type Theme = 'dark' | 'light';

interface AppContextValue {
  theme: Theme;
  toggleTheme: () => void;
  currency: string;
  setCurrency: (code: string) => void;
  reducedMotion: boolean;

  // Transactions CRUD
  transactions: Transaction[];
  isLoadingTransactions: boolean;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<number>;
  updateTransaction: (id: number, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  refreshTransactions: () => Promise<void>;

  // Products CRUD
  products: Product[];
  isLoadingProducts: boolean;
  addProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => Promise<number>;
  updateProduct: (id: number, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: number) => Promise<void>;
  adjustProductStock: (id: number, delta: number) => Promise<void>;
  refreshProducts: () => Promise<void>;

  // Supabase Auth & Cloud Sync
  supabaseUrl: string;
  supabaseAnonKey: string;
  setSupabaseConfig: (url: string, key: string) => Promise<void>;
  authUser: User | null;
  isCloudConnected: boolean;
  syncState: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncTime: string | null;
  syncWithCloud: () => Promise<{ success: boolean; message: string }>;
  loginWithSupabase: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signupWithSupabase: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logoutSupabase: () => Promise<void>;

  // Database Management
  resetAllData: () => Promise<void>;
  reloadSampleData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [currency, setCurrencyState] = useState<string>(DEFAULT_CURRENCY);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Cloud & Auth states
  const [supabaseUrl, setSupabaseUrlState] = useState<string>('');
  const [supabaseAnonKey, setSupabaseAnonKeyState] = useState<string>('');
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Refresh functions
  const refreshTransactions = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const db = getDb();
      const list = await db.transactions.orderBy('date').reverse().toArray();
      setTransactions(list);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setIsLoadingTransactions(false);
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const db = getDb();
      const list = await db.products.orderBy('name').toArray();
      setProducts(list);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  // Initialize DB and settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);

    (async () => {
      // Load saved preferences
      const savedTheme = await getPref('theme');
      const savedCurrency = await getPref('currency');
      const savedUrl = await getPref('supabase_url');
      const savedKey = await getPref('supabase_key');
      const savedSyncTime = await getPref('last_sync_time');

      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
      if (savedCurrency) setCurrencyState(savedCurrency);
      if (savedSyncTime) setLastSyncTime(savedSyncTime);

      if (savedUrl && savedKey) {
        setSupabaseUrlState(savedUrl);
        setSupabaseAnonKeyState(savedKey);
        try {
          const client = createClient(savedUrl, savedKey);
          setSupabaseClient(client);
          const { data } = await client.auth.getUser();
          if (data?.user) setAuthUser(data.user);
        } catch (e) {
          console.warn('Failed to initialize Supabase client:', e);
        }
      }

      // Seed data if empty
      await seedInitialDataIfEmpty();
      await refreshTransactions();
      await refreshProducts();
    })();

    return () => mq.removeEventListener('change', handler);
  }, [refreshTransactions, refreshProducts]);

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      setPref('theme', next);
      return next;
    });
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    setPref('currency', code);
  }, []);

  // ─── Transactions Operations ───────────────────────────────────────────
  const addTransaction = useCallback(
    async (tx: Omit<Transaction, 'id' | 'createdAt'>): Promise<number> => {
      const db = getDb();
      const newId = await db.transactions.add({
        ...tx,
        createdAt: Date.now(),
      });
      await refreshTransactions();
      return Number(newId);
    },
    [refreshTransactions]
  );

  const updateTransaction = useCallback(
    async (id: number, tx: Partial<Transaction>): Promise<void> => {
      const db = getDb();
      await db.transactions.update(id, tx);
      await refreshTransactions();
    },
    [refreshTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: number): Promise<void> => {
      const db = getDb();
      await db.transactions.delete(id);
      await refreshTransactions();
    },
    [refreshTransactions]
  );

  // ─── Products Operations ───────────────────────────────────────────────
  const addProduct = useCallback(
    async (product: Omit<Product, 'id' | 'updatedAt'>): Promise<number> => {
      const db = getDb();
      const newId = await db.products.add({
        ...product,
        updatedAt: Date.now(),
      });
      await refreshProducts();
      return Number(newId);
    },
    [refreshProducts]
  );

  const updateProduct = useCallback(
    async (id: number, product: Partial<Product>): Promise<void> => {
      const db = getDb();
      await db.products.update(id, {
        ...product,
        updatedAt: Date.now(),
      });
      await refreshProducts();
    },
    [refreshProducts]
  );

  const deleteProduct = useCallback(
    async (id: number): Promise<void> => {
      const db = getDb();
      await db.products.delete(id);
      await refreshProducts();
    },
    [refreshProducts]
  );

  const adjustProductStock = useCallback(
    async (id: number, delta: number): Promise<void> => {
      const db = getDb();
      const current = await db.products.get(id);
      if (!current) return;
      const newQuantity = Math.max(0, (current.stockQuantity || 0) + delta);
      await db.products.update(id, {
        stockQuantity: newQuantity,
        updatedAt: Date.now(),
      });
      await refreshProducts();
    },
    [refreshProducts]
  );

  // ─── Cloud & Supabase ──────────────────────────────────────────────────
  const setSupabaseConfig = useCallback(async (url: string, key: string) => {
    setSupabaseUrlState(url);
    setSupabaseAnonKeyState(key);
    await setPref('supabase_url', url);
    await setPref('supabase_key', key);
    if (url && key) {
      try {
        const client = createClient(url, key);
        setSupabaseClient(client);
        const { data } = await client.auth.getUser();
        setAuthUser(data?.user ?? null);
      } catch (err) {
        console.error('Error setting up Supabase:', err);
      }
    } else {
      setSupabaseClient(null);
      setAuthUser(null);
    }
  }, []);

  const loginWithSupabase = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
      if (!supabaseClient) {
        return { success: false, message: 'Please provide Supabase URL and Anon Key in Settings first.' };
      }
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) return { success: false, message: error.message };
        setAuthUser(data.user);
        return { success: true, message: `Signed in as ${data.user.email}` };
      } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? err.message : 'Login failed' };
      }
    },
    [supabaseClient]
  );

  const signupWithSupabase = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
      if (!supabaseClient) {
        return { success: false, message: 'Please provide Supabase URL and Anon Key in Settings first.' };
      }
      try {
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) return { success: false, message: error.message };
        if (data.user) setAuthUser(data.user);
        return { success: true, message: 'Account created! Please check your email or proceed.' };
      } catch (err: unknown) {
        return { success: false, message: err instanceof Error ? err.message : 'Sign up failed' };
      }
    },
    [supabaseClient]
  );

  const logoutSupabase = useCallback(async () => {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setAuthUser(null);
  }, [supabaseClient]);

  const syncWithCloud = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!supabaseClient) {
      return { success: false, message: 'Cloud sync requires Supabase credentials in Settings.' };
    }
    setSyncState('syncing');
    try {
      const db = getDb();
      const allTx = await db.transactions.toArray();
      const allProds = await db.products.toArray();

      // Attempt upsert to Supabase tables if configured
      const txRes = await supabaseClient.from('transactions').upsert(allTx);
      const prodRes = await supabaseClient.from('products').upsert(allProds);

      if (txRes.error || prodRes.error) {
        // If tables don't exist yet in Supabase, report informative notice
        const errMsg = txRes.error?.message || prodRes.error?.message || 'Sync error';
        setSyncState('error');
        return { success: false, message: `Sync notice: ${errMsg}` };
      }

      const syncTimeString = new Date().toLocaleTimeString();
      setLastSyncTime(syncTimeString);
      await setPref('last_sync_time', syncTimeString);
      setSyncState('synced');
      return { success: true, message: `Successfully synced ${allTx.length} transactions and ${allProds.length} products to cloud.` };
    } catch (err: unknown) {
      setSyncState('error');
      return { success: false, message: err instanceof Error ? err.message : 'Sync failed' };
    }
  }, [supabaseClient]);

  // ─── Reset Operations ──────────────────────────────────────────────────
  const resetAllData = useCallback(async () => {
    const db = getDb();
    await db.transactions.clear();
    await db.products.clear();
    await refreshTransactions();
    await refreshProducts();
  }, [refreshTransactions, refreshProducts]);

  const reloadSampleData = useCallback(async () => {
    const db = getDb();
    await db.transactions.clear();
    await db.products.clear();
    await seedInitialDataIfEmpty();
    await refreshTransactions();
    await refreshProducts();
  }, [refreshTransactions, refreshProducts]);

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        currency,
        setCurrency,
        reducedMotion,

        transactions,
        isLoadingTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        refreshTransactions,

        products,
        isLoadingProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustProductStock,
        refreshProducts,

        supabaseUrl,
        supabaseAnonKey,
        setSupabaseConfig,
        authUser,
        isCloudConnected: Boolean(supabaseClient && authUser),
        syncState,
        lastSyncTime,
        syncWithCloud,
        loginWithSupabase,
        signupWithSupabase,
        logoutSupabase,

        resetAllData,
        reloadSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

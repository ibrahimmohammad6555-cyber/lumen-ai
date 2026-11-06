// src/lib/db.ts
// Robust IndexedDB database using Dexie for LUMEN.AI
import Dexie, { type Table } from 'dexie';

export interface Transaction {
  id?: number;
  type: 'sale' | 'expense' | 'purchase';
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod?: string;
  invoiceNo?: string;
  createdAt: number;
}

export interface Product {
  id?: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  updatedAt: number;
}

export interface Preference {
  key: string;
  value: string;
}

export class LumenDatabase extends Dexie {
  transactions!: Table<Transaction>;
  products!: Table<Product>;
  preferences!: Table<Preference>;

  constructor() {
    super('lumen-ai-db');
    this.version(2).stores({
      transactions: '++id, type, date, category, currency, createdAt',
      products: '++id, name, sku, category, stockQuantity, reorderLevel',
      preferences: 'key',
    });
  }
}

let _db: LumenDatabase | null = null;

export function getDb(): LumenDatabase {
  if (typeof window === 'undefined') {
    throw new Error('getDb() must be called in a browser environment');
  }
  if (!_db) {
    _db = new LumenDatabase();
  }
  return _db;
}

// ─── Preferences ────────────────────────────────────────────────────────
export async function getPref(key: string): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  try {
    const db = getDb();
    const row = await db.preferences.get(key);
    return row?.value;
  } catch {
    return undefined;
  }
}

export async function setPref(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = getDb();
    await db.preferences.put({ key, value });
  } catch (err) {
    console.error('Failed to set preference:', err);
  }
}

// ─── Seed Initial Business Data ─────────────────────────────────────────
export async function seedInitialDataIfEmpty(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const db = getDb();
    const txCount = await db.transactions.count();
    const prodCount = await db.products.count();

    if (txCount === 0) {
      const now = new Date();
      const currentYear = now.getFullYear();
      const pad = (n: number) => String(n).padStart(2, '0');

      const sampleTransactions: Transaction[] = [
        // Recent month
        {
          type: 'sale',
          amount: 48500,
          currency: 'INR',
          category: 'Electronics',
          description: 'Smart POS Terminal & Barcode Scanner bundle',
          paymentMethod: 'UPI',
          invoiceNo: 'INV-2026-081',
          date: `${currentYear}-${pad(now.getMonth() + 1)}-${pad(Math.max(1, now.getDate() - 1))}`,
          createdAt: Date.now() - 86400000,
        },
        {
          type: 'expense',
          amount: 22400,
          currency: 'INR',
          category: 'Procurement',
          description: 'Wholesale packaging & shipping boxes',
          paymentMethod: 'Bank Transfer',
          invoiceNo: 'EXP-1049',
          date: `${currentYear}-${pad(now.getMonth() + 1)}-${pad(Math.max(1, now.getDate() - 2))}`,
          createdAt: Date.now() - 172800000,
        },
        {
          type: 'sale',
          amount: 18750,
          currency: 'INR',
          category: 'Retail Counter',
          description: 'Retail inventory accessories sale',
          paymentMethod: 'Card',
          invoiceNo: 'INV-2026-082',
          date: `${currentYear}-${pad(now.getMonth() + 1)}-${pad(Math.max(1, now.getDate() - 3))}`,
          createdAt: Date.now() - 259200000,
        },
        {
          type: 'purchase',
          amount: 35000,
          currency: 'INR',
          category: 'Inventory',
          description: 'Restock Bluetooth thermal printers (25 units)',
          paymentMethod: 'Bank Transfer',
          invoiceNo: 'PO-5591',
          date: `${currentYear}-${pad(now.getMonth() + 1)}-${pad(Math.max(1, now.getDate() - 4))}`,
          createdAt: Date.now() - 345600000,
        },
        {
          type: 'expense',
          amount: 8900,
          currency: 'INR',
          category: 'Utilities',
          description: 'High-speed broadband & electricity bill',
          paymentMethod: 'UPI',
          invoiceNo: 'EXP-1050',
          date: `${currentYear}-${pad(now.getMonth() + 1)}-${pad(Math.max(1, now.getDate() - 5))}`,
          createdAt: Date.now() - 432000000,
        },
        {
          type: 'sale',
          amount: 36000,
          currency: 'INR',
          category: 'Consulting',
          description: 'Quarterly business IT support retainer',
          paymentMethod: 'Bank Transfer',
          invoiceNo: 'INV-2026-083',
          date: `${currentYear}-${pad(now.getMonth() + 1)}-${pad(Math.max(1, now.getDate() - 6))}`,
          createdAt: Date.now() - 518400000,
        },
        {
          type: 'expense',
          amount: 45000,
          currency: 'INR',
          category: 'Payroll',
          description: 'Store manager and cashier monthly wages',
          paymentMethod: 'Bank Transfer',
          invoiceNo: 'PAY-NOV-01',
          date: `${currentYear}-${pad(now.getMonth() + 1)}-01`,
          createdAt: Date.now() - 604800000,
        },
        {
          type: 'sale',
          amount: 29400,
          currency: 'INR',
          category: 'Retail Counter',
          description: 'Billing software licenses renewal',
          paymentMethod: 'UPI',
          invoiceNo: 'INV-2026-084',
          date: `${currentYear}-${pad(now.getMonth() + 1)}-${pad(Math.max(1, now.getDate() - 8))}`,
          createdAt: Date.now() - 691200000,
        },
        // Past months for historical trend calculations
        {
          type: 'sale',
          amount: 285000,
          currency: 'INR',
          category: 'Retail Counter',
          description: 'October total retail sales aggregate',
          paymentMethod: 'Bank Transfer',
          invoiceNo: 'AGG-OCT-SALES',
          date: `${currentYear}-${pad(Math.max(1, now.getMonth()))}-25`,
          createdAt: Date.now() - 2592000000,
        },
        {
          type: 'expense',
          amount: 112000,
          currency: 'INR',
          category: 'Overheads',
          description: 'October total operating expenditures',
          paymentMethod: 'Bank Transfer',
          invoiceNo: 'AGG-OCT-EXP',
          date: `${currentYear}-${pad(Math.max(1, now.getMonth()))}-28`,
          createdAt: Date.now() - 2419200000,
        },
        {
          type: 'sale',
          amount: 242000,
          currency: 'INR',
          category: 'Retail Counter',
          description: 'September total retail sales aggregate',
          paymentMethod: 'Bank Transfer',
          invoiceNo: 'AGG-SEP-SALES',
          date: `${currentYear}-${pad(Math.max(1, now.getMonth() - 1))}-25`,
          createdAt: Date.now() - 5184000000,
        },
        {
          type: 'expense',
          amount: 98000,
          currency: 'INR',
          category: 'Overheads',
          description: 'September total operating expenditures',
          paymentMethod: 'Bank Transfer',
          invoiceNo: 'AGG-SEP-EXP',
          date: `${currentYear}-${pad(Math.max(1, now.getMonth() - 1))}-28`,
          createdAt: Date.now() - 5011200000,
        },
      ];
      await db.transactions.bulkAdd(sampleTransactions);
    }

    if (prodCount === 0) {
      const sampleProducts: Product[] = [
        {
          name: 'Wireless Bluetooth Barcode Scanner',
          sku: 'SCN-BT-001',
          category: 'Hardware',
          unit: 'pcs',
          costPrice: 1850,
          sellingPrice: 3200,
          stockQuantity: 18,
          reorderLevel: 5,
          updatedAt: Date.now(),
        },
        {
          name: '80mm Thermal Receipt Printer',
          sku: 'PRN-TH-080',
          category: 'Hardware',
          unit: 'pcs',
          costPrice: 2800,
          sellingPrice: 4600,
          stockQuantity: 4, // Below reorder level!
          reorderLevel: 6,
          updatedAt: Date.now(),
        },
        {
          name: 'Thermal Paper Rolls (Box of 50)',
          sku: 'PPR-ROL-050',
          category: 'Supplies',
          unit: 'box',
          costPrice: 650,
          sellingPrice: 1150,
          stockQuantity: 32,
          reorderLevel: 10,
          updatedAt: Date.now(),
        },
        {
          name: 'Heavy Duty Metal Cash Drawer',
          sku: 'CD-MET-405',
          category: 'Hardware',
          unit: 'pcs',
          costPrice: 1400,
          sellingPrice: 2450,
          stockQuantity: 2, // Low stock!
          reorderLevel: 5,
          updatedAt: Date.now(),
        },
        {
          name: 'LUMEN Cloud POS Single License',
          sku: 'SFT-POS-001',
          category: 'Software',
          unit: 'license',
          costPrice: 4500,
          sellingPrice: 9900,
          stockQuantity: 100,
          reorderLevel: 10,
          updatedAt: Date.now(),
        },
      ];
      await db.products.bulkAdd(sampleProducts);
    }
  } catch (err) {
    console.error('Failed to seed initial data:', err);
  }
}

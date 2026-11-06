// src/lib/demoData.ts
// Realistic-looking fictional demo data. Clearly labelled as DEMO DATA throughout.

export const DEMO_SUMMARY = {
  totalRevenue: 2847600,
  totalExpenses: 1193400,
  grossProfit: 1654200,
  netProfit: 1421850,
  profitMargin: 49.9,
  revenueGrowth: 12.4,
  expenseGrowth: 3.1,
};

export const DEMO_MONTHLY = [
  { month: 'Jun', revenue: 198000, expenses: 89000 },
  { month: 'Jul', revenue: 221000, expenses: 94000 },
  { month: 'Aug', revenue: 243000, expenses: 101000 },
  { month: 'Sep', revenue: 215000, expenses: 97000 },
  { month: 'Oct', revenue: 267000, expenses: 108000 },
  { month: 'Nov', revenue: 231000, expenses: 95000 },
  { month: 'Dec', revenue: 289000, expenses: 114000 },
  { month: 'Jan', revenue: 254000, expenses: 103000 },
  { month: 'Feb', revenue: 271000, expenses: 109000 },
  { month: 'Mar', revenue: 312000, expenses: 121000 },
  { month: 'Apr', revenue: 278000, expenses: 112000 },
  { month: 'May', revenue: 368600, expenses: 151400 },
];

export const DEMO_PROFIT_TREND = DEMO_MONTHLY.map((d) => ({
  month: d.month,
  profit: d.revenue - d.expenses,
}));

export const DEMO_RECENT_ACTIVITY = [
  {
    id: 1,
    type: 'sale' as const,
    description: 'Online order — Electronics bundle',
    amount: 48500,
    date: '2026-11-06',
    category: 'Sales',
  },
  {
    id: 2,
    type: 'expense' as const,
    description: 'Supplier invoice — Raw materials',
    amount: -22400,
    date: '2026-11-05',
    category: 'Procurement',
  },
  {
    id: 3,
    type: 'sale' as const,
    description: 'Retail counter — Accessories',
    amount: 12750,
    date: '2026-11-05',
    category: 'Sales',
  },
  {
    id: 4,
    type: 'expense' as const,
    description: 'Monthly utility bills',
    amount: -8900,
    date: '2026-11-04',
    category: 'Overheads',
  },
  {
    id: 5,
    type: 'sale' as const,
    description: 'Service contract renewal',
    amount: 36000,
    date: '2026-11-04',
    category: 'Services',
  },
  {
    id: 6,
    type: 'expense' as const,
    description: 'Staff payroll — Part-time',
    amount: -45000,
    date: '2026-11-03',
    category: 'Payroll',
  },
];

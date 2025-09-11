export type ActiveTab = 'dashboard' | 'inflows' | 'outflows' | 'reports' | 'exports';

export interface InflowItem {
  id: number;
  source: string;
  amount: number;
  category: string;
  date: string;
  status: string;
  description: string;
}

export interface OutflowItem {
  id: number;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  status: string;
  description: string;
}

export interface ReportItem {
  id: number;
  name: string;
  type: string;
  period: string;
  generated: string;
  status: 'Generated' | 'Draft';
}

export interface BudgetItem {
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage: number;
}

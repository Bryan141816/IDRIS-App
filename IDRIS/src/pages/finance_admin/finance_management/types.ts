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

export interface CompanyInfo {
  name: string;
  tagline: string;
  address: { street: string; city: string; state: string; zip: string };
  contact: { phone: string; email: string };
};

export interface FinanceRecordType {
  filters: {
    date_from: string;   // ISO date string e.g. "2025-01-01"
    date_to: string;     // ISO date string e.g. "2025-09-30"
    group_by?: string;   // e.g. "allocation"
    include_pending?: boolean;
  };
  kpis: {
    total_inflow: string;
    total_outflow: string;
    net_balance: string;
    pending_inflow: string;
    pending_outflow: string;
    denied_total: string;
    last_updated: string;
  };
  breakdown: {
    allocation: {
      allocation: string;
      inflow: string;
      outflow: string;
      net: string;
      pending_inflow: string;
      pending_outflow: string;
      denied: string;
    }[];
  };
  diagnostics: {
    records_considered: number;
  };
};

export const emptyFinanceRecord: FinanceRecordType = {
  filters: {
    date_from: "",
    date_to: "",
  },
  kpis: {
    total_inflow: "0.00",
    total_outflow: "0.00",
    net_balance: "0.00",
    pending_inflow: "0.00",
    pending_outflow: "0.00",
    denied_total: "0.00",
    last_updated: new Date().toISOString(),
  },
  breakdown: {
    allocation: [],
  },
  diagnostics: {
    records_considered: 0,
  },
};
export type ActiveTab = 'dashboard' | 'inflows' | 'outflows' | 'reports' | 'exports';

export enum InflowSource {
  GOVERNMENT_GRANTS_AND_FUNDS = "GOVERNMENT_GRANTS_AND_FUNDS",
  PRIVATE_SECTOR_CONTRIBUTIONS = "PRIVATE_SECTOR_CONTRIBUTIONS",
  COMMUNITY_BASED_INITIATIVE = "COMMUNITY_BASED_INITIATIVE",
  MONETARY_DONATIONS = "MONETARY_DONATIONS",
}

export enum SpendCategory {
  RELIEF_SUPPLIES = "Relief Supplies",
  MEDICAL_NEEDS = "Medical Needs",
  SEARCH_RESCUE = "Search & Rescue",
  SHELTER_HOUSING = "Shelter & Housing",
  TRANSPORTATION = "Transportation",
  EQUIPMENT = "Equipment",
  RENTAL_PURCHASE = "Rental/Purchase",
  VOLUNTEER_SUPPORT = "Volunteer Support",
  CLEANUP_DEBRIS_REMOVAL = "Clean-up & Debris Removal",
  SECURITY_SERVICES = "Security Services",
  INFRASTRUCTURE_REPAIRS = "Infrastructure Repairs",
  DISBURSEMENT = "Disbursement",
}


export enum TransactionType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
}

export type Finance = {
  finance_id: number | string;
  counterparty: string;
  amount: number;
  date: string;       // ISO-like string is fine
  inflow_source?: InflowSource;
  spend_category?: SpendCategory;
  purpose: string;
  transaction_type: string;
};

export type InflowItem = {
  finance_id: string;
  counterparty: string;
  amount: number;
  inflow_source: InflowSource;
  date: string;
  purpose: string;
  inflow_type: string;
  attachment?: File;
};

export type OutflowItem = {
  finance_id: string;
  counterparty: string;
  amount: number;
  spend_category: SpendCategory;
  date: string;
  purpose: string;
  inflow_source: string;
  attachment?: File | string | null;
};

export type BudgetItem = {
  budget_for: string;
  category: string;
  inflow_total: number;
  outflow_total: number;
  net_total: number;
  percentage_spent: number;
};

export interface ReportItem {
  id: number;
  name: string;
  type: string;
  period: string;
  generated: string;
}

export interface CompanyInfo {
  name: string;
  tagline: string;
  address: { street: string; city: string; state: string; zip: string };
  contact: { phone: string; email: string };
};

export interface FinanceRecordType {
  filters: {
    from_date: string;   // ISO date string e.g. "2025-01-01"
    to_date: string;     // ISO date string e.g. "2025-09-30"
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
    from_date: "",
    to_date: "",
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
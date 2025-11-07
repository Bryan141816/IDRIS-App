import { InflowItem, OutflowItem, InflowSource, SpendCategory } from './types';
import { FinanceRecordType } from "./types";
import { formatCurrency } from '../../helpers';

export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatDateOnly = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const toDateInput = (value?: string | Date | number | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 10);
};


// ------- Download as PDF (jsPDF + autotable) -------
export const urlToDataUrl = async (url: string): Promise<string | null> => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const normalizeTransactionType = (_: string | null | undefined) => "INFLOW";

export const normalizeInflowType = (
  t?: string | null
): InflowItem["inflow_type"] | undefined =>
  t ? (String(t).trim().toUpperCase() as InflowItem["inflow_type"]) : undefined;

export const inflowSourceOptions = Object.values(InflowSource).map(value => ({
  value,
  label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
}));

export const spendCategoryOptions = Object.values(SpendCategory).map(value => ({
  value,
  label: value,
}));

export const strip_underscores = (s: string) => s.replace(/_/g, " ");

export const validate = (form: Partial<InflowItem> | Partial<OutflowItem>) => {
  const errs: string[] = [];
  // if (!form.counterparty?.trim()) errs.push('Source is required.');
  if (form.amount == null || Number(form.amount) <= 0) errs.push('Amount must be greater than 0.');
  if ('inflow_source' in form && !form.inflow_source) errs.push('Inflow source is required.');
  if ('spend_category' in form && !form.spend_category) errs.push('Spend category is required.');
  if (!form.date) errs.push('Date is required.');
  return errs;
};

export const totalIn = (rows: InflowItem[]) =>
  rows
    .reduce((s, r) => s + toNumber(r.amount), 0);

export const totalOut = (rows: OutflowItem[]) =>
  rows
    .reduce((s, r) => s + toNumber(r.amount), 0);

export const toNumber = (v: number | string | bigint | null | undefined): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  if (v == null) return 0;
  // strip currency symbols, commas, spaces
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

export const toDecimal2 = (value: number | string | null | undefined): number => {
  if (value == null || value === '') return 0.00;

  const num = Number(value);
  if (isNaN(num)) return 0.00;

  return parseFloat(num.toFixed(2));
};

export const getTotalPendingTransactions = (data: FinanceRecordType) => {
  const pendingInflow = parseFloat(data.kpis.pending_inflow);
  const pendingOutflow = parseFloat(data.kpis.pending_outflow);
  return pendingInflow + pendingOutflow;
}

export const getActionRequired = (data: FinanceRecordType) => {
  const totalPending = getTotalPendingTransactions(data);
  if (totalPending > 0) {
    return `${totalPending} transactions require review.`;
  }
  return "No actions required at this time.";
}


const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export const getAttachmentSrc = (att: OutflowItem['attachment']) => {
  if (!att) return '';
  // If it's already a URL string
  if (typeof att === 'string') {
    // absolute URL already?
    if (/^https?:\/\//i.test(att)) return att;
    // otherwise prefix with API base
    return `${API_BASE}/${att.replace(/^\/+/, '')}`;
  }
  // If it's a File (e.g., freshly selected but not uploaded)
  if (att instanceof File) {
    return URL.createObjectURL(att);
  }
  return '';
};

export const formatAmount = (value: number | string | null | undefined): string => {
  if (value == null || value === '') return '';
  const num = typeof value === 'string' ? parseAmount(value) : value;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US');
};

export const parseAmount = (value: string | null | undefined): number => {
  if (value == null || value === '') return 0;
  const numString = String(value).replace(/[^0-9.]/g, '');
  const num = parseFloat(numString);
  return isNaN(num) ? 0 : num;
};
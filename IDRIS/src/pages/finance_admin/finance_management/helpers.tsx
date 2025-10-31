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

export const inflowSourceOptions = Object.values(InflowSource).map(value => ({
  value,
  label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
}));

export const spendCategoryOptions = Object.values(SpendCategory).map(value => ({
  value,
  label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
}));

export const strip_underscores = (s: string) => s.replace(/_/g, " ");

export const validate = (form: Partial<InflowItem> | Partial<OutflowItem>) => {
  const errs: string[] = [];
  if (!form.counterparty?.trim()) errs.push('Source is required.');
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


// export const withSwal = async <T,>(loadingTitle: string, task: () => Promise<T>) => {
//   try {
//     // show loading
//     void Swal.fire({
//       title: loadingTitle,
//       allowOutsideClick: false,
//       didOpen: () => Swal.showLoading(),
//       showConfirmButton: false,
//     });

//     const result = await task();

//     // switch to success (clear spinner first)
//     Swal.hideLoading();
//     await Swal.fire({
//       icon: 'success',
//       title: 'Success',
//       text: 'Operation completed.',
//       confirmButtonText: 'Great!',
//       allowOutsideClick: true,
//       showConfirmButton: true,
//     });

//     return result;
//   } catch (error: any) {
//     const message =
//       error?.response?.data?.detail ||
//       error?.message ||
//       'An unexpected error occurred.';

//     Swal.hideLoading();
//     await Swal.fire({
//       icon: 'error',
//       title: 'Operation failed',
//       text: message,
//       confirmButtonText: 'OK',
//       allowOutsideClick: true,
//       showConfirmButton: true,
//     });

//     throw error;
//   }
//   // IMPORTANT: no 'finally Swal.close()' here
// };

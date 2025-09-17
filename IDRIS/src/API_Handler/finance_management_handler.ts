import { API } from './Axio_API_Handler';


export async function createInflowFinanceRecord(form: FormData): Promise<any> {
  const { data } = await API.post('/finance/inflow/create', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // <-- return data, not the whole response
}

export async function createOutflowFinanceRecord(form: FormData): Promise<any> {
  const { data } = await API.post('/finance/outflow/create', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // <-- return data, not the whole response
}

export async function getFinanceSummary(): Promise<any> {
  const { data } = await API.get('/finance/summary');
  return data;
}

export async function getInflowFinanceRecords(page: number = 1, limit: number = 100): Promise<any> {
  const { data } = await API.get('/finance/get_all/inflows', {
    params: { page, limit },
  });
  return data;
}

export async function getOutflowFinanceRecords(page: number = 1, limit: number = 100): Promise<any> {
  const { data } = await API.get('/finance/get_all/outflows', {
    params: { page, limit },
  });
  return data;
}

export async function getBudgetAllocationSummary(options?: {
  start_date?: string;   // format: YYYY-MM-DD
  end_date?: string;     // format: YYYY-MM-DD
  statuses?: string[];   // e.g. ["RECEIVED", "PAID"]
  include_zero_rows?: boolean;
}): Promise<any> {
  const { data } = await API.get('/finance/summary/budget_allocation', {
    params: {
      ...options,
      // let Axios expand array as ?statuses=RECEIVED&statuses=PAID
      statuses: options?.statuses,
    },
  });
  return data;
}

export async function getReportData(
  from_date?: string,
  to_date?: string,
  statuses?: string[],
  allocation_type?: string[]
): Promise<any> {
  const { data } = await API.get("/finance_reports/get-report/all", {
    params: {
      from_date,
      to_date,
      statuses,
      allocation_type,
    },
  });
  return data;
}


export async function UpdateReportData(form: FormData): Promise<any> {
  const { data } = await API.patch('/finance/update_record', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
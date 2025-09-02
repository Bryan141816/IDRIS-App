
import { API } from './Axio_API_Handler';

export async function createOneTimeDonation(data: any): Promise<any> {
  return await API.post("/donations/one-time/create", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export async function getTotalDonations(year: number = 2025, month: number | null = null): Promise<any> {
    return await API.get(`/donations/total_donations/`, {
        params: { year, month},
    });
}

export async function getRetentionRate(year: number = 2025): Promise<any> {
    return await API.get(`/donations/donors/retention/`, {
        params: { year },
    });
}

export async function getDonationRecord(limit: number = 1): Promise<any> {
    const response = await API.get(`/donations/recent/details`, {
        params: { limit },
    })

    return response.data;
}

export interface DonorAggregates {
  total_cash: number;
  total_inkind: number;
  donation_count: number;
  active_recurring_count: number;
}

export async function getDonorAggregates_legacy(
  from?: string | null,
  to?: string | null
): Promise<any> {
  const params: Record<string, any> = {};
  if (from) params.from = from;   // <-- correct query key
  if (to)   params.to   = to;     // <-- correct query key

  const { data } = await API.get("/donations/get/donor_aggregates", { params });
  return data;
}
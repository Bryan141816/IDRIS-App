
import { API } from './Axio_API_Handler';

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

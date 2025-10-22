import { API } from './Axio_API_Handler';

export async function getDonationReceipt(donationId: string): Promise<any> {
  const { data } = await API.get(`/donations/receipt/${donationId}`);
  return data;
}
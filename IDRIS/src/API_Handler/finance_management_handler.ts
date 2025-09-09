import { API } from './Axio_API_Handler';


export async function createInflowFinanceRecord(form: FormData): Promise<any> {
  const { data } = await API.post('/finance/inflow/create', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // <-- return data, not the whole response
}

export async function getFundingProposalTotalInKindDonations(month: number, year: number): Promise<any>{
  const response = await API.get(`/finance/get_report/by_month/inkind`,{
    params: { month, year }
  },
  )
  return response.data
}


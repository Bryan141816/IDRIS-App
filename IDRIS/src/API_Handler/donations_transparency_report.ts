import { API } from './Axio_API_Handler';


export async function getFundingProposalTotalCashDonations(month: number, year: number): Promise<any>{
  const response = await API.get(`/transparency_report/get_report/by_month/cash`,{
    params: { month, year }
  },
  )
  return response.data
}

export async function getFundingProposalTotalInKindDonations(month: number, year: number): Promise<any>{
  const response = await API.get(`/transparency_report/get_report/by_month/inkind`,{
    params: { month, year }
  },
  )
  return response.data
}


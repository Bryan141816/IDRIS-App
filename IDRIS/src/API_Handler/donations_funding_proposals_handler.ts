
import { API } from './Axio_API_Handler';


export async function createNewDonor(formData: FormData): Promise<any> {
  const response = await API.post('/donors/create/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}


export async function createFundingproposals(formData: FormData): Promise<any>{
  const response = await API.post('/funding_proposals/proposals/create', formData,{
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response;
}

// GET all proposals (optionally with search or filter query)
export async function getFundingProposals(search = '', limit = 4, page = 1): Promise<any> {
  const params: any={};
  if(search) params.search = search;
  if(limit) params.limit = limit;
  if(page) params.page = page;
  const response = await API.get(`/funding_proposals/proposals/all_proposals/`, {params});
  return response.data;
}

export async function updateFundingProposal(id: number, data: any): Promise<any> {
  const response = await API.put(`/funding_proposals/proposals/update_proposal/${id}/`, data);
  return response.data;
}

export async function getFundingProposalsById(id: number): Promise<any> {
  const response = await API.get(`/funding_proposals/proposals/get_proposal/${id}/`);
  return response.data;
} 

export async function getFundingProposalTotalDonations(date_since: string, date_to: string): Promise<any>{
  const response = await API.get(`/funding_proposals/total_holding`,{
    params: { date_since, date_to }
  },
  )
  return response.data
}
import { AxiosResponse } from 'axios';

import { API } from './Axio_API_Handler';

type DonorCountResponse = {
  count: number;
};

export async function getCountofDonors(search = '', donor_type = ''): Promise<AxiosResponse<DonorCountResponse>> {
  return await API.get(`/donors/count/`, {
    params: { search, donor_type },
  });
}

export async function getFundingProposals(limit = 4, page = 1): Promise<any> {
  const response = await API.get(`/funding_proposals/proposals/all_proposals/`, {
    params: { limit , page }, 
  });
  return response.data;
}

export async function getFundingProposalMaxPage(limit = 1): Promise<any>{
  const response = await API.get('/funding_proposals/proposals/get_limit/' ,{
    params: { limit },
  });
  return response.data;
}
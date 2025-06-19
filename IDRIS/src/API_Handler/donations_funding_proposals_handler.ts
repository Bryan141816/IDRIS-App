import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

export async function getAllFundingProposals(
  limit: number,
  page: number,
  search?: string,
  sort: string = 'created_at',
  order: string = 'desc'
): Promise<any> {
  const response = await API.get('/funding_proposals/proposals/all_proposals/', {
    params: { limit, page, search, sort, order }
  });
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

export async function getMostRecentFundingProposals(limit: number, page: number): Promise<any> {
  const response = await API.get(`/funding_proposals/proposals/get_most_recent_proposals/`, {
    params: { limit, page}
  });
  return response.data;
} 
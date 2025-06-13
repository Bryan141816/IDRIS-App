import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

// GET all proposals (optionally with search or filter query)
export async function getFundingProposals(search = ''): Promise<any[]> {
  const response = await API.get(`/funding_proposals/proposals/all_proposals/`, {
    params: { search }, // if backend accepts it
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
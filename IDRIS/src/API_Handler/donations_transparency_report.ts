

import { API } from './Axio_API_Handler';

export async function getDonorsList(search = ''): Promise<any[]> {
  const response = await API.get(`/donors/get_all_as_lists/`, {
    params: { search },
  });
  return response.data;
}

export async function createNewDonor(formData: FormData): Promise<any> {
  const response = await API.post('/donors/create/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

export async function searchDonorUsers(search = ''): Promise<any> {
  const response = await API.get('/users/get_w_type_donor/', {
    params: { search },
  });
  return response.data;
}

// GET all proposals (optionally with search or filter query)
export async function getFundingProposals(search = ''): Promise<any> {
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


export async function createTransparencyReport(formData: FormData): Promise<any> {
  const response = await API.post('/transparency_report/create/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response;
}

export async function getTransparencyReports(
  search: string = '',
  date: string = '',
  page: number = 1,
  limit: number = 5
):
  Promise<any> {

  const params: any = {};
  if (search) params.file_name = search;
  if (date) params.date = date;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const response = await API.get('/transparency_report/get_transparency_reports/', { params });
  return response;
}

export async function getTransparencyReportsMini(
  search: string = '',
  date: string = '',
  page: number = 1,
  limit: number = 5
):
  Promise<any> {

  const params: any = {};
  if (search) params.file_name = search;
  if (date) params.date = date;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const response = await API.get('/transparency_report/get_transparency_reports/mini', { params });
  return response.data;
}

export async function getTransparencyReportById(id: number): Promise<any> {
  console.log(API.getUri({ url: '/transparency_report/get_by_id', params: { transparency_id: id } }));
  return await API.get('/transparency_report/get_by_id', {
    params: { transparency_id: id },
  });
}

export async function updateTransparencyReport(id: number | null, formData: FormData): Promise<any> {
  return await API.put(`/transparency_report/update/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function getMaxPage(limit: number): Promise<any> {
  const response =  await API.get('/transparency_report/get_limit',
    {
      params: { limit }
    });

  return response.data;
}

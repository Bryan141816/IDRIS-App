import { API } from './Axio_API_Handler';

export async function getDonorsList(search = '', page = 1, limit = 1): Promise<any> {
  const response = await API.get(`/donors/get_all_as_lists/`, {
    params: { search, page, limit }, 
  });
  return response.data;
}

export async function createNewDonor(formData: FormData): Promise<any> {
  const response = await API.post('/donors/create_donor/', formData, {
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

export async function getIndividualDonorProfile(): Promise<any>{
  const response = await API.get('/donors/user_profile', {});
  return response.data;
}

export async function getDonorIdByLoggedUser(): Promise<any>{
  const response = await API.get('/donors/me/donor_id', {});
  return response.data;
}

export async function getDonorDetailsById(donorId: string): Promise<any> {
  const { data } = await API.get(`/donors/${donorId}`);
  return data;
}
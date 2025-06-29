import axios, { AxiosResponse } from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
});

type DonorCountResponse = {
    count: number;
  };

export async function getCountofDonors(search = '', donor_type=''): Promise<AxiosResponse<DonorCountResponse>> {
  return await API.get(`/donors/count/`, {
    params: { search, donor_type },
  });
}
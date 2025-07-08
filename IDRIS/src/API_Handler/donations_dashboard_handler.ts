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

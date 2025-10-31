import { API } from './Axio_API_Handler';

export async function createDisbursement(formData: FormData): Promise<any> {
  const response = await API.post('/finance/disbursements/create/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  })
  return response;
};

export const getDisbursements = async () => {
  try {
    const response = await API.get('/finance/disbursements/get_all/');
    return response.data;
  } catch (error) {
    console.error('Error fetching disbursements:', error);
    throw error;
  }
};

export async function getDisbursement(id: string): Promise<any> {
  try {
    const response = await API.get(`/finance/disbursements/get_by_id/`, {
      params: { disbursementId: id }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching disbursement ${id}:`, error);
    throw error;
  }
};

export async function updateDisbursementStatus(id: string, status: string): Promise<any> {
  try {
    const response = await API.patch(`/finance/disbursements/update/`,
      { status },
      {
        params: {
          disbursementId: id,
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating disbursement status for ${id}:`, error);
    throw error;
  }
};

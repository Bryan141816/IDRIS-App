// volunteer_api_handler.ts
import { API } from './Axio_API_Handler';

// Create a new volunteer
export async function createIndividualVolunteer(formData: FormData): Promise<any> {
  const response = await API.post('/volunteer/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// Get all volunteers (no pagination yet — optional upgrade)
export async function getAllVolunteers(): Promise<any[]> {
  const response = await API.get('/volunteer/get_all');
  return response.data;
}

// Get volunteer by ID
export async function getVolunteerById(id: number): Promise<any> {
  const response = await API.get('/volunteer/get_by_id', {
    params: { volunteer_id: id },
  });
  return response.data;
}

// Update volunteer
export async function updateVolunteer(id: number, formData: FormData): Promise<any> {
  const response = await API.put(`/volunteer/update/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// Delete volunteer
export async function deleteVolunteer(id: number): Promise<any> {
  const response = await API.delete(`/volunteer/delete/${id}`);
  return response.data;
}

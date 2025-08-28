// volunteer_api_handler.ts
import { API } from './Axio_API_Handler';
import axios from "axios";
// Create a new volunteer
export async function createIndividualVolunteer(formData: FormData): Promise<any> {
    formData.append('status', 'submitted');
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
export async function updateVolunteer(id: number, formData: FormData, status?: string): Promise<any> {
    if (status) {
        formData.append('status', status);
    }
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
const API_BASE = "http://localhost:8000";

export async function updateVolunteerStatus(
  id: number,
  status: 'pending' | 'approved' | 'rejected' | 'submitted' | 'verifying'
) {
  const res = await API.patch(`/volunteer/${id}/status`, { status });
  return res.data;
}


export const getVolunteerByUserId = async (user_id: number) => {
    try {
        const response = await axios.get(`/api/volunteers/${user_id}`);
        return response.data; // Assuming it returns the volunteer data if found
    } catch (error) {
        console.error("Error fetching volunteer by user ID:", error);
        return null;
    }
};

// organization_volunteer_api_handler.ts
import axios from 'axios';
import { API } from './Axio_API_Handler';

// Create a new organization volunteer
export async function createOrganizationVolunteer(formData: FormData): Promise<any> {
    const response = await API.post('/organization_volunteer/create', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

// Get all organization volunteers (no pagination yet — optional upgrade)
export async function getAllOrganizationVolunteers(): Promise<any[]> {
    const response = await API.get('/organization_volunteer/get_all');
    return response.data;
}

// Get organization volunteer by ID
export async function getOrganizationVolunteerById(id: number): Promise<any> {
    const response = await API.get('/organization_volunteer/get_by_id', {
        params: { volunteer_id: id },
    });
    return response.data;
}



// Update organization volunteer
export async function updateOrganizationVolunteer(id: number, formData: FormData, status?: string): Promise<any> {
    if (status) {
        formData.append('status', status);  // Add status if provided
    }
    const response = await API.put(`/organization_volunteer/update/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

// Delete organization volunteer
export async function deleteOrganizationVolunteer(id: number): Promise<any> {
    const response = await API.delete(`/organization_volunteer/delete/${id}`);
    return response.data;
}

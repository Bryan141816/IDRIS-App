// src/API_Handler/individual_volunteer_handler.ts
import { API } from './Axio_API_Handler';

export type ApplicationStatus = 'submitted' | 'verifying' | 'approved' | 'rejected';
export type AvailabilityStatus = 'available' | 'unavailable' | 'assigned';

// Create (self)
export async function createIndividualVolunteer(formData: FormData): Promise<any> {
    // Default status is handled server-side; keep explicit if you want:
    if (!formData.has('status')) formData.append('status', 'submitted');
    const res = await API.post('/volunteer/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

// Read all
export async function getAllVolunteers(): Promise<any[]> {
    const res = await API.get('/volunteer/get_all');
    return res.data;
}

// Read by id
export async function getVolunteerById(id: number): Promise<any> {
    const res = await API.get('/volunteer/get_by_id', { params: { volunteer_id: id } });
    return res.data;
}

// Read my profile (auth-based; no params)
export async function getMyVolunteerProfile(): Promise<any> {
    const res = await API.get('/volunteer/my_profile');
    return res.data;
}

// Read by current user id (auth-based; no params)
export async function getVolunteerByUserId(): Promise<any> {
    const res = await API.get('/volunteer/my_profile'); 
    return res.data;
}

// Update (admin path)
export async function updateVolunteerAdmin(id: number, formData: FormData, status?: ApplicationStatus): Promise<any> {
    if (status) formData.set('status', status);
    const res = await API.put(`/volunteer/update/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

// Update my profile (self path)
export async function updateMyVolunteerProfile(formData: FormData, status?: ApplicationStatus): Promise<any> {
    if (status) formData.set('status', status);
    const res = await API.put('/volunteer/update_my_profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
}

// Delete
export async function deleteVolunteer(id: number): Promise<any> {
    const res = await API.delete(`/volunteer/delete/${id}`);
    return res.data;
}

// Patch status (admin)
export async function updateVolunteerStatus(
    id: number,
    status?: ApplicationStatus,
    availability_status?: AvailabilityStatus
): Promise<any> {
    const payload: any = {};
    if (status) payload.status = status;
    if (availability_status) payload.availability_status = availability_status;
    const res = await API.patch(`/volunteer/${id}/status`, payload);
    return res.data;
}

// src/API_Handler/organization_volunteer_handler.ts
import { API } from './Axio_API_Handler';

export type ApplicationStatus = 'submitted' | 'verifying' | 'approved' | 'rejected';
export type AvailabilityStatus = 'available' | 'unavailable' | 'assigned';

// Utility: ensure multipart headers aren’t overridden by a JSON default
const ensureNoJsonHeader = () => {
  const anyHeaders = API.defaults.headers as any;
  if (anyHeaders?.post?.['Content-Type'] === 'application/json') delete anyHeaders.post['Content-Type'];
  if (anyHeaders?.put?.['Content-Type'] === 'application/json') delete anyHeaders.put['Content-Type'];
};

// Create (self)
export async function createOrganizationVolunteer(
  formData: FormData,
  onProgress?: (pct: number) => void
): Promise<any> {
  ensureNoJsonHeader();
  if (!formData.has('status')) formData.set('status', 'submitted');
  const res = await API.post('/organization_volunteer/create', formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return res.data;
}

// Read all
export async function getAllOrganizationVolunteers(): Promise<any[]> {
  const res = await API.get('/organization_volunteer/get_all');
  return res.data;
}

// Read by id
export async function getOrganizationVolunteerById(id: number): Promise<any> {
  const res = await API.get('/organization_volunteer/get_by_id', { params: { volunteer_id: id } });
  return res.data;
}

// Read my profile (auth-based; no params)
export async function getMyOrganizationVolunteerProfile(): Promise<any> {
  const res = await API.get('/organization_volunteer/my_profile');
  return res.data;
}

// Read by current user id (auth-based; no params)
export async function getOrganizationVolunteerByUserId(): Promise<any> {
  const res = await API.get('/organization_volunteer/get_by_user_id');
  return res.data;
}

// Update (admin path)
export async function updateOrganizationVolunteer(
  id: number,
  formData: FormData,
  status?: ApplicationStatus,
  onProgress?: (pct: number) => void
): Promise<any> {
  ensureNoJsonHeader();
  if (status) formData.set('status', status);
  const res = await API.put(`/organization_volunteer/update/${id}`, formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return res.data;
}

// Update my profile (self path)
export async function updateMyOrganizationVolunteerProfile(
  formData: FormData,
  status?: ApplicationStatus,
  onProgress?: (pct: number) => void
): Promise<any> {
  ensureNoJsonHeader();
  if (status) formData.set('status', status);
  const res = await API.put('/organization_volunteer/update_my_profile', formData, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });
  return res.data;
}

// Delete
export async function deleteOrganizationVolunteer(id: number): Promise<any> {
  const res = await API.delete(`/organization_volunteer/delete/${id}`);
  return res.data;
}

// Patch status (admin)
export async function updateOrganizationVolunteerStatus(
  id: number,
  status?: ApplicationStatus,
  availability_status?: AvailabilityStatus
): Promise<any> {
  const payload: any = {};
  if (status) payload.status = status;
  if (availability_status) payload.availability_status = availability_status;
  const res = await API.patch(`/organization_volunteer/${id}/status`, payload);
  return res.data;
}

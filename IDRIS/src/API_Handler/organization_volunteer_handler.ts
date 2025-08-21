// organization_volunteer_api_handler.ts
import { API } from "./Axio_API_Handler";

// ---------- Types (align with your FastAPI OrganizationVolunteerRead) ----------
export interface OrganizationVolunteerRead {
  volunteer_id: number;
  user_id: number;

  organization_name: string;
  organization_type: string;
  organization_email: string;
  organization_phone_number?: string | null;
  organization_address?: string | null;

  contact_person_name: string;
  contact_person_position: string;
  contact_person_phone_number?: string | null;
  contact_person_email: string;

  availability?: string | null;          // stored as text in DB (e.g., "Mon, Tue")
  organization_picture?: string | null;  // path or URL
  organiztion_certificate?: string | null; // DB field has a typo; API can use 'organization_certificate' via alias

  created_at: string; // ISO datetime
}

// ---------- Create (self) ----------
export async function createOrganizationVolunteer(formData: FormData): Promise<OrganizationVolunteerRead> {
  const res = await API.post("/org_volunteer/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ---------- Create (admin for any user) ----------
export async function createOrganizationVolunteerForUser(formData: FormData): Promise<OrganizationVolunteerRead> {
  const res = await API.post("/org_volunteer/create_for_user", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ---------- Read all ----------
export async function getAllOrganizationVolunteers(): Promise<OrganizationVolunteerRead[]> {
  const res = await API.get("/org_volunteer/get_all");
  return res.data;
}

// ---------- Read by ID ----------
export async function getOrganizationVolunteerById(id: number): Promise<OrganizationVolunteerRead> {
  const res = await API.get("/org_volunteer/get_by_id", {
    params: { volunteer_id: id },
  });
  return res.data;
}

// ---------- Read my profile (current user) ----------
export async function getMyOrganizationVolunteerProfile(userId: number): Promise<OrganizationVolunteerRead> {
  // Your route currently expects user_id as a query param
  const res = await API.get("/org_volunteer/my_profile", {
    params: { user_id: userId },
  });
  return res.data;
}

// ---------- Update my profile (self; body must include user_id in the form data) ----------
export async function updateMyOrganizationVolunteerProfile(formData: FormData): Promise<OrganizationVolunteerRead> {
  const res = await API.put("/org_volunteer/update_my_profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ---------- Update by ID (admin) ----------
export async function updateOrganizationVolunteer(id: number, formData: FormData): Promise<OrganizationVolunteerRead> {
  const res = await API.put(`/org_volunteer/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ---------- Delete by ID (admin) ----------
export async function deleteOrganizationVolunteer(id: number): Promise<{ message: string }> {
  const res = await API.delete(`/org_volunteer/delete/${id}`);
  return res.data;
}

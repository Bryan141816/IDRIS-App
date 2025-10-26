import { API } from './Axio_API_Handler';

// ---------- TYPES ----------

export interface UserProfileDTO {
  longitude: number;
  latitude: number;
  user_profile_id: string;
  first_name: string;
  last_name: string;
  profile_image?: string | null;
  phone_number?: string | null;
  bday?: string | null; // ISO format: "YYYY-MM-DD"
  gender?: string | null;
  address?: string | null;
  bio?: string | null;
  user_id: string;
  // optionally include related user fields later if you join them
}

// ---------- HELPERS ----------

const normalizeUserProfile = (p: any): UserProfileDTO => ({
    user_profile_id: String(p.user_profile_id),
    first_name: p.first_name,
    last_name: p.last_name,
    profile_image: p.profile_image ?? null,
    phone_number: p.phone_number ?? null,
    bday: p.bday ?? null,
    gender: p.gender ?? null,
    address: p.address ?? null,
    bio: p.bio ?? null,
    user_id: String(p.user_id),
    longitude: 0,
    latitude: 0
});

// ---------- API CALLS ----------

export async function listUserProfiles(): Promise<UserProfileDTO[]> {
  const res = await API.get<UserProfileDTO[]>('/user-profile');
  return (res.data as any[]).map(normalizeUserProfile);
}

export async function getUserProfileById(user_profile_id: string): Promise<UserProfileDTO> {
  const res = await API.get<UserProfileDTO>(`/user-profile/${user_profile_id}`);
  return normalizeUserProfile(res.data);
}


// export async function getUserProfileByUserId(user_id: string): Promise<UserProfileDTO> {
//   const res = await API.get<UserProfileDTO>(`/user-profile/by-user/${user_id}`);
//   return normalizeUserProfile(res.data);
// }

export async function getUserProfileByUserId(user_id: number): Promise<any> {
  const response = await API.get('/user-profile/me');
  return response.data;
}

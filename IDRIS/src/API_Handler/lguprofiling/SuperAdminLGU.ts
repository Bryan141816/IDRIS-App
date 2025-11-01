import { API } from "../Axio_API_Handler";

// Type definitions matching your backend Pydantic schemas
export type LGUSummary = {
  id: number;
  lgu_name: string;
  lgu_classification: string;
  mayor?: string | null;
  lgu_contact?: string | null;
  population?: number | null;
  lat?: number | null;
  lng?: number | null;
};

export type BarangaySummary = {
  id: number;
  name: string;
  lat?: number | null;
  lng?: number | null;
  baranggay_pic?: string | null;
  contact_info?: string | null;
  barangay_captain?: string | null;
  household_count?: number | null;
  total_population?: number | null;
  evacucation_center_id?: number | null;
  common_hazards?: string[];
  barangay_pwd?: number | null;
  barangay_senior?: number | null;
  barangay_children?: number | null;
};

export type RAFFISummary = {
  rafi_id: number;
  lgu_id: number;
  raffi_name: string;
  lat: number;
  lng: number;
  raffi_desc?: string | null;
  raffi_pic?: string | null;
};

// =========================
// API CALLS
// =========================

export async function getAllLGUs(): Promise<LGUSummary[]> {
  const { data } = await API.get("/lgu_profiling/lgus");
  return data;
}

export async function getBarangaysByLGU(lguId: number): Promise<BarangaySummary[]> {
  const { data } = await API.get(`/lgu_profiling/lgus/${lguId}/barangays`);
  return data;
}

export async function getRAFFIByLGU(lguId: number): Promise<RAFFISummary[]> {
  const { data } = await API.get(`/lgu_profiling/lgus/${lguId}/raffi`);
  return data;
}

export async function getLGUSummary(lguId: number): Promise<{
  lgu: LGUSummary;
  barangays: BarangaySummary[];
  raffi: RAFFISummary[];
}> {
  const { data } = await API.get(`/lgu_profiling/lgus/${lguId}/summary`);
  return data;
}

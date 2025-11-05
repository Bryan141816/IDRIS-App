// API_Handler/lguprofiling/SuperAdminLGU.ts
import { API } from "../Axio_API_Handler";

/* ============================================================
   Types
============================================================ */
export type LGUDetail = {
  id: number;
  lgu_name: string;
  lgu_classification: string;
  lat?: number | null;
  lng?: number | null;
  population?: number | null;
  mayor?: string | null;
  lgu_contact?: string | null;
  lgu_majorHazard?: string[] | null;
  DRMMpersonel?: string | null;
  DRMM_contact?: string | null;
  hazard_pic?: string | null;
  lgu_critical_facility?: string[] | null;
  lgu_pwd?: number | null;
  lgu_senior?: number | null;
  lgu_children?: number | null;
  baranggay_count?: number | null;
  lgu_seal?: string | null;
};

export type LGUSummary = Pick<
  LGUDetail,
  "id" | "lgu_name" | "lgu_classification" | "mayor" | "lgu_contact" | "population" | "lat" | "lng"
>;

export type BarangaySummary = {
  id: number;
  name: string;
  lat?: number | null;
  lng?: number | null;
  /** DB spelling uses double 'g' */
  baranggay_pic?: string | null;
  contact_info?: string | null;
  barangay_captain?: string | null;
  household_count?: number | null;
  total_population?: number | null;
  /** Keep id for edits; server now can also return a resolved name */
  evacucation_center_id?: number | null;
  evacucation_center_name?: string | null;
  common_hazards?: string[] | null;
  barangay_pwd?: number | null;
  barangay_senior?: number | null;
  barangay_children?: number | null;
  lgu_id?: number;
};

export type RAFFISummary = {
  rafi_id: number;
  lgu_id: number;
  rafi_name: string;
  lat: number;
  lng: number;
  rafi_desc?: string | null;
  rafi_pic?: string | null;
};

/** Inputs for RAFFI create/update */
export type RAFFICreateInput = {
  rafi_name: string;
  lat: number;
  lng: number;
  rafi_desc?: string | null;
  rafi_pic?: string | null;
};

export type RAFFIUpdateInput = Partial<{
  rafi_name: string;
  lat: number;
  lng: number;
  rafi_desc: string | null;
  rafi_pic: string | null;
}>;

/* ============================================================
   LGU endpoints
============================================================ */
async function getAllLGUs(): Promise<LGUDetail[]> {
  const { data } = await API.get("/lgu_profiling/lgus");
  return data;
}

async function getLGUSummary(
  lguId: number
): Promise<{ lgu: LGUDetail; barangays: BarangaySummary[]; raffi: RAFFISummary[] }> {
  const { data } = await API.get(`/lgu_profiling/lgus/${lguId}/summary`);
  return data;
}

async function getOneLGU(lguId: number): Promise<LGUDetail> {
  const { data } = await API.get(`/lgu_profiling/lgus/${lguId}`);
  return data;
}

async function updateLGU(lguId: number, payload: Partial<LGUDetail>): Promise<LGUDetail> {
  const { data } = await API.put(`/lgu_profiling/lgus/${lguId}`, payload);
  return data;
}

/* ============================================================
   Barangay endpoints
============================================================ */
async function getBarangaysByLGU(lguId: number): Promise<BarangaySummary[]> {
  const { data } = await API.get(`/lgu_profiling/lgus/${lguId}/barangays`);
  return data;
}

/** Optional: global list, filtered by ?lgu_id= */
async function listBarangays(lguId?: number): Promise<BarangaySummary[]> {
  const { data } = await API.get("/lgu_profiling/barangays", {
    params: lguId ? { lgu_id: lguId } : undefined,
  });
  // allow either Array or { items: [] }
  return Array.isArray(data) ? data : (data?.items ?? []);
}

async function getOneBarangay(barangayId: number): Promise<BarangaySummary> {
  const { data } = await API.get(`/lgu_profiling/barangays/${barangayId}`);
  return data;
}

async function updateBarangay(
  barangayId: number,
  payload: Partial<Omit<BarangaySummary, "id">>
): Promise<BarangaySummary> {
  const { data } = await API.put(`/lgu_profiling/barangays/${barangayId}`, payload);
  return data;
}

/* ============================================================
   RAFFI endpoints
============================================================ */
async function getRAFFIByLGU(lguId: number): Promise<RAFFISummary[]> {
  const { data } = await API.get(`/lgu_profiling/lgus/${lguId}/raffi`);
  return data;
}

async function getOneRAFFI(rafiId: number): Promise<RAFFISummary> {
  const { data } = await API.get(`/lgu_profiling/raffi/${rafiId}`);
  return data;
}
// ✅ send double-f keys to match FastAPI input models
async function createRAFFI(lguId: number, payload: {
  rafi_name: string;     // your UI type can stay single-f
  lat: number;
  lng: number;
  rafi_desc?: string | null;
  rafi_pic?: string | null;
}) {
  const body = {
    raffi_name: payload.rafi_name,          // <-- change
    lat: payload.lat,
    lng: payload.lng,
    raffi_desc: payload.rafi_desc ?? null,  // <-- change
    raffi_pic: payload.rafi_pic ?? null,    // <-- change
  };
  const { data } = await API.post(`/lgu_profiling/lgus/${lguId}/raffi`, body);
  return data;
}

async function updateRAFFI(rafiId: number, payload: Partial<{
  rafi_name: string;
  lat: number;
  lng: number;
  rafi_desc: string | null;
  rafi_pic: string | null;
}>) {
  // map UI single-f keys -> API double-f keys
  const body: any = {};
  if (payload.rafi_name !== undefined) body.raffi_name = payload.rafi_name;
  if (payload.lat !== undefined)       body.lat = payload.lat;
  if (payload.lng !== undefined)       body.lng = payload.lng;
  if (payload.rafi_desc !== undefined) body.raffi_desc = payload.rafi_desc;
  if (payload.rafi_pic !== undefined)  body.raffi_pic = payload.rafi_pic;

  const { data } = await API.put(`/lgu_profiling/raffi/${rafiId}`, body);
  return data;
}


async function deleteRAFFI(rafiId: number): Promise<void> {
  await API.delete(`/lgu_profiling/raffi/${rafiId}`);
}

/* ============================================================
   Export a single helper object
============================================================ */
export const SuperAdminLGU = {
  // LGU
  getAllLGUs,
  getLGUSummary,
  getOneLGU,
  updateLGU,

  // Barangays
  getBarangaysByLGU,
  listBarangays,
  getOneBarangay,
  updateBarangay,

  // RAFFI
  getRAFFIByLGU,
  getOneRAFFI,
  createRAFFI,
  updateRAFFI,
  deleteRAFFI,
};

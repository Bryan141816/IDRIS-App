// src/API_Handler/volunteer_status_handler.ts
import { API } from './Axio_API_Handler';

export type VolunteerStatus = "submitted" | "verifying" | "approved" | "rejected";

type CommonRead = {
  id?: number;
  volunteer_id?: number;
  status: string;
  updated_at?: string;
  modified_at?: string;
  created_at?: string;
};

const pickTime = (o?: CommonRead) =>
  o?.updated_at || o?.modified_at || o?.created_at || undefined;

const normalizeStatus = (s: string): VolunteerStatus => {
  const v = String(s || "").toLowerCase();
  if (v === "pending") return "submitted";
  if (v === "in_review" || v === "verifying_credentials") return "verifying";
  if (v === "accepted") return "approved";
  if (v === "declined") return "rejected";
  if (["submitted", "verifying", "approved", "rejected"].includes(v)) return v as VolunteerStatus;
  return "submitted";
};

export async function fetchVolunteerStatus(): Promise<{
  type: "individual" | "organization";
  volunteer_id: number;
  status: VolunteerStatus;
  updated_at?: string;
} | null> {
  const results: Array<{ type: "individual" | "organization"; data: CommonRead }> = [];

  try {
    const { data } = await API.get<CommonRead>("/volunteer/get_by_user_id");
    results.push({ type: "individual", data });
  } catch (e: any) {
    if (e?.response?.status !== 404) console.error("individual get_by_user_id error:", e);
  }

  try {
    const { data } = await API.get<CommonRead>("/organization_volunteer/get_by_user_id");
    results.push({ type: "organization", data });
  } catch (e: any) {
    if (e?.response?.status !== 404) console.error("org get_by_user_id error:", e);
  }

  if (!results.length) return null;

  results.sort(
    (a, b) => new Date(pickTime(b.data) || 0).getTime() - new Date(pickTime(a.data) || 0).getTime()
  );

  const top = results[0];
  return {
    type: top.type,
    volunteer_id: (top.data.volunteer_id ?? top.data.id) as number,
    status: normalizeStatus(top.data.status),
    updated_at: pickTime(top.data),
  };
}

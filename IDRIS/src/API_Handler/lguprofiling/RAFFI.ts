// src/API_Handler/lguprofiling/RAFFI.ts
import { API } from "../../API_Handler/Axio_API_Handler";

export type RAFIOut = {
  rafi_id: number;
  lgu_id: number;
  raffi_name: string;
  lat: number;
  lng: number;
  raffi_desc?: string | null;
  raffi_pic?: string | null; // absolute URL from backend
};

export type RAFICreatePayload = {
  raffi_name: string;
  lat: number;
  lng: number;
  raffi_desc?: string;
  raffi_pic?: string; // dataURL or http(s) URL
};

export type RAFIUpdatePayload = Partial<RAFIOut>;

export async function getMyRAFFIList(): Promise<RAFIOut[]> {
  const { data } = await API.get("/lgu_profiling/me/raffi_list");
  return data;
}

export async function createRAFFI(payload: RAFICreatePayload): Promise<RAFIOut> {
  const { data } = await API.post("/lgu_profiling/api/raffi", payload);
  return data;
}

export async function updateRAFFI(id: number, payload: RAFIUpdatePayload): Promise<RAFIOut> {
  const { data } = await API.put(`/lgu_profiling/api/raffi/${id}`, payload);
  return data;
}

export async function deleteRAFFI(id: number): Promise<void> {
  await API.delete(`/lgu_profiling/api/raffi/${id}`);
}

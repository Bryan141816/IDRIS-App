// src/API_Handler/assignment_handler.ts
import { API } from './Axio_API_Handler';

export interface CreateProgramPayload {
  title: string;              // modal "name"
  description?: string;
  location?: string;
  task_date: string;          // "YYYY-MM-DD"
  max_volunteers: number;
  required_skills?: string[]; // chips
  event_title?: string;       // optional (otherwise uses title)
  event_description?: string; // optional
  event_location?: string;    // optional
  event_date?: string;        // optional
}

export async function createProgram(payload: CreateProgramPayload) {
  const res = await API.post('/assignment/programs', payload);
  return res.data;
}

export async function listPrograms() {
  const res = await API.get('/assignment/programs');
  return res.data;
}

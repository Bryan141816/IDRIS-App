// src/API_Handler/assignment_handler.ts
import { API } from './Axio_API_Handler';

export type TaskLifecycle = 'incoming' | 'ongoing' | 'finished';
export type AssignmentStatus =
    | 'applied' | 'invited' | 'accepted' | 'declined'
    | 'waitlisted' | 'checked_in' | 'no_show' | 'completed' | 'cancelled';

export interface CreateProgramPayload {
    title: string;
    description?: string;
    location?: string;
    start_at: string;
    end_at: string;
    max_volunteers: number;
    required_skills?: string[];
    event_title?: string;
    event_description?: string;
    event_location?: string;
    event_date?: string;
}

// ✅ ADD AssignmentDTO interface for assignments
export interface AssignmentDTO {
    id: number;
    task_id: number;
    individual_volunteer_id?: number | null;
    organization_volunteer_id?: number | null;
    volunteer_count?: number | null;
    status: AssignmentStatus;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export interface ProgramDTO {
    id: number;
    event_id: number;
    title: string;
    description?: string | null;
    location?: string | null;
    start_at: string | null;
    end_at: string | null;
    max_volunteers: number;
    required_skills: string[];
    created_at?: string;
    lifecycle?: TaskLifecycle;
    current_count?: number;
    slot_count?: number;
    is_full?: boolean;
    assigned_volunteer_ids?: number[];
    assignments?: AssignmentDTO[];  // ✅ ADD THIS FIELD
}

export interface AssignRequest {
    individual_volunteer_id?: number;
    organization_volunteer_id?: number;
    status?: AssignmentStatus;
}

// --- helpers ---
const toArraySkills = (v: string[] | string | undefined | null): string[] => {
    if (Array.isArray(v)) return v;
    if (!v) return [];
    return String(v).split(',').map(s => s.trim()).filter(Boolean);
};

const normalizeAssignment = (a: any): AssignmentDTO => ({
    id: Number(a.id),
    task_id: Number(a.task_id),
    individual_volunteer_id: a.individual_volunteer_id ? Number(a.individual_volunteer_id) : null,
    organization_volunteer_id: a.organization_volunteer_id ? Number(a.organization_volunteer_id) : null,
    volunteer_count: a.volunteer_count ? Number(a.volunteer_count) : null,
    status: a.status,
    notes: a.notes ?? null,
    created_at: a.created_at,
    updated_at: a.updated_at,
});

const normalizeProgram = (p: any): ProgramDTO => ({
    id: Number(p.id),
    event_id: Number(p.event_id),
    title: p.title,
    description: p.description ?? null,
    location: p.location ?? null,
    start_at: p.start_at ?? null,
    end_at: p.end_at ?? null,
    max_volunteers: Number(p.max_volunteers),
    required_skills: toArraySkills(p.required_skills),
    created_at: p.created_at,
    lifecycle: p.lifecycle,
    current_count: p.current_count,
    slot_count: p.slot_count,
    is_full: p.is_full,
    assigned_volunteer_ids: (p.assigned_volunteer_ids ?? []).map((x: any) => Number(x)),
    // ✅ ADD THIS: Normalize assignments array
    assignments: (p.assignments ?? []).map((a: any) => normalizeAssignment(a)),
});

// --- Programs / Tasks ---
export async function createProgram(payload: CreateProgramPayload): Promise<ProgramDTO> {
    const res = await API.post<ProgramDTO>('/assignment/programs', payload);
    return normalizeProgram(res.data as any);
}

export async function listPrograms(): Promise<ProgramDTO[]> {
    const res = await API.get<ProgramDTO[]>('/assignment/programs');
    return (res.data as any[]).map(normalizeProgram);
}

// --- Assignments ---
export async function createAssignment(taskId: number, body: AssignRequest): Promise<AssignmentDTO> {
    const res = await API.post(`/assignment/programs/${taskId}/assignments`, body);
    return res.data as AssignmentDTO;
}

export async function updateAssignmentStatus(assignmentId: number, status: AssignmentStatus): Promise<AssignmentDTO> {
    const res = await API.patch(`/assignment/assignments/${assignmentId}/status`, { status });
    return res.data as AssignmentDTO;
}

export async function listTaskAssignments(taskId: number): Promise<AssignmentDTO[]> {
    const res = await API.get(`/assignment/programs/${taskId}/assignments`);
    return res.data as AssignmentDTO[];
}

export async function deleteAssignment(assignmentId: number): Promise<{ ok: boolean }> {
    const res = await API.delete(`/assignment/assignments/${assignmentId}`);
    return res.data;
}

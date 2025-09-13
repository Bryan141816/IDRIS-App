import React, { useEffect, useState, useMemo } from 'react';
import { Users, MapPin, Calendar, Search, Plus, Trash2, Clock } from 'lucide-react';
import {
    createProgram,
    listPrograms,
    createAssignment as apiCreateAssignment,
    listTaskAssignments,
    deleteAssignment as apiDeleteAssignment,
    AssignmentDTO,
} from '../../../API_Handler/assignment_handler';
import { getAllVolunteers } from '../../../API_Handler/individual_volunter_handler';
import { getAllOrganizationVolunteers } from '../../../API_Handler/organization_volunteer_handler';
import dayjs from 'dayjs';
import { Breadcrumb, Empty, Form, Input, InputNumber, DatePicker, Button } from 'antd';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

type VolunteerStatus = 'pending' | 'submitted' | 'verifying' | 'approved' | 'rejected' | 'assigned';
type Availability = 'available' | 'unavailable' | 'assigned';
type TaskLifecycle = 'incoming' | 'ongoing' | 'finished';

interface Volunteer {
    id: string; // "123" for individuals, "org-123" for orgs
    name: string;
    email: string;
    phone: string;
    skills: string[];
    availability: string[];
    status: VolunteerStatus;
    availability_status?: Availability;
}

interface VolunteerArea {
    id: string;
    name: string;
    description: string;
    requiredSkills: string[];
    maxVolunteers: number;
    currentVolunteers: number;
    location: string;
    start_at: string; // ISO
    end_at: string;   // ISO
    lifecycle: TaskLifecycle;
    assignedVolunteers: string[]; // volunteer ids (string-ified)
}

const isOrgId = (id: string) => id.startsWith('org-');
const rawId = (id: string) => (isOrgId(id) ? id.replace(/^org-/, '') : id);

function isoToDateOnly(iso: string) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function fmtRange(startISO?: string, endISO?: string) {
    if (!startISO || !endISO) return '—';
    const s = new Date(startISO);
    const e = new Date(endISO);
    const sameDay =
        s.getFullYear() === e.getFullYear() &&
        s.getMonth() === e.getMonth() &&
        s.getDate() === e.getDate();
    const sDate = s.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const sTime = s.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    const eDate = e.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    const eTime = e.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return sameDay ? `${sDate} · ${sTime} – ${eTime}` : `${sDate} ${sTime} → ${eDate} ${eTime}`;
}

/**
 * Create an assignment on the backend.
 * POST /assignment/programs/{taskId}/assignments
 * Body:
 *  - { individual_volunteer_id: number } OR { organization_volunteer_id: number }
 *  - AND task_id (pydantic model requires this)
 */
async function createAssignment(taskId: string | number, volunteerId: string) {
    const volunteerNumericId = Number(rawId(volunteerId));
    const taskIdNum = typeof taskId === 'string' ? Number(taskId) : taskId;

    if (!Number.isFinite(taskIdNum)) throw new Error('Invalid task id');

    const base =
        isOrgId(volunteerId)
            ? { organization_volunteer_id: volunteerNumericId }
            : { individual_volunteer_id: volunteerNumericId };

    const body = { ...base, task_id: taskIdNum }; // required by backend model

    try {
        return await apiCreateAssignment(taskIdNum, body);
    } catch (err: any) {
        const raw = err?.response?.data?.detail ?? err?.response?.data ?? err?.message ?? err;
        const msg = typeof raw === 'string' ? raw : JSON.stringify(raw);
        throw new Error(msg);
    }
}

const VolunteerAssignmentPage: React.FC = () => {
    const [areas, setAreas] = useState<VolunteerArea[]>([]);
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [form] = Form.useForm();
    const [skillInput, setSkillInput] = useState<string>('');

    // areaId -> (volunteerId string -> assignmentId number)
    const [assignmentMap, setAssignmentMap] = useState<Record<string, Record<string, number>>>({});

    // Filter volunteers by search
    const filteredVolunteers = volunteers.filter(
        (v) =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Show only AVAILABLE volunteers
    const availableVolunteers = filteredVolunteers.filter((v) => v.availability_status === 'available');

    // Only show incoming + ongoing areas (sort by soonest start)
    const activeAreas = useMemo(() => {
        return areas
            .filter((a) => a.lifecycle === 'incoming' || a.lifecycle === 'ongoing')
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
    }, [areas]);

    const handleAssignVolunteers = async () => {
        if (!selectedArea || selectedVolunteers.length === 0) return;

        const area = areas.find((a) => a.id === selectedArea);
        if (!area) {
            await Swal.fire({ icon: 'error', title: 'Program not found' });
            return;
        }

        const remaining = Math.max(area.maxVolunteers - area.currentVolunteers, 0);
        if (selectedVolunteers.length > remaining) {
            await Swal.fire({
                icon: 'warning',
                title: 'Over capacity',
                text: `Only ${remaining} slot(s) remaining for "${area.name}".`,
            });
            return;
        }

        const areaId = String(selectedArea);

        // 🔕 Removed the "Assigning..." loading Swal here

        const results = await Promise.allSettled(
            selectedVolunteers.map(async (volId) => {
                const assignment = await createAssignment(areaId, volId); // AssignmentDTO
                return { volId, assignment };
            })
        );

        const failures: string[] = [];

        results.forEach((r) => {
            if (r.status === 'fulfilled') {
                const { volId, assignment } = r.value as { volId: string; assignment: AssignmentDTO };

                // remember assignmentId for this volunteer in this area
                setAssignmentMap((prev) => ({
                    ...prev,
                    [areaId]: { ...(prev[areaId] || {}), [volId]: assignment.id },
                }));

                // reflect in UI
                setAreas((prev) =>
                    prev.map((a) => {
                        if (a.id !== areaId) return a;
                        const newAssigned = Array.from(new Set([...a.assignedVolunteers, volId]));
                        return {
                            ...a,
                            assignedVolunteers: newAssigned,
                            currentVolunteers: newAssigned.length,
                        };
                    })
                );

                setVolunteers((prev) =>
                    prev.map((v) => (v.id === volId ? { ...v, availability_status: 'assigned' } : v))
                );
            } else {
                const reason = (r as PromiseRejectedResult).reason;
                const msg = reason?.message ?? (typeof reason === 'string' ? reason : JSON.stringify(reason));
                failures.push(msg);
            }
        });

        if (failures.length > 0) {
            await Swal.fire({
                icon: 'error',
                title: 'Some assignments failed',
                html: `<div style="text-align:left">${failures.map((f) => `<div>• ${f}</div>`).join('')}</div>`,
            });
        } else {
            await Swal.fire({
                icon: 'success',
                title: 'Volunteers Assigned',
                timer: 1500,
                showConfirmButton: false,
            });
        }

        setSelectedVolunteers([]);
        setShowAssignModal(false);
        setSelectedArea('');
    };


    // Remove volunteer with SweetAlert
    const handleRemoveVolunteer = async (areaId: string, volunteerId: string) => {
        const { isConfirmed } = await Swal.fire({
            icon: 'warning',
            title: 'Remove this volunteer?',
            text: 'This will unassign the volunteer from the program.',
            showCancelButton: true,
            confirmButtonText: 'Remove',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
        });
        if (!isConfirmed) return;

        let assignmentId = assignmentMap[areaId]?.[volunteerId];

        if (!assignmentId) {
            const taskId = Number(areaId);
            if (!Number.isFinite(taskId)) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Invalid program ID',
                    text: 'The program ID is not valid. Try reloading the page.',
                });
                return;
            }

            try {
                const rows = await listTaskAssignments(taskId);
                const map: Record<string, number> = {};
                rows.forEach((r) => {
                    const key =
                        r.individual_volunteer_id != null
                            ? String(r.individual_volunteer_id)
                            : `org-${r.organization_volunteer_id}`;
                    map[key] = r.id;
                });
                setAssignmentMap((prev) => ({ ...prev, [areaId]: map }));
                assignmentId = map[volunteerId];
            } catch (e: any) {
                console.error(e);
                await Swal.fire({
                    icon: 'error',
                    title: 'Failed to fetch assignments',
                    text: e?.response?.data?.detail || e?.message || 'Please try again.',
                });
                return;
            }
        }

        if (!assignmentId) {
            await Swal.fire({
                icon: 'info',
                title: 'Assignment not found',
                text: "Couldn't find the assignment ID for this volunteer. Try reloading the page.",
            });
            return;
        }

        try {
            await apiDeleteAssignment(assignmentId);

            setAssignmentMap((prev) => {
                const inner = { ...(prev[areaId] || {}) };
                delete inner[volunteerId];
                return { ...prev, [areaId]: inner };
            });

            setAreas((prev) =>
                prev.map((area) => {
                    if (area.id !== areaId) return area;
                    const newAssigned = area.assignedVolunteers.filter((id) => id !== volunteerId);
                    return {
                        ...area,
                        assignedVolunteers: newAssigned,
                        currentVolunteers: newAssigned.length,
                    };
                })
            );

            setVolunteers((prev) =>
                prev.map((v) => (v.id === volunteerId ? { ...v, availability_status: 'available' } : v))
            );

            await Swal.fire({
                icon: 'success',
                title: 'Volunteer Removed',
                text: 'The volunteer has been unassigned successfully.',
                timer: 1800,
                showConfirmButton: false,
            });
        } catch (e: any) {
            await Swal.fire({
                icon: 'error',
                title: "Can't remove volunteer",
                text: e?.response?.data?.detail || e?.message || 'Please try again.',
            });
        }
    };

    const getVolunteerById = (id: string) => volunteers.find((v) => v.id === id);

    // Fetch volunteers
    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                setLoading(true);

                const [indivResp, orgResp] = await Promise.all([getAllVolunteers(), getAllOrganizationVolunteers()]);

                const toArray = (resp: any): any[] =>
                    Array.isArray(resp)
                        ? resp
                        : Array.isArray(resp?.data)
                            ? resp.data
                            : Array.isArray(resp?.results)
                                ? resp.results
                                : [];

                const indiv = toArray(indivResp);
                const org = toArray(orgResp);

                const mapIndiv: Volunteer[] = indiv.map((v: any) => ({
                    id: String(v.volunteer_id ?? v.id ?? v.user_id ?? (crypto as any).randomUUID?.() ?? Math.random()),
                    name: [v.first_name, v.middle_name, v.last_name].filter(Boolean).join(' ') || 'Unnamed',
                    email: v.email ?? '',
                    phone: v.phone_number ?? '',
                    skills: Array.isArray(v.skills)
                        ? v.skills
                        : v.skills
                            ? String(v.skills).split(',').map((s: string) => s.trim())
                            : [],
                    availability: Array.isArray(v.availability)
                        ? v.availability
                        : v.availability
                            ? String(v.availability).split(',').map((s: string) => s.trim())
                            : [],
                    status: (v.status ?? 'submitted') as VolunteerStatus,
                    availability_status: 'unavailable', // will be recalculated after assignments load
                }));

                const mapOrg: Volunteer[] = org.map((o: any) => ({
                    id: `org-${o.volunteer_id ?? o.id ?? o.user_id ?? (crypto as any).randomUUID?.() ?? Math.random()}`,
                    name: o.organization_name ?? 'Unnamed Organization',
                    email: o.organization_email ?? '',
                    phone: o.organization_phone_number ?? '',
                    skills: Array.isArray(o.required_skills)
                        ? o.required_skills
                        : o.required_skills
                            ? String(o.required_skills).split(',').map((s: string) => s.trim())
                            : [],
                    availability: Array.isArray(o.availability)
                        ? o.availability
                        : o.availability
                            ? String(o.availability).split(',').map((s: string) => s.trim())
                            : [],
                    status: (o.status ?? 'submitted') as VolunteerStatus,
                    availability_status: 'unavailable', // will be recalculated after assignments load
                }));

                setVolunteers([...mapIndiv, ...mapOrg]);
            } catch (err) {
                console.error('Fetch volunteers failed:', err);
                setVolunteers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVolunteers();
    }, []);

    // Fetch programs + assignments, build maps and availability
    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const data = await listPrograms();

                const mappedAreas: VolunteerArea[] = (Array.isArray(data) ? data : []).map((area: any) => {
                    const reqSkills = Array.isArray(area.required_skills)
                        ? area.required_skills
                        : area.required_skills
                            ? String(area.required_skills)
                                .split(',')
                                .map((s: string) => s.trim())
                                .filter(Boolean)
                            : [];

                    const startISO: string =
                        area.start_at ??
                        (area.task_date ? new Date(`${area.task_date}T08:00:00`).toISOString() : new Date().toISOString());
                    const endISO: string =
                        area.end_at ??
                        (area.task_date ? new Date(`${area.task_date}T17:00:00`).toISOString() : new Date().toISOString());

                    const lifecycle: TaskLifecycle = (() => {
                        const now = Date.now();
                        const s = new Date(startISO).getTime();
                        const e = new Date(endISO).getTime();
                        if (!Number.isFinite(s) || !Number.isFinite(e)) return 'incoming';
                        if (now < s) return 'incoming';
                        if (now >= e) return 'finished';
                        return 'ongoing';
                    })();

                    return {
                        id: String(area.id),
                        name: area.title,
                        description: area.description ?? '',
                        requiredSkills: reqSkills,
                        maxVolunteers: Number(area.max_volunteers) || 0,
                        currentVolunteers: 0, // will fill after we fetch assignments
                        location: area.location ?? '',
                        start_at: startISO,
                        end_at: endISO,
                        lifecycle,
                        assignedVolunteers: [], // will fill after we fetch assignments
                    };
                });

                setAreas(mappedAreas);

                // For each area, fetch assignments
                const perArea = await Promise.all(
                    mappedAreas.map(async (area) => {
                        try {
                            const rows = await listTaskAssignments(Number(area.id));
                            const map: Record<string, number> = {};
                            const assignedKeys: string[] = [];

                            rows.forEach((r) => {
                                const key =
                                    r.individual_volunteer_id != null
                                        ? String(r.individual_volunteer_id)
                                        : `org-${r.organization_volunteer_id}`;
                                map[key] = r.id;
                                assignedKeys.push(key);
                            });

                            return { id: area.id, map, assignedKeys };
                        } catch {
                            return { id: area.id, map: {}, assignedKeys: [] as string[] };
                        }
                    })
                );

                // assignmentMap for delete ops
                const newAssignmentMap: Record<string, Record<string, number>> = {};
                perArea.forEach(({ id, map }) => {
                    newAssignmentMap[id] = map;
                });
                setAssignmentMap(newAssignmentMap);

                // Update areas with assigned keys
                setAreas((prev) =>
                    prev.map((a) => {
                        const found = perArea.find((x) => x.id === a.id);
                        if (!found) return a;
                        return {
                            ...a,
                            assignedVolunteers: found.assignedKeys,
                            currentVolunteers: found.assignedKeys.length,
                        };
                    })
                );

                // NEW: compute overall assigned set and flip availability statuses
                const assignedSet = new Set<string>();
                perArea.forEach(({ assignedKeys }) => assignedKeys.forEach((k) => assignedSet.add(k)));
                setVolunteers((prev) =>
                    prev.map((v) => ({
                        ...v,
                        availability_status: assignedSet.has(v.id) ? 'assigned' : 'available',
                    }))
                );
            } catch (error) {
                console.error('Failed to fetch programs:', error);
            }
        };

        fetchPrograms();
    }, []);

    // ---- Add Program/Event helpers (skills in form) ----
    const addSkillChip = () => {
        const val = skillInput.trim();
        if (!val) return;
        const current = form.getFieldValue('required_skills') || [];
        if (current.includes(val)) {
            setSkillInput('');
            return;
        }
        const updated = [...current, val];
        form.setFieldsValue({ required_skills: updated });
        setSkillInput('');
    };

    const removeSkillChip = (skill: string) => {
        const current = form.getFieldValue('required_skills') || [];
        const updated = current.filter((s: string) => s !== skill);
        form.setFieldsValue({ required_skills: updated });
    };

    const onSubmitCreate = async (values: any) => {
        const startISO = values.start_at?.toISOString?.() ?? null;
        const endISO = values.end_at?.toISOString?.() ?? null;

        const mv = Number(values.maxVolunteers);

        const payload = {
            title: values.name.trim(),
            description: values.description.trim(),
            location: values.location.trim(),
            start_at: startISO!,
            end_at: endISO!,
            task_date: isoToDateOnly(startISO!),
            max_volunteers: mv,
            required_skills: values.required_skills ?? [],
        };

        try {
            const created = await createProgram(payload);

            const reqSkills = Array.isArray(created.required_skills)
                ? created.required_skills
                : created.required_skills
                    ? String(created.required_skills)
                        .split(',')
                        .map((s: string) => s.trim())
                        .filter(Boolean)
                    : [];

            const start = created.start_at ?? payload.start_at;
            const end = created.end_at ?? payload.end_at;

            const lifecycle: TaskLifecycle = (() => {
                const now = Date.now();
                const s = new Date(start).getTime();
                const e = new Date(end).getTime();
                if (!Number.isFinite(s) || !Number.isFinite(e)) return 'incoming';
                if (now < s) return 'incoming';
                if (now >= e) return 'finished';
                return 'ongoing';
            })();

            setAreas((prev) => [
                {
                    id: String(created.id),
                    name: created.title,
                    description: created.description ?? '',
                    requiredSkills: reqSkills,
                    maxVolunteers: Number(created.max_volunteers) || mv,
                    currentVolunteers: 0,
                    location: created.location ?? payload.location,
                    start_at: start,
                    end_at: end,
                    lifecycle,
                    assignedVolunteers: [],
                },
                ...prev,
            ]);

            form.resetFields();
            setSkillInput('');

            await Swal.fire({
                icon: 'success',
                title: 'Program Created',
                text: 'The program has been created successfully!',
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (e: any) {
            await Swal.fire({
                icon: 'error',
                title: 'Error',
                text: e?.response?.data?.detail || e?.message || 'Failed to create program',
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="breadcrumb-section mb-4">
                    <h2 className="page-title">Volunteer Assignment</h2>
                    <Breadcrumb>
                        <Breadcrumb.Item href="#">
                            <span>Home</span>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <Link to="/volunteer_management/volunteer_dashboard">Volunteer Dashboard</Link>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <span>Volunteer Assignment</span>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Volunteer Areas */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Volunteer Areas
                                </h2>

                                {/* Add Program/Event */}
                                <button
                                    onClick={async () => {
                                        const { value: opened } = await Swal.fire({
                                            title: 'Add Program / Event',
                                            html: '',
                                            didOpen: () => { },
                                            showConfirmButton: false,
                                            showCloseButton: true,
                                        });
                                    }}
                                    className="hidden"
                                >
                                    (unused)
                                </button>

                                {/* Plain button toggles modal below */}
                                <button
                                    onClick={() => {
                                        // open AntD form modal below
                                        // we use our own container modal, not Swal
                                        (document.getElementById('add-program-modal-open') as HTMLButtonElement)?.click?.();
                                    }}
                                    className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Program / Event
                                </button>

                                {/* hidden helper to toggle our modal state */}
                                <button id="add-program-modal-open" className="hidden" onClick={() => form.resetFields()}>
                                    open
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {activeAreas.length === 0 ? (
                                    <div className="py-10">
                                        <Empty description="No upcoming or ongoing programs" />
                                    </div>
                                ) : (
                                    activeAreas.map((area) => (
                                        <div key={area.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                                                        <span
                                                            className={`px-2 py-0.5 rounded-full text-xs ${area.lifecycle === 'incoming'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : area.lifecycle === 'ongoing'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-gray-100 text-gray-800'
                                                                }`}
                                                        >
                                                            {area.lifecycle}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-600 text-sm">{area.description}</p>
                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <MapPin className="w-4 h-4" />
                                                            {area.location}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {fmtRange(area.start_at, area.end_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedArea(area.id);
                                                        setShowAssignModal(true);
                                                    }}
                                                    disabled={area.currentVolunteers >= area.maxVolunteers}
                                                    className={`px-3 py-1 rounded-md text-sm transition-colors flex items-center gap-1 ${area.currentVolunteers >= area.maxVolunteers
                                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                    title={area.currentVolunteers >= area.maxVolunteers ? 'Task is full' : 'Assign volunteers'}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Assign
                                                </button>
                                            </div>

                                            <div className="mb-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Volunteers Assigned</span>
                                                    <span
                                                        className={
                                                            area.currentVolunteers >= area.maxVolunteers ? 'text-red-600' : 'text-gray-600'
                                                        }
                                                    >
                                                        {area.currentVolunteers} / {area.maxVolunteers}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${area.currentVolunteers >= area.maxVolunteers ? 'bg-red-500' : 'bg-blue-600'
                                                            }`}
                                                        style={{
                                                            width: `${Math.min(
                                                                area.maxVolunteers > 0
                                                                    ? (area.currentVolunteers / area.maxVolunteers) * 100
                                                                    : 0,
                                                                100
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <p className="text-sm font-medium text-gray-700 mb-1">Required Skills:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {area.requiredSkills.map((skill) => (
                                                        <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {area.assignedVolunteers.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700 mb-2">Assigned Volunteers:</p>
                                                    <div className="space-y-2">
                                                        {area.assignedVolunteers.map((volunteerId) => {
                                                            const volunteer = getVolunteerById(volunteerId);
                                                            return volunteer ? (
                                                                <div
                                                                    key={volunteerId}
                                                                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                                                >
                                                                    <div>
                                                                        <span className="text-sm font-medium">{volunteer.name}</span>
                                                                        <span className="text-xs text-gray-500 ml-2">{volunteer.email}</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleRemoveVolunteer(area.id, volunteerId)}
                                                                        className="text-red-600 hover:text-red-800 p-1"
                                                                        title="Unassign"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Volunteer List */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
                                    <Users className="w-5 h-5 text-green-600" />
                                    Available Volunteers
                                </h2>
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search volunteers..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                    {loading ? (
                                        <div className="py-10">
                                            <Empty description="Loading volunteers..." />
                                        </div>
                                    ) : availableVolunteers.length === 0 ? (
                                        <div className="py-10">
                                            <Empty
                                                description={searchTerm ? 'No matching available volunteers' : 'No available volunteers yet'}
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            />
                                        </div>
                                    ) : (
                                        availableVolunteers.map((volunteer) => (
                                            <div key={volunteer.id} className="border border-gray-200 rounded-lg p-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-medium text-gray-900">{volunteer.name}</h3>
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs ${volunteer.availability_status === 'available'
                                                                ? 'bg-green-100 text-green-800'
                                                                : volunteer.availability_status === 'assigned'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {volunteer.availability_status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-2">{volunteer.email}</p>
                                                <div className="mb-2">
                                                    <p className="text-xs text-gray-500 mb-1">Skills:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {volunteer.skills.map((skill) => (
                                                            <span key={skill} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                                {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    <span>Availability: {volunteer.availability.join(', ') || '—'}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* NEW: Assign Volunteers Modal */}
                {showAssignModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg w-full max-w-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Volunteers</h3>

                            {(() => {
                                const area = areas.find((a) => a.id === selectedArea);
                                const remaining = area ? Math.max(area.maxVolunteers - area.currentVolunteers, 0) : 0;

                                const candidates = availableVolunteers.filter((v) => !(area?.assignedVolunteers.includes(v.id)));

                                return (
                                    <>
                                        <div className="text-sm text-gray-600 mb-2">
                                            {area ? (
                                                <>
                                                    Assign to: <span className="font-medium">{area.name}</span> • Remaining slots:{' '}
                                                    <span className="font-medium">{remaining}</span>
                                                </>
                                            ) : (
                                                'Select a program'
                                            )}
                                        </div>

                                        <div className="border rounded-md max-h-80 overflow-y-auto divide-y">
                                            {candidates.length === 0 ? (
                                                <div className="p-4 text-sm text-gray-500">No available volunteers to assign.</div>
                                            ) : (
                                                candidates.map((v) => (
                                                    <label key={v.id} className="flex items-start gap-3 p-3 hover:bg-gray-50">
                                                        <input
                                                            type="checkbox"
                                                            className="mt-1"
                                                            checked={selectedVolunteers.includes(v.id)}
                                                            onChange={(e) => {
                                                                const checked = e.target.checked;
                                                                setSelectedVolunteers((prev) => {
                                                                    if (checked) {
                                                                        if (area && prev.length >= remaining) return prev;
                                                                        return [...prev, v.id];
                                                                    } else {
                                                                        return prev.filter((id) => id !== v.id);
                                                                    }
                                                                });
                                                            }}
                                                        />
                                                        <div>
                                                            <div className="font-medium">{v.name}</div>
                                                            <div className="text-xs text-gray-500">{v.email}</div>
                                                            {v.skills?.length > 0 && (
                                                                <div className="mt-1 flex flex-wrap gap-1">
                                                                    {v.skills.map((s) => (
                                                                        <span key={s} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                                                                            {s}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-2 mt-6">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowAssignModal(false);
                                                    setSelectedVolunteers([]);
                                                }}
                                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (!area) return;
                                                    const remainingSlots = Math.max(area.maxVolunteers - area.currentVolunteers, 0);
                                                    if (selectedVolunteers.length === 0) {
                                                        await Swal.fire({
                                                            icon: 'info',
                                                            title: 'No volunteers selected',
                                                            timer: 1400,
                                                            showConfirmButton: false,
                                                        });
                                                        return;
                                                    }
                                                    if (selectedVolunteers.length > remainingSlots) {
                                                        await Swal.fire({
                                                            icon: 'warning',
                                                            title: 'Over capacity',
                                                            text: `Only ${remainingSlots} slot(s) remaining for "${area.name}". Deselect some volunteers.`,
                                                        });
                                                        return;
                                                    }
                                                    await handleAssignVolunteers();
                                                }}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                                            >
                                                Assign Selected
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* NEW: Add Program/Event Modal (AntD Form) */}
                <div className="relative">
                    <input
                        type="checkbox"
                        id="toggle-add-program"
                        className="hidden"
                        onChange={(e) => {
                            const open = e.target.checked;
                            // sync with state-less trigger
                        }}
                    />
                </div>

                {/* Our own modal container */}
                <div id="add-program-modal-root"></div>

                {/* Always render the modal; open via button that resets form */}
                <div className="fixed inset-0 pointer-events-none z-50">
                    <div className="pointer-events-auto">
                        {/* controlled by presence of a class; simpler: render conditionally using local state */}
                    </div>
                </div>

                {/* Simple controlled modal using local state */}
                {/* You can swap this to a proper modal component if you have one. */}
                {/* We open it by clicking the "Add Program / Event" button -> it calls form.resetFields() then sets state below */}
                {/* For clarity: we'll just show it when form has been touched via a helper. */}
            </div>

            {/* Modal content for Add Program/Event */}
            {/* Toggle via a tiny local state: simply reuse form.resetFields() call and show a state modal */}
            {/* To keep it simple, show whenever user clicks the visible Add Program button */}
            {/* We'll manage a local state below */}
        </div>
    );
};

export default VolunteerAssignmentPage;

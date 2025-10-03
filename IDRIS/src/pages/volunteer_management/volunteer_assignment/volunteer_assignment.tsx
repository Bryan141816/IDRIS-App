import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Users, MapPin, Calendar, Search, Plus, Trash2, CheckCircle, Clock} from 'lucide-react';
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
import { Breadcrumb, Empty } from 'antd';
import { VolunteerStatus } from '../../../API_Handler/volunteer_status_handler';

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

interface NewAreaForm {
    name: string;
    description: string;
    location: string;
    start_at: string; // yyyy-MM-ddTHH:mm
    end_at: string;   // yyyy-MM-ddTHH:mm
    maxVolunteers: number | '';
    requiredSkills: string[];
    skillInput: string;
}

const isOrgId = (id: string) => id.startsWith('org-');
const rawId = (id: string) => (isOrgId(id) ? id.replace(/^org-/, '') : id);

function toIsoOrNull(dtLocal: string) {
    if (!dtLocal) return null;
    const d = new Date(dtLocal);
    return isNaN(d.getTime()) ? null : d.toISOString();

}

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

    // areaId -> (volunteerId string -> assignmentId number)
    const [assignmentMap, setAssignmentMap] = useState<Record<string, Record<string, number>>>({});

    // NEW: Add Program/Event modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [newArea, setNewArea] = useState<NewAreaForm>({
        name: '',
        description: '',
        location: '',
        start_at: new Date().toISOString().slice(0, 16),
        end_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
        maxVolunteers: '',
        requiredSkills: [],
        skillInput: '',
    });

    const filteredVolunteers = volunteers.filter(
        (v) =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))















    );

    // ✅ Show only AVAILABLE volunteers (by availability_status)
    const availableVolunteers = filteredVolunteers.filter((v) => v.availability_status === 'available');

    // ✅ Only show incoming + ongoing areas (and sort by soonest start)
    const activeAreas = useMemo(() => {
        return areas
            .filter(a => a.lifecycle === 'incoming' || a.lifecycle === 'ongoing')
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
    }, [areas]);

    // Assign volunteers and remember assignment IDs
    const handleAssignVolunteers = async () => {
        if (!selectedArea || selectedVolunteers.length === 0) return;
        const areaId = String(selectedArea);

        const results = await Promise.allSettled(
            selectedVolunteers.map(async (volId) => {
                const assignment = await createAssignment(areaId, volId); // AssignmentDTO
                return { volId, assignment };
            })
        );

        const failed: string[] = [];

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
                failed.push(msg);
            }
        });

        if (failed.length > 0) {
            alert(`Some assignments failed:\n- ${failed.join('\n- ')}`);
        }

        setSelectedVolunteers([]);
        setShowAssignModal(false);
        setSelectedArea('');
    };

    // Delete using real assignment id
    const handleRemoveVolunteer = async (areaId: string, volunteerId: string) => {
        // 1) find assignment id from map
        let assignmentId = assignmentMap[areaId]?.[volunteerId];

        // 2) if not cached (e.g., after reload), fetch for this area and rebuild map
        if (!assignmentId) {
            try {
                const rows = await listTaskAssignments(Number(areaId));
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
            } catch (e) {
                console.error(e);
            }
        }

        if (!assignmentId) {
            alert("Couldn't find the assignment ID for this volunteer. Try reloading the page.");
            return;
        }

        // 3) call DELETE /assignment/assignments/{id}
        try {
            await apiDeleteAssignment(assignmentId);
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || 'Delete failed';
            alert(msg);
            return;
        }

        // 4) update local states
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
                    id: String(v.volunteer_id ?? v.id ?? v.user_id ?? crypto.randomUUID()),
                    name: [v.first_name, v.middle_name, v.last_name].filter(Boolean).join(' ') || 'Unnamed',
                    email: v.email ?? '',
                    phone: v.phone_number ?? '',
                    skills: Array.isArray(v.skills)
                        ? v.skills
                        : v.skills
                            ? String(v.skills)
                                .split(',')
                                .map((s: string) => s.trim())
                            : [],
                    availability: Array.isArray(v.availability)
                        ? v.availability
                        : v.availability
                            ? String(v.availability)
                                .split(',')
                                .map((s: string) => s.trim())
                            : [],
                    status: (v.status ?? 'submitted') as VolunteerStatus,
                    availability_status: (v.availability_status ?? 'unavailable') as Availability,
                }));

                const mapOrg: Volunteer[] = org.map((o: any) => ({
                    id: `org-${o.volunteer_id ?? o.id ?? o.user_id ?? crypto.randomUUID()}`,
                    name: o.organization_name ?? 'Unnamed Organization',
                    email: o.organization_email ?? '',
                    phone: o.organization_phone_number ?? '',
                    skills: Array.isArray(o.required_skills)
                        ? o.required_skills
                        : o.required_skills
                            ? String(o.required_skills)
                                .split(',')
                                .map((s: string) => s.trim())
                            : [],
                    availability: Array.isArray(o.availability)
                        ? o.availability
                        : o.availability
                            ? String(o.availability)
                                .split(',')
                                .map((s: string) => s.trim())
                            : [],
                    status: (o.status ?? 'submitted') as VolunteerStatus,
                    availability_status: (o.availability_status ?? 'unavailable') as Availability,
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

    // Fetch volunteer areas (programs/events) + build assignment map
    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const data = await listPrograms();

                // 1) Map raw programs to UI areas (assignedVolunteers empty for now)
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
                        currentVolunteers: 0,            // will fill after we fetch assignments
                        location: area.location ?? '',
                        start_at: startISO,
                        end_at: endISO,
                        lifecycle,
                        assignedVolunteers: [],          // will fill after we fetch assignments
                    };
                });

                setAreas(mappedAreas);

                // 2) For each area, fetch assignments and build:
                //    - assignmentMap[areaId] = { "<id>" | "org-<id>": assignmentId }
                //    - assignedKeys = ["<id>", "org-<id>", ...]
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

                // 3) Install assignmentMap for delete operations
                const newAssignmentMap: Record<string, Record<string, number>> = {};
                perArea.forEach(({ id, map }) => {
                    newAssignmentMap[id] = map;
                });
                setAssignmentMap(newAssignmentMap);

                // 4) Update areas to show BOTH individuals and orgs as assigned
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
            } catch (error) {
                console.error('Failed to fetch programs:', error);
            }
        };

        fetchPrograms();
    }, []);

    // ---- Add Program/Event helpers ----
    const addSkillChip = () => {
        const raw = newArea.skillInput.trim();
        if (!raw) return;
        const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...newArea.requiredSkills, ...parts]));
        setNewArea((prev) => ({ ...prev, requiredSkills: merged, skillInput: '' }));
    };

    const removeSkillChip = (skill: string) => {
        setNewArea((prev) => ({ ...prev, requiredSkills: prev.requiredSkills.filter((s) => s !== skill) }));

























































    };

    const handleCreateArea = async () => {
        if (!newArea.name.trim()) return alert('Name is required');
        if (!newArea.location.trim()) return alert('Location is required');
        if (!newArea.start_at || !newArea.end_at) return alert('Start and End are required');
        const mv = Number(newArea.maxVolunteers);
        if (!Number.isFinite(mv) || mv <= 0) return alert('Max volunteers must be a positive number');

        const startISO = toIsoOrNull(newArea.start_at);
        const endISO = toIsoOrNull(newArea.end_at);
        if (!startISO || !endISO) return alert('Invalid date/time');
        if (new Date(endISO) <= new Date(startISO)) return alert('End must be after Start');

        const payload = {
            title: newArea.name.trim(),
            description: newArea.description.trim(),
            location: newArea.location.trim(),
            start_at: startISO!,
            end_at: endISO!,
            task_date: isoToDateOnly(startISO!), // harmless for backend that ignores it
            max_volunteers: mv,
            required_skills: newArea.requiredSkills,
        };

        try {
            const created = await createProgram(payload);
            const reqSkills = Array.isArray(created.required_skills)
                ? created.required_skills
                : created.required_skills
                    ? String(created.required_skills).split(',').map((s: string) => s.trim()).filter(Boolean)
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
            setShowAddModal(false);
            setNewArea({
                name: '',
                description: '',
                location: '',
                start_at: new Date().toISOString().slice(0, 16),
                end_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
                maxVolunteers: '',
                requiredSkills: [],
                skillInput: '',
            });
        } catch (e: any) {
            alert(e?.response?.data?.detail || e?.message || 'Failed to create program');
        }
    };

    return (
        <div className="h-[300vh] bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumb Navigation */}
                <div className="breadcrumb-section" style={{ marginBottom: '16px' }}>
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

                                {/* NEW: Add Program/Event button */}
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Program / Event
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
                                                    title={
                                                        area.currentVolunteers >= area.maxVolunteers
                                                            ? 'Task is full'
                                                            : 'Assign volunteers'
                                                    }
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Assign
                                                </button>
                                            </div>

                                            <div className="mb-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Volunteers Assigned</span>
                                                    <span className={area.currentVolunteers >= area.maxVolunteers ? 'text-red-600' : 'text-gray-600'}>
                                                        {area.currentVolunteers} / {area.maxVolunteers}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all ${area.currentVolunteers >= area.maxVolunteers ? 'bg-red-500' : 'bg-blue-600'
                                                            }`}
                                                        style={{ width: `${Math.min((area.currentVolunteers / area.maxVolunteers) * 100, 100)}%` }}
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
                                                                <div key={volunteerId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
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


                {/* Assignment Modal */}
                {showAssignModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Volunteers</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Select volunteers to assign to {areas.find((a) => a.id === selectedArea)?.name}
                            </p>

                            <div className="max-h-60 overflow-y-auto mb-4">
                                {availableVolunteers.length === 0 ? (
                                    <Empty description="No volunteers to assign" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                ) : (
                                    availableVolunteers.map((volunteer) => (
                                        <label key={volunteer.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedVolunteers.includes(volunteer.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedVolunteers((prev) => [...prev, volunteer.id]);
                                                    } else {
                                                        setSelectedVolunteers((prev) => prev.filter((id) => id !== volunteer.id));
                                                    }
                                                }}
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900">{volunteer.name}</p>
                                                <p className="text-sm text-gray-600">{volunteer.skills.join(', ')}</p>
                                            </div>
                                        </label>
                                    ))
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedVolunteers([]);
                                        setSelectedArea('');
                                    }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAssignVolunteers}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                                    disabled={selectedVolunteers.length === 0}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    Assign {selectedVolunteers.length > 0 && `(${selectedVolunteers.length})`}
                                </button>
                            </div>
                        </div>
                    </div>








































                )}












































                {/* NEW: Add Program/Event Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg w-full max-w-xl p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Program / Event</h3>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                    <input
                                        type="text"
                                        value={newArea.name}
                                        onChange={(e) => setNewArea((prev) => ({ ...prev, name: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Beach Cleanup"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={newArea.description}
                                        onChange={(e) => setNewArea((prev) => ({ ...prev, description: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                        placeholder="Short description of duties"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            value={newArea.location}
                                            onChange={(e) => setNewArea((prev) => ({ ...prev, location: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Beach Park"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                                        <input
                                            type="datetime-local"
                                            value={newArea.start_at}
                                            onChange={(e) => setNewArea((prev) => ({ ...prev, start_at: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Volunteers</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={newArea.maxVolunteers}
                                            onChange={(e) =>
                                                setNewArea((prev) => ({ ...prev, maxVolunteers: e.target.value === '' ? '' : Number(e.target.value) }))
                                            }
                                            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., 6"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">End</label>
                                        <input
                                            type="datetime-local"
                                            value={newArea.end_at}
                                            onChange={(e) => setNewArea((prev) => ({ ...prev, end_at: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>

                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newArea.skillInput}
                                            onChange={(e) => setNewArea((prev) => ({ ...prev, skillInput: e.target.value }))}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ',') {
                                                    e.preventDefault();
                                                    addSkillChip();
                                                }
                                            }}
                                            className="flex-1 border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Type a skill and press Enter"
                                        />
                                        <button
                                            onClick={addSkillChip}
                                            className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200"
                                            type="button"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {newArea.requiredSkills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {newArea.requiredSkills.map((skill) => (
                                                <span key={skill} className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                                                    {skill}
                                                    <button
                                                        className="text-blue-800/70 hover:text-blue-900"
                                                        onClick={() => removeSkillChip(skill)}
                                                        title="Remove"
                                                    >
                                                        ×
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateArea}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                )}















            </div>
        </div>
    );



};

export default VolunteerAssignmentPage;

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { Users, MapPin, Calendar, Search, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';
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
import type { CheckboxOptionType } from "antd";
import { API } from '../../../API_Handler/Axio_API_Handler';
import Swal from 'sweetalert2';

type Availability = 'available' | 'unavailable' | 'assigned';
type TaskLifecycle = 'incoming' | 'ongoing' | 'finished';

interface Volunteer {
    id: string;
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
    start_at: string;
    end_at: string;
    lifecycle: TaskLifecycle;
    assignedVolunteers: string[];
}

interface NewAreaForm {
    name: string;
    description: string;
    location: string;
    start_at: string;
    end_at: string;
    maxVolunteers: number | '';
    requiredSkills: string[];

}

// ✅ Photon API TypeScript types
interface PhotonProperties {
    name?: string;
    country?: string;
    state?: string;
    county?: string;
    city?: string;
    osm_value?: string;
}

interface PhotonFeature {
    properties?: PhotonProperties;
    geometry?: {
        coordinates?: [number, number];
    };
}

interface PhotonResp {
    features?: PhotonFeature[];
}

const skillsOptions: CheckboxOptionType[] = [
    { label: "CPR", value: "CPR" },
    { label: "First Aid", value: "First Aid" },
    { label: "Search & Rescue", value: "Search & Rescue" },
    { label: "Fire Safety", value: "Fire Safety" },
    { label: "Evacuation Assistance", value: "Evacuation Assistance" },
    { label: "Crowd Control", value: "Crowd Control" },
    { label: "Radio Communication", value: "Radio Communication" },
    { label: "Disaster Assessment", value: "Disaster Assessment" },
    { label: "Logistics Management", value: "Logistics Management" },
    { label: "Driving (Emergency Vehicles)", value: "Driving (Emergency Vehicles)" },
    { label: "Medical Assistance", value: "Medical Assistance" },
    { label: "Shelter Management", value: "Shelter Management" },
    { label: "Relief Goods Distribution", value: "Relief Goods Distribution" },
    { label: "Counseling / Psychological First Aid", value: "Counseling / Psychological First Aid" },

];


// ✅ Cebu coordinates for search bias
const CEBU_LAT = 10.3157;
const CEBU_LON = 123.8854;

// ✅ Helper functions
const formatDisplayName = (p: PhotonProperties): string => {
    const parts = [];
    if (p.name) parts.push(p.name);
    if (p.city) parts.push(p.city);
    if (p.county) parts.push(p.county);
    if (p.state) parts.push(p.state);
    return parts.join(", ");
};

const classifyFromPhoton = (osmValue?: string): string => {
    if (!osmValue) return "";
    const lower = osmValue.toLowerCase();
    if (lower.includes("city")) return "City";
    if (lower.includes("municipality")) return "Municipality";
    if (lower.includes("barangay")) return "Barangay";
    return "";
};

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

async function createAssignment(taskId: string | number, volunteerId: string) {
    const volunteerNumericId = Number(rawId(volunteerId));
    const taskIdNum = typeof taskId === 'string' ? Number(taskId) : taskId;

    if (!Number.isFinite(taskIdNum)) throw new Error('Invalid task id');

    const base =
        isOrgId(volunteerId)
            ? { organization_volunteer_id: volunteerNumericId }
            : { individual_volunteer_id: volunteerNumericId };

    const body = { ...base, task_id: taskIdNum };

    try {
        return await apiCreateAssignment(taskIdNum, body);
    } catch (err: any) {
        const raw = err?.response?.data?.detail ?? err?.response?.data ?? err?.message ?? err;
        const msg = typeof raw === 'string' ? raw : JSON.stringify(raw);
        throw new Error(msg);
    }
}

async function fetchAddress(lat: number, lng: number): Promise<string> {
    console.log("🔄 Starting reverse geocoding for:", lat, lng);

    try {
        const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`;
        console.log("📡 Calling Photon reverse:", url);

        const response = await fetch(url);
        console.log("📊 Response status:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("📮 Photon reverse response:", data);

        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const props = feature.properties || {};

            // Build formatted address from properties
            const addressParts = [];

            if (props.name) addressParts.push(props.name);
            if (props.street) addressParts.push(props.street);
            if (props.housenumber) addressParts.push(props.housenumber);
            if (props.city) addressParts.push(props.city);
            else if (props.county) addressParts.push(props.county);
            if (props.state) addressParts.push(props.state);
            if (props.country) addressParts.push(props.country);
            if (props.postcode) addressParts.push(props.postcode);

            const formattedAddress = addressParts.join(", ");
            console.log("📍 Formatted address:", formattedAddress);

            return formattedAddress || props.name || "";
        } else {
            console.warn("⚠️ No features in reverse geocoding response");
            return "";
        }
    } catch (error) {
        console.error("❌ Reverse geocoding failed:", error);
        return "";
    }
}

// ✅ Autocomplete Address Component (Photon API only)
const AutocompleteAddress: React.FC<{
    value: string;
    onPick: (payload: { name: string; lat: number; lng: number; classificationGuess: string }) => void;
    onChange: (name: string) => void;
}> = ({ value, onPick, onChange }) => {
    const [q, setQ] = useState(value);
    const [loading, setLoading] = useState(false);
    const [items, setItems] = useState<PhotonFeature[]>([]);
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const boxRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<number | null>(null);

    useEffect(() => setQ(value), [value]);

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const doSearch = async (term: string) => {
        if (!term || term.trim().length < 2) {
            setItems([]);
            return;
        }
        setLoading(true);
        try {
            const url = new URL("https://photon.komoot.io/api/");
            url.searchParams.set("q", term);
            url.searchParams.set("limit", "8");
            url.searchParams.set("lang", "en");
            url.searchParams.set("lat", String(CEBU_LAT));
            url.searchParams.set("lon", String(CEBU_LON));

            const resp = await fetch(url.toString());
            const data: PhotonResp = await resp.json();

            const filtered = (data.features || []).filter((f) => {
                const p = f.properties || {};
                const isPH = (p.country || "").toLowerCase().includes("philippines");
                const isCebu =
                    (p.state || "").toLowerCase().includes("cebu") ||
                    (p.county || "").toLowerCase().includes("cebu") ||
                    (p.city || "").toLowerCase().includes("cebu");
                return isPH && isCebu;
            });

            setItems(filtered);
            setActiveIndex(0);
            setOpen(true);
        } catch {
            setItems([]);
            setOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const onInputChange = (v: string) => {
        setQ(v);
        onChange(v);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => doSearch(v), 250);
    };

    const commitPick = (f: PhotonFeature) => {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [0, 0];
        const lng = coords[0] || 0;
        const lat = coords[1] || 0;
        const classificationGuess = classifyFromPhoton(p.osm_value) || "";
        const name = p.name || formatDisplayName(p) || "";
        onPick({ name, lat, lng, classificationGuess });
        setQ(name);
        setOpen(false);
    };

    const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        if (!open || items.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % items.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + items.length) % items.length);
        } else if (e.key === "Enter") {
            e.preventDefault();
            commitPick(items[activeIndex]);
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    return (
        <div ref={boxRef} style={{ position: "relative", width: "100%" }}>
            <input
                type="text"
                placeholder="Type program / event location…"
                value={q}
                onChange={(e) => onInputChange(e.target.value)}
                onFocus={() => { if (items.length) setOpen(true); }}
                onKeyDown={onKeyDown}
            />
            {open && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 9999,
                        top: "100%",
                        left: 0,
                        right: 0,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
                        maxHeight: 240,
                        overflowY: "auto",
                    }}
                >
                    {loading && <div style={{ padding: 8, fontSize: 12 }}>Searching…</div>}
                    {!loading && items.length === 0 && (
                        <div style={{ padding: 8, fontSize: 12, color: "#6b7280" }}>No results in Cebu, Philippines</div>
                    )}
                    {!loading &&
                        items.map((f, idx) => {
                            const p = f.properties || {};
                            const label = formatDisplayName(p);
                            const isActive = idx === activeIndex;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => commitPick(f)}
                                    style={{
                                        display: "block",
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "8px 10px",
                                        background: isActive ? "#f3f4f6" : "transparent",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: 14,
                                    }}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                >
                                    <div style={{ fontWeight: 600 }}>{p.name || label}</div>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                                        {label}
                                        {p.osm_value ? ` • ${p.osm_value}` : ""}
                                    </div>
                                </button>
                            );
                        })}
                </div>
            )}
        </div>
    );
};

const hasMatchingSkills = (volunteerSkills: string[], requiredSkills: string[]): boolean => {
    if (requiredSkills.length === 0) return true; // No skills required
    return volunteerSkills.some(skill =>
        requiredSkills.some(reqSkill =>
            skill.toLowerCase().trim() === reqSkill.toLowerCase().trim()
        )
    );
};

/**
 * Check if two date ranges overlap
 */
const doDateRangesOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
): boolean => {
    const e1start = new Date(start1).getTime();
    const e1end = new Date(end1).getTime();
    const e2start = new Date(start2).getTime();
    const e2end = new Date(end2).getTime();

    return (e1start < e2end && e1end > e2start);
};

const hasOverlappingAssignment = (
    volunteerId: string,
    newStart: string,
    newEnd: string,
    areas: VolunteerArea[],
    currentAreaId?: string
): boolean => {
    return areas.some(area => {
        // Skip the current area being checked
        if (area.id === currentAreaId) return false;

        // Check if volunteer is assigned to this area
        if (!area.assignedVolunteers.includes(volunteerId)) return false;

        // Check if dates overlap
        return doDateRangesOverlap(area.start_at, area.end_at, newStart, newEnd);
    });
};

const VolunteerAssignmentPage: React.FC = () => {
    const [areas, setAreas] = useState<VolunteerArea[]>([]);
    const [selectedArea, setSelectedArea] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [assignmentMap, setAssignmentMap] = useState<Record<string, Record<string, number>>>({});
    const [showAddModal, setShowAddModal] = useState(false);
    const [newArea, setNewArea] = useState<NewAreaForm>({
        name: '',
        description: '',
        location: '',
        start_at: new Date().toISOString().slice(0, 16),
        end_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
        maxVolunteers: '',
        requiredSkills: [],
    });
    const [validationWarnings, setValidationWarnings] = useState<{
        volunteerId: string;
        warnings: string[];
    }[]>([]);

    const filteredVolunteers = volunteers.filter(
        (v) =>
            v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const availableVolunteers = useMemo(() => {
        if (!selectedArea) {
            // If no area is selected, show all approved volunteers
            return filteredVolunteers.filter((v) => v.status === 'approved');
        }

        const selectedAreaData = areas.find(a => a.id === selectedArea);
        if (!selectedAreaData) {
            return filteredVolunteers.filter((v) => v.status === 'approved');
        }

        // Filter volunteers who:
        // 1. Are approved
        // 2. Don't have overlapping assignments with the selected area
        return filteredVolunteers.filter((v) => {
            // Must be approved
            if (v.status !== 'approved') return false;

            // Check if volunteer has overlapping assignments
            const hasOverlap = hasOverlappingAssignment(
                v.id,
                selectedAreaData.start_at,
                selectedAreaData.end_at,
                areas,
                selectedAreaData.id
            );

            // Include volunteer if they DON'T have an overlap
            return !hasOverlap;
        });
    }, [filteredVolunteers, selectedArea, areas]);

    const activeAreas = useMemo(() => {
        return areas
            .filter(a => a.lifecycle === 'incoming' || a.lifecycle === 'ongoing')
            .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
    }, [areas]);

    const getVolunteerValidation = (volunteerId: string): string[] => {
        if (!selectedArea) return [];

        const area = areas.find(a => a.id === selectedArea);
        if (!area) return [];

        const volunteer = volunteers.find(v => v.id === volunteerId);
        if (!volunteer) return [];

        const warnings: string[] = [];

        // Check skill mismatch
        if (!hasMatchingSkills(volunteer.skills, area.requiredSkills)) {
            warnings.push(`Missing required skills: ${area.requiredSkills.join(', ')}`);
        }

        // Check overlapping assignments
        if (hasOverlappingAssignment(volunteerId, area.start_at, area.end_at, areas, area.id)) {
            warnings.push('Has overlapping assignment during this time');
        }

        return warnings;
    };

    const handleAssignVolunteers = async () => {
        if (!selectedArea || selectedVolunteers.length === 0) return;

        const area = areas.find(a => a.id === selectedArea);
        if (!area) return;

        // Validate all selected volunteers
        const validationErrors: { volunteerId: string; warnings: string[] }[] = [];

        selectedVolunteers.forEach(volId => {
            const warnings = getVolunteerValidation(volId);
            if (warnings.length > 0) {
                validationErrors.push({ volunteerId: volId, warnings });
            }
        });

        // If there are validation errors, show confirmation dialog
        if (validationErrors.length > 0) {
            const volunteerNames = validationErrors.map(err => {
                const vol = volunteers.find(v => v.id === err.volunteerId);
                return `<li style="text-align: left; margin: 5px 0;"><strong>${vol?.name}:</strong> ${err.warnings.join(', ')}</li>`;
            }).join('\n');

            const result = await Swal.fire({
                title: '⚠️ Warning',
                html: `<div style="text-align: left;">
                    <p>The following volunteers have issues:</p>
                    <ul style="padding-left: 20px; margin: 10px 0;">
                        ${volunteerNames}
                    </ul>
                    <p>Do you want to proceed anyway?</p>
                </div>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, proceed',
                cancelButtonText: 'No, cancel',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
            });

            if (!result.isConfirmed) return;
        }

        const areaId = String(selectedArea);

        const results = await Promise.allSettled(
            selectedVolunteers.map(async (volId) => {
                const assignment = await createAssignment(areaId, volId);
                return { volId, assignment };
            })
        );

        const failed: string[] = [];
        results.forEach((r) => {
            if (r.status === 'fulfilled') {
                const { volId, assignment } = r.value as { volId: string; assignment: AssignmentDTO };

                setAssignmentMap((prev) => ({
                    ...prev,
                    [areaId]: { ...(prev[areaId] || {}), [volId]: assignment.id },
                }));

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
            await Swal.fire({
                title: 'Assignment Failed',
                html: `<div style="text-align: left;">
                    <p>Some assignments failed:</p>
                    <ul style="padding-left: 20px;">
                        ${failed.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        } else {
            await Swal.fire({
                title: 'Success!',
                text: `Successfully assigned ${selectedVolunteers.length} volunteer(s)`,
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        }

        setSelectedVolunteers([]);
        setShowAssignModal(false);
        setSelectedArea('');
        setValidationWarnings([]);
    };

    const handleRemoveVolunteer = async (areaId: string, volunteerId: string) => {
        let assignmentId = assignmentMap[areaId]?.[volunteerId];

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
            await Swal.fire({
                title: 'Error',
                text: "Couldn't find the assignment ID for this volunteer. Try reloading the page.",
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: 'Do you want to unassign this volunteer?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, unassign',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
        });

        if (!result.isConfirmed) return;

        try {
            await apiDeleteAssignment(assignmentId);
            await Swal.fire({
                title: 'Unassigned!',
                text: 'Volunteer has been unassigned successfully.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || 'Delete failed';
            await Swal.fire({
                title: 'Error',
                text: msg,
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

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
                        currentVolunteers: 0,
                        location: area.location ?? '',
                        start_at: startISO,
                        end_at: endISO,
                        lifecycle,
                        assignedVolunteers: [],
                    };
                });

                setAreas(mappedAreas);

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

                const newAssignmentMap: Record<string, Record<string, number>> = {};
                perArea.forEach(({ id, map }) => {
                    newAssignmentMap[id] = map;
                });
                setAssignmentMap(newAssignmentMap);

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


    const removeSkillChip = (skill: string) => {
        setNewArea((prev) => ({ ...prev, requiredSkills: prev.requiredSkills.filter((s) => s !== skill) }));
    };

    const handleCreateArea = async () => {
        if (!newArea.name.trim()) {
            await Swal.fire({
                title: 'Validation Error',
                text: 'Name is required',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!newArea.location.trim()) {
            await Swal.fire({
                title: 'Validation Error',
                text: 'Location is required',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!newArea.start_at || !newArea.end_at) {
            await Swal.fire({
                title: 'Validation Error',
                text: 'Start and End dates are required',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        const mv = Number(newArea.maxVolunteers);
        if (!Number.isFinite(mv) || mv <= 0) {
            await Swal.fire({
                title: 'Validation Error',
                text: 'Max volunteers must be a positive number',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (!Number.isFinite(mv) || mv <= 0) return alert('Max volunteers must be a positive number');

        const startISO = toIsoOrNull(newArea.start_at);
        const endISO = toIsoOrNull(newArea.end_at);
        if (!startISO || !endISO) {
            await Swal.fire({
                title: 'Validation Error',
                text: 'Invalid datetime',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (new Date(endISO) <= new Date(startISO)) {
            await Swal.fire({
                title: 'Validation Error',
                text: 'End must be after Start',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        const payload = {
            title: newArea.name.trim(),
            description: newArea.description.trim(),
            location: newArea.location.trim(),
            start_at: startISO!,
            end_at: endISO!,
            task_date: isoToDateOnly(startISO!),
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

            await Swal.fire({
                title: 'Success!',
                text: 'Program/Event created successfully',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
            setShowAddModal(false);
            setNewArea({
                name: '',
                description: '',
                location: '',
                start_at: new Date().toISOString().slice(0, 16),
                end_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
                maxVolunteers: '',
                requiredSkills: [],
            });
        } catch (e: any) {
            await Swal.fire({
                title: 'Error',
                text: e?.response?.data?.detail || e?.message || 'Failed to create program',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    return (
        <div className="h-[300vh] bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
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
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Volunteer Areas
                                </h2>

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

                {showAssignModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Volunteers</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Select volunteers to assign to {areas.find((a) => a.id === selectedArea)?.name}
                            </p>

                            {/* Show required skills */}
                            {selectedArea && (areas.find(a => a.id === selectedArea)?.requiredSkills?.length ?? 0) > 0 && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                    <p className="text-sm font-medium text-blue-900 mb-1">Required Skills:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {areas.find(a => a.id === selectedArea)?.requiredSkills.map((skill) => (
                                            <span key={skill} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="max-h-96 overflow-y-auto mb-4 space-y-2">
                                {availableVolunteers.length === 0 ? (
                                    <Empty description="No volunteers to assign" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                ) : (
                                    availableVolunteers.map((volunteer) => {
                                        const warnings = getVolunteerValidation(volunteer.id);
                                        const hasWarnings = warnings.length > 0;

                                        return (
                                            <div
                                                key={volunteer.id}
                                                className={`border rounded-md ${hasWarnings ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}
                                            >
                                                <label className="flex items-start p-3 cursor-pointer gap-3">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 mt-1 flex-shrink-0"
                                                        checked={selectedVolunteers.includes(volunteer.id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedVolunteers((prev) => [...prev, volunteer.id]);
                                                            } else {
                                                                setSelectedVolunteers((prev) => prev.filter((id) => id !== volunteer.id));
                                                            }
                                                        }}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-gray-900">{volunteer.name}</p>
                                                            {hasWarnings && (
                                                                <span className="text-yellow-600 text-xs">⚠️</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-1">
                                                            Skills: {volunteer.skills.join(', ') || 'None'}
                                                        </p>
                                                        {hasWarnings && (
                                                            <div className="mt-1 space-y-1">
                                                                {warnings.map((warning, idx) => (
                                                                    <p key={idx} className="text-xs text-yellow-700 flex items-start gap-1">
                                                                        <span>⚠</span>
                                                                        <span>{warning}</span>
                                                                    </p>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedVolunteers([]);
                                        setSelectedArea('');
                                        setValidationWarnings([]);
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

                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-lg w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
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

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <AutocompleteAddress
                                        value={newArea.location}
                                        onChange={(name) => setNewArea((prev) => ({ ...prev, location: name }))}
                                        onPick={async ({ name, lat, lng, classificationGuess }) => {
                                            console.log("✅ Selected from dropdown:", name);
                                            console.log("📍 Coordinates:", lat, lng);

                                            // ✅ Fetch formal address from Photon reverse geocoding
                                            const formalAddress = await fetchAddress(lat, lng);
                                            console.log("📮 Formal address:", formalAddress);

                                            setNewArea((prev) => ({
                                                ...prev,
                                                location: formalAddress || name, // Use formal address or fallback to name
                                            }));
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Start</label>
                                        <input
                                            type="datetime-local"
                                            value={newArea.start_at}
                                            onChange={(e) => setNewArea((prev) => ({ ...prev, start_at: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                                {/* ✅ UPDATED: Checkbox-based skill selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>

                                    {/* Checkbox grid */}
                                    <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
                                        <div className="grid grid-cols-2 gap-2">
                                            {skillsOptions.map((option) => (
                                                <label
                                                    key={option.value}
                                                    className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        value={option.value}
                                                        checked={newArea.requiredSkills.includes(String(option.value))}
                                                        onChange={(e) => {
                                                            const skillValue = String(option.value);
                                                            if (e.target.checked) {
                                                                setNewArea((prev) => ({
                                                                    ...prev,
                                                                    requiredSkills: [...prev.requiredSkills, skillValue]
                                                                }));
                                                            } else {
                                                                setNewArea((prev) => ({
                                                                    ...prev,
                                                                    requiredSkills: prev.requiredSkills.filter(s => s !== skillValue)
                                                                }));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700">{option.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Selected skills display */}
                                    {newArea.requiredSkills.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {newArea.requiredSkills.map((skill) => (
                                                <span key={skill} className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs">
                                                    {skill}
                                                    <button
                                                        className="text-blue-800/70 hover:text-blue-900"
                                                        onClick={() => {
                                                            setNewArea((prev) => ({
                                                                ...prev,
                                                                requiredSkills: prev.requiredSkills.filter((s) => s !== skill)
                                                            }));
                                                        }}
                                                        title="Remove"
                                                        type="button"
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

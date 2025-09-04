import React, { useEffect, useState } from 'react';
import { Users, MapPin, Calendar, Search, Plus, Trash2, CheckCircle } from 'lucide-react';
import { getAllVolunteers } from '../../../API_Handler/individual_volunter_handler';
import { getAllOrganizationVolunteers } from '../../../API_Handler/organization_volunteer_handler';
import { createProgram } from '../../../API_Handler/assignment_handler';
import { Breadcrumb } from 'antd';
import { Link } from "react-router-dom";

type VolunteerStatus = 'pending' | 'submitted' | 'verifying' | 'approved' | 'rejected' | 'assigned';

interface Volunteer {
    id: string;
    name: string;
    email: string;
    phone: string;
    skills: string[];
    availability: string[];
    status: VolunteerStatus;
}

interface VolunteerArea {
    id: string;
    name: string;
    description: string;
    requiredSkills: string[];
    maxVolunteers: number;
    currentVolunteers: number;
    location: string;
    date: string;
    assignedVolunteers: string[];
}

interface NewAreaForm {
    name: string;
    description: string;
    location: string;
    date: string; // YYYY-MM-DD
    maxVolunteers: number | '';
    requiredSkills: string[];
    skillInput: string;
}

const VolunteerAssignmentPage: React.FC = () => {
    const [areas, setAreas] = useState<VolunteerArea[]>([
        {
            id: '1',
            name: 'Event Registration',
            description: 'Check-in attendees and distribute materials',
            requiredSkills: ['Registration', 'Communication'],
            maxVolunteers: 4,
            currentVolunteers: 1,
            location: 'Main Entrance',
            date: '2025-08-25',
            assignedVolunteers: ['3']
        },
        {
            id: '2',
            name: 'Food & Beverage',
            description: 'Serve food and manage catering area',
            requiredSkills: ['Food Service', 'Cleanup'],
            maxVolunteers: 6,
            currentVolunteers: 0,
            location: 'Dining Hall',
            date: '2025-08-25',
            assignedVolunteers: []
        },
        {
            id: '3',
            name: 'Event Setup',
            description: 'Setup chairs, tables, and decorations',
            requiredSkills: ['Event Setup', 'Setup'],
            maxVolunteers: 8,
            currentVolunteers: 0,
            location: 'Main Hall',
            date: '2025-08-24',
            assignedVolunteers: []
        }
    ]);

    const [selectedArea, setSelectedArea] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    // NEW: Add Program/Event modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [newArea, setNewArea] = useState<NewAreaForm>({
        name: '',
        description: '',
        location: '',
        date: new Date().toISOString().slice(0, 10), // today
        maxVolunteers: '',
        requiredSkills: [],
        skillInput: ''
    });

    const filteredVolunteers = volunteers.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // ✅ approved only
    const approvedVolunteers = filteredVolunteers.filter(v => v.status === 'approved');

    const handleAssignVolunteers = () => {
        if (!selectedArea || selectedVolunteers.length === 0) return;

        setAreas(prev => prev.map(area => {
            if (area.id === selectedArea) {
                const newAssigned = [...area.assignedVolunteers, ...selectedVolunteers];
                return {
                    ...area,
                    assignedVolunteers: newAssigned,
                    currentVolunteers: newAssigned.length
                };
            }
            return area;
        }));

        setSelectedVolunteers([]);
        setShowAssignModal(false);
        setSelectedArea('');
    };

    const handleRemoveVolunteer = (areaId: string, volunteerId: string) => {
        setAreas(prev => prev.map(area => {
            if (area.id === areaId) {
                const newAssigned = area.assignedVolunteers.filter(id => id !== volunteerId);
                return {
                    ...area,
                    assignedVolunteers: newAssigned,
                    currentVolunteers: newAssigned.length
                };
            }
            return area;
        }));
    };

    const getVolunteerById = (id: string) => volunteers.find(v => v.id === id);

    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                setLoading(true);

                const [indivResp, orgResp] = await Promise.all([
                    getAllVolunteers(),
                    getAllOrganizationVolunteers(),
                ]);

                const toArray = (resp: any): any[] =>
                    Array.isArray(resp) ? resp
                        : Array.isArray(resp?.data) ? resp.data
                            : Array.isArray(resp?.results) ? resp.results
                                : [];

                const indiv = toArray(indivResp);
                const org = toArray(orgResp);

                const mapIndiv: Volunteer[] = indiv.map((v: any) => ({
                    id: String(v.volunteer_id ?? v.id ?? v.user_id ?? crypto.randomUUID()),
                    name: [v.first_name, v.middle_name, v.last_name].filter(Boolean).join(' ') || 'Unnamed',
                    email: v.email ?? '',
                    phone: v.phone_number ?? '',
                    skills: Array.isArray(v.skills) ? v.skills :
                        (v.skills ? String(v.skills).split(',').map((s: string) => s.trim()) : []),
                    availability: Array.isArray(v.availability) ? v.availability :
                        (v.availability ? String(v.availability).split(',').map((s: string) => s.trim()) : []),
                    status: (v.status ?? 'submitted') as VolunteerStatus,
                }));

                const mapOrg: Volunteer[] = org.map((o: any) => ({
                    id: `org-${o.volunteer_id ?? o.id ?? o.user_id ?? crypto.randomUUID()}`,
                    name: o.organization_name ?? 'Unnamed Organization',
                    email: o.organization_email ?? '',
                    phone: o.organization_phone_number ?? '',
                    skills: Array.isArray(o.required_skills) ? o.required_skills :
                        (o.required_skills ? String(o.required_skills).split(',').map((s: string) => s.trim()) : []),
                    availability: Array.isArray(o.availability) ? o.availability :
                        (o.availability ? String(o.availability).split(',').map((s: string) => s.trim()) : []),
                    status: (o.status ?? 'submitted') as VolunteerStatus,
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

    // ---- Add Program/Event helpers ----
    const addSkillChip = () => {
        const raw = newArea.skillInput.trim();
        if (!raw) return;
        const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
        const merged = Array.from(new Set([...newArea.requiredSkills, ...parts]));
        setNewArea(prev => ({ ...prev, requiredSkills: merged, skillInput: '' }));
    };

    const removeSkillChip = (skill: string) => {
        setNewArea(prev => ({ ...prev, requiredSkills: prev.requiredSkills.filter(s => s !== skill) }));
    };

    const handleCreateArea = async () => {
        if (!newArea.name.trim()) return alert('Name is required');
        if (!newArea.location.trim()) return alert('Location is required');
        if (!newArea.date) return alert('Date is required');
        const mv = Number(newArea.maxVolunteers);
        if (!Number.isFinite(mv) || mv <= 0) return alert('Max volunteers must be a positive number');

        const payload = {
            title: newArea.name.trim(),
            description: newArea.description.trim(),
            location: newArea.location.trim(),
            task_date: newArea.date,
            max_volunteers: mv,
            required_skills: newArea.requiredSkills
        };

        try {
            const created = await createProgram(payload);
            // normalize the response into your local "areas" shape
            setAreas(prev => [{
                id: String(created.id),
                name: created.title,
                description: created.description,
                requiredSkills: created.required_skills ?? [],
                maxVolunteers: created.max_volunteers,
                currentVolunteers: 0,
                location: created.location,
                date: created.task_date,
                assignedVolunteers: []
            }, ...prev]);
            setShowAddModal(false);
            setNewArea({
                name: '',
                description: '',
                location: '',
                date: new Date().toISOString().slice(0, 10),
                maxVolunteers: '',
                requiredSkills: [],
                skillInput: ''
            });
        } catch (e: any) {
            alert(e?.response?.data?.detail || 'Failed to create program');
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
                            <Link to="/volunteer_management/volunteer_dashboard">
                                Volunteer Dashboard
                            </Link>
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
                                {areas.map(area => (
                                    <div key={area.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                                                <p className="text-gray-600 text-sm mb-2">{area.description}</p>
                                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-4 h-4" />
                                                        {area.location}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        {new Date(area.date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setSelectedArea(area.id);
                                                    setShowAssignModal(true);
                                                }}
                                                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
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
                                                    className={`h-2 rounded-full transition-all ${area.currentVolunteers >= area.maxVolunteers ? 'bg-red-500' : 'bg-blue-600'}`}
                                                    style={{ width: `${Math.min((area.currentVolunteers / area.maxVolunteers) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <p className="text-sm font-medium text-gray-700 mb-1">Required Skills:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {area.requiredSkills.map(skill => (
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
                                                    {area.assignedVolunteers.map(volunteerId => {
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
                                ))}
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
                                    {approvedVolunteers.map(volunteer => (
                                        <div key={volunteer.id} className="border border-gray-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium text-gray-900">{volunteer.name}</h3>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${volunteer.status === 'approved'
                                                            ? 'bg-green-100 text-green-800'
                                                            : volunteer.status === 'assigned'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    {volunteer.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-2">{volunteer.email}</p>
                                            <div className="mb-2">
                                                <p className="text-xs text-gray-500 mb-1">Skills:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {volunteer.skills.map(skill => (
                                                        <span key={skill} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Availability:</p>
                                                <p className="text-xs text-gray-600">{volunteer.availability.join(', ')}</p>
                                            </div>
                                        </div>
                                    ))}
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
                                Select volunteers to assign to {areas.find(a => a.id === selectedArea)?.name}
                            </p>

                            <div className="max-h-60 overflow-y-auto mb-4">
                                {approvedVolunteers.map(volunteer => (
                                    <label key={volunteer.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-[10%]"
                                            checked={selectedVolunteers.includes(volunteer.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedVolunteers(prev => [...prev, volunteer.id]);
                                                } else {
                                                    setSelectedVolunteers(prev => prev.filter(id => id !== volunteer.id));
                                                }
                                            }}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">{volunteer.name}</p>
                                            <p className="text-sm text-gray-600">{volunteer.skills.join(', ')}</p>
                                        </div>
                                    </label>
                                ))}
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
                                        onChange={(e) => setNewArea(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Food & Beverage"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={newArea.description}
                                        onChange={(e) => setNewArea(prev => ({ ...prev, description: e.target.value }))}
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
                                            onChange={(e) => setNewArea(prev => ({ ...prev, location: e.target.value }))}
                                            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., Dining Hall"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            type="date"
                                            value={newArea.date}
                                            onChange={(e) => setNewArea(prev => ({ ...prev, date: e.target.value }))}
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
                                                setNewArea(prev => ({ ...prev, maxVolunteers: e.target.value === '' ? '' : Number(e.target.value) }))
                                            }
                                            className="w-full border border-gray-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g., 6"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newArea.skillInput}
                                            onChange={(e) => setNewArea(prev => ({ ...prev, skillInput: e.target.value }))}
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
                                            {newArea.requiredSkills.map(skill => (
                                                <span
                                                    key={skill}
                                                    className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs"
                                                >
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
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                                >
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

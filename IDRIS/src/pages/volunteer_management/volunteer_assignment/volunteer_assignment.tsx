import React, { useEffect, useState } from 'react';
import { Users, MapPin, Calendar, Search, Plus, Edit3, Trash2, CheckCircle } from 'lucide-react';
import { getAllVolunteers } from '../../../API_Handler/individual_volunter_handler';
import { getAllOrganizationVolunteers } from '../../../API_Handler/organization_volunteer_handler';

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
                    status: (v.status ?? 'submitted') as VolunteerStatus,   // <-- use backend value
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
                setVolunteers([]); // keep state predictable
            } finally {
                setLoading(false);
            }
        };

        fetchVolunteers();
    }, []);


    return (
        <div className="h-[300vh] bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Volunteer Assignment Management</h1>
                    <p className="text-gray-600">Assign volunteers to specific areas and manage volunteer schedules</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Volunteer Areas */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    Volunteer Areas
                                </h2>
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
                                                    className={`h-2 rounded-full transition-all ${area.currentVolunteers >= area.maxVolunteers ? 'bg-red-500' : 'bg-blue-600'
                                                        }`}
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
                                                <span className={`px-2 py-1 rounded-full text-xs ${volunteer.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    volunteer.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-gray-100 text-gray-800'
                                                    }`}>
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
            </div>
        </div>
    );
};

export default VolunteerAssignmentPage;

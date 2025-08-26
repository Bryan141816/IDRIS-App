import React, { useState, useEffect } from 'react';
import { Button, Breadcrumb, Input, Spin, message, Modal, Descriptions, Divider, Tag } from 'antd';
import DataTable, { TableColumn } from 'react-data-table-component';
import './css/ManageApplicant.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { getAllVolunteers, updateVolunteerStatus } from '../../../API_Handler/individual_volunter_handler';
import { getAllOrganizationVolunteers } from '../../../API_Handler/organization_volunteer_handler';
import { updateVolunteer } from '../../../API_Handler/individual_volunter_handler';


type VolunteerStatus = 'pending' | 'submitted' | 'verifying' | 'approved' | 'rejected';
// Define the volunteer data interface (matching your backend schema)
interface Volunteer {
    volunteer_id: number;
    user_id: number;

    // For individual volunteers
    first_name?: string;
    middle_name?: string;
    last_name?: string;

    // For organization volunteers
    organization_name?: string;
    organization_email?: string;
    organization_phone_number?: string;
    organization_address?: string; // if you have this field
    contact_person_name?: string; // if you have this field
    contact_person_email?: string; // if you have this field
    contact_person_position?: string; // if you have this field
    contact_person_phone_number?: string; // if you have this field
    // Common fields
    email?: string;
    phone_number?: string;
    address?: string;
    birthday?: string;
    gender?: string;
    age?: number;
    availability?: string;
    medical_conditions?: string;
    other_medical_conditions?: string;
    certification?: string; // keep as-is; will show in certificates section if present
    created_at?: string;
    status?: VolunteerStatus;
}

const ManageApplicant: React.FC = () => {
    const navigate = useNavigate();

    // State management
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>('');
    const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

    // NEW: modal state
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const show = (v?: string | number | null) => (v === undefined || v === null || v === '' ? 'N/A' : String(v));

    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                setLoading(true);

                const individualData = await getAllVolunteers();
                const orgData = await getAllOrganizationVolunteers();

                // Normalize org data so it fits Volunteer interface
                const mappedOrgData: Volunteer[] = (orgData || []).map((org: any) => ({
                    ...org,
                    // keep original org fields
                    organization_name: org.organization_name,
                    organization_email: org.organization_email,
                    organization_phone_number: org.organization_phone_number,
                    organization_address: org.organization_address,
                    contact_person_name: org.contact_person_name,
                    contact_person_email: org.contact_person_email,
                    contact_person_position: org.contact_person_position,
                    contact_person_phone_number: org.contact_person_phone_number,
                    // also map to common fields for table display/search
                    first_name: org.organization_name, // to show name in the table column
                    email: org.organization_email,
                    phone_number: org.organization_phone_number,
                    address: org.organization_address ?? org.address,
                }));

                const allData: Volunteer[] = [...(individualData || []), ...mappedOrgData];

                setVolunteers(allData);
                if (allData.length > 0) {
                    setSelectedVolunteer(allData[0]);
                }
            } catch (error) {
                console.error('Error fetching volunteers:', error);
                message.error('Failed to load volunteers data');
            } finally {
                setLoading(false);
            }
        };

        fetchVolunteers();
    }, []);

    const middleInitial =
        selectedVolunteer?.middle_name ? selectedVolunteer.middle_name.charAt(0) + '. ' : '';

    // Individual full name
    const getFullName = (v: Volunteer): string => {
        const parts = [v.first_name, v.middle_name, v.last_name];
        return parts.filter(Boolean).join(' ');
    };

    const getFullNamewMid = (v: Volunteer): string => {
        const parts = [v.first_name, v === selectedVolunteer ? middleInitial : v.middle_name, v.last_name];
        return parts.filter(Boolean).join(' ');
    };

    // Unified display name
    const getDisplayName = (v: Volunteer): string => {
        if (v.organization_name) return v.organization_name;
        const name = getFullName(v);
        return name || '—';
    };

    const formatDate = (dateString?: string): string => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
        } catch {
            return dateString;
        }
    };

    const showAlert = (): void => {
        Swal.fire({
            title: 'You have successfully accepted the applicant.',
            icon: 'success',
            confirmButtonColor: '#749AB6',
            width: '380px',
            showConfirmButton: false,
            customClass: {
                popup: 'custom-height-modal',
                title: 'custom-swal-title',
                htmlContainer: 'custom-swal-text',
                confirmButton: 'custom-swal-button',
                icon: 'custom-swal-icon',
            },
        });
    };

    const handleDelete = (volunteerId: number): void => {
        const swalWithCustomButtons = Swal.mixin({
            customClass: {
                popup: 'custom-swal-popup',
                confirmButton: 'my-confirm-button',
                cancelButton: 'my-cancel-button',
            },
            buttonsStyling: false,
        });

        swalWithCustomButtons
            .fire({
                title: 'Are you sure you want to decline this applicant?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, decline it!',
                cancelButtonText: 'No, cancel!',
                reverseButtons: true,
                width: '380px',
            })
            .then((result: SweetAlertResult) => {
                if (result.isConfirmed) {
                    swalWithCustomButtons.fire({
                        title: 'Deleted!',
                        text: 'Applicant has been deleted.',
                        icon: 'success',
                        width: '380px',
                    });

                    setVolunteers((prev) => prev.filter((v) => v.volunteer_id !== volunteerId));

                    if (selectedVolunteer?.volunteer_id === volunteerId) {
                        const remaining = volunteers.filter((v) => v.volunteer_id !== volunteerId);
                        setSelectedVolunteer(remaining.length > 0 ? remaining[0] : null);
                    }
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    swalWithCustomButtons.fire({
                        title: 'Cancelled',
                        text: "The applicant's application has been cancelled.",
                        icon: 'error',
                        width: '380px',
                    });
                }
            });
    };

    // Filtered list (safe + org fields)
    const filteredVolunteers: Volunteer[] = volunteers.filter((v: Volunteer) => {
        const searchLower = searchText.toLowerCase();
        const displayName = getDisplayName(v).toLowerCase();
        const email = (v.email || v.organization_email || '').toLowerCase();
        const phone = (v.phone_number || v.organization_phone_number || '').toString();

        return (
            displayName.includes(searchLower) ||
            email.includes(searchLower) ||
            phone.includes(searchText)
        );
    });

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchText(e.target.value);
    };

    const handleRowClick = (row: Volunteer): void => {
        setSelectedVolunteer(row);
    };

    // UPDATED: Show modal instead of navigating
    const handleViewCredentials = async (): Promise<void> => {
        if (!selectedVolunteer) return;

        // Only move to verifying from pending/submitted; skip if already final
        const allowedFrom = new Set(['pending', 'submitted', undefined]);
        if (!allowedFrom.has(selectedVolunteer.status as any)) {
            setIsModalOpen(true);
            return;
        }

        const id = selectedVolunteer.volunteer_id;
        const prevStatus = selectedVolunteer.status;
        const nextStatus: Volunteer['status'] = 'verifying';

        // Optimistic UI
        setVolunteers(prev =>
            prev.map(v => v.volunteer_id === id ? { ...v, status: nextStatus } : v)
        );
        setSelectedVolunteer({ ...selectedVolunteer, status: nextStatus });
        setIsModalOpen(true);

        try {
            await updateVolunteerStatus(id, 'verifying');
        } catch (err: any) {
            // Roll back on failure
            setVolunteers(prev =>
                prev.map(v => v.volunteer_id === id ? { ...v, status: prevStatus } : v)
            );
            setSelectedVolunteer({ ...selectedVolunteer, status: prevStatus });
            message.error(err?.message || 'Failed to set status to verifying.');
        }
    };

    const acceptVolunteer = async (volunteer: Volunteer) => {
        const id = volunteer.volunteer_id;
        const prevStatus = volunteer.status;

        // Only allow from verifying (and optionally from submitted/pending if you want)
        const allowedFrom = new Set<VolunteerStatus>(['verifying']);
        if (!allowedFrom.has((prevStatus as VolunteerStatus) ?? 'pending')) {
            message.warning('Only applications in "verifying" can be accepted.');
            return;
        }

        // Optimistic UI
        setVolunteers(prev => prev.map(v => v.volunteer_id === id ? { ...v, status: 'approved' } : v));
        if (selectedVolunteer?.volunteer_id === id) {
            setSelectedVolunteer({ ...volunteer, status: 'approved' });
        }

        try {
            await updateVolunteerStatus(id, 'approved');
            showAlert(); // your existing success alert
        } catch (err: any) {
            // Roll back
            setVolunteers(prev => prev.map(v => v.volunteer_id === id ? { ...v, status: prevStatus } : v));
            if (selectedVolunteer?.volunteer_id === id) {
                setSelectedVolunteer({ ...volunteer, status: prevStatus });
            }
            message.error(err?.message || 'Failed to accept applicant.');
        }
    };

    const handleAcceptClick = async (
        e: React.MouseEvent<HTMLSpanElement>,
        volunteer: Volunteer
    ) => {
        e.preventDefault();
        e.stopPropagation();
        await acceptVolunteer(volunteer);
    };

    const handleDeclineClick = (
        e: React.MouseEvent<HTMLSpanElement>,
        volunteer: Volunteer
    ): void => {
        e.preventDefault();
        e.stopPropagation();

        const swalWithCustomButtons = Swal.mixin({
            customClass: {
                popup: 'custom-swal-popup',
                confirmButton: 'my-confirm-button',
                cancelButton: 'my-cancel-button',
            },
            buttonsStyling: false,
        });

        swalWithCustomButtons.fire({
            title: 'Are you sure you want to decline this applicant?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, decline it!',
            cancelButtonText: 'No, cancel!',
            reverseButtons: true,
            width: '380px',
        }).then(async (result: SweetAlertResult) => {
            if (!result.isConfirmed) return;

            const prevStatus = volunteer.status; // remember for rollback
            // 1) optimistic UI
            setVolunteers(prev =>
                prev.map(v =>
                    v.volunteer_id === volunteer.volunteer_id ? { ...v, status: 'rejected' } : v
                )
            );
            if (selectedVolunteer?.volunteer_id === volunteer.volunteer_id) {
                setSelectedVolunteer({ ...volunteer, status: 'rejected' });
            }

            try {
                // 2) API call — you can send an empty FormData and just pass the status param
                const fd = new FormData();
                await updateVolunteerStatus(volunteer.volunteer_id, 'rejected');

                swalWithCustomButtons.fire({
                    title: 'Declined!',
                    text: 'Applicant has been marked as rejected.',
                    icon: 'success',
                    width: '380px',
                });
            } catch (err: any) {
                // 3) rollback on error
                setVolunteers(prev =>
                    prev.map(v =>
                        v.volunteer_id === volunteer.volunteer_id ? { ...v, status: prevStatus } : v
                    )
                );
                if (selectedVolunteer?.volunteer_id === volunteer.volunteer_id) {
                    setSelectedVolunteer({ ...volunteer, status: prevStatus });
                }
                message.error(err?.message || 'Failed to update status. Please try again.');
            }
        });
    };
    const columns: TableColumn<Volunteer>[] = [
        {
            name: 'No.',
            selector: (_row: Volunteer, index?: number) => (index || 0) + 1,
            sortable: true,
            width: '70px',
        },
        {
            name: 'Name / Organization',
            selector: (row: Volunteer) => getDisplayName(row),
            sortable: true,
        },
        {
            name: 'Email',
            selector: (row: Volunteer) => row.email || row.organization_email || 'N/A',
            sortable: true,
        },
        {
            name: 'Contact Number',
            selector: (row: Volunteer) => row.phone_number || row.organization_phone_number || 'N/A',
        },
        {
            name: 'Date Applied',
            selector: (row: Volunteer) => formatDate(row.created_at),
        },
        {
            name: 'Action',
            cell: (row: Volunteer) => (
                <div className="action-buttons">
                    <span
                        className={`action-accept ${['approved', 'rejected'].includes(row.status ?? '') ? 'disabled' : ''}`}
                        onClick={(e) => {
                            if (['approved', 'rejected'].includes(row.status ?? '')) return;
                            handleAcceptClick(e, row);
                        }}
                    >
                        Accept
                    </span>
                    {' | '}
                    <span className="action-decline" onClick={(e) => handleDeclineClick(e, row)}>
                        Decline
                    </span>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: '200px',
        },
    ];

    // Loading state
    if (loading) {
        return (
            <div className="applicants-container">
                <div className="breadcrumb-section">
                    <h2 className="page-title">Applicants</h2>
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
                            <span>Applicants</span>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </div>
                <div
                    style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}
                >
                    <Spin size="large" />
                </div>
            </div>
        );
    }

    return (
        <div className="applicants-container">
            {/* Breadcrumb Navigation */}
            <div className="breadcrumb-section">
                <h2 className="page-title">Applicants</h2>
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
                        <span>Applicants</span>
                    </Breadcrumb.Item>
                </Breadcrumb>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Applicants List */}
                <div className="applicants-list-card">
                    <div className="search-container">
                        <h2 className="section-title">Applicants List</h2>
                        <Input.Search
                            placeholder="Search by name, email or contact number"
                            value={searchText}
                            onChange={handleSearchChange}
                            style={{ maxWidth: 300, marginBottom: 10 }}
                        />
                    </div>
                    <div className="table-container">
                        <DataTable
                            columns={columns}
                            data={filteredVolunteers}
                            pagination
                            highlightOnHover
                            pointerOnHover
                            onRowClicked={handleRowClick}
                            noDataComponent={<div style={{ padding: '20px' }}>No volunteers found</div>}
                            customStyles={{
                                rows: {
                                    style: {
                                        cursor: 'pointer',
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                {/* Applicant Details */}
                <div className="applicant-details-card">
                    <h3 className="details-title">
                        {selectedVolunteer
                            ? `Applicant Details - ${getDisplayName(selectedVolunteer)}`
                            : 'Select an applicant to view details'}
                    </h3>

                    {selectedVolunteer && (
                        <div className="details-container">
                            {/* Quick summary fields (kept simple) */}
                            <div className="detail-item">
                                <p className="detail-label">Email</p>
                                <p className="detail-value">
                                    {selectedVolunteer.email || selectedVolunteer.organization_email || 'N/A'}
                                </p>
                            </div>
                            <div className="detail-item">
                                <p className="detail-label">Contact Number</p>
                                <p className="detail-value">
                                    {selectedVolunteer.phone_number ||
                                        selectedVolunteer.organization_phone_number ||
                                        'N/A'}
                                </p>
                            </div>
                            <div className="detail-item">
                                <p className="detail-label">Date Applied</p>
                                <p className="detail-value">{formatDate(selectedVolunteer.created_at)}</p>
                            </div>

                            <div className="view-credentials-container">
                                <Button
                                    type="primary"
                                    className="view-credentials-button"
                                    onClick={handleViewCredentials}
                                >
                                    View More Info
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ---------- MODAL: View More Info ---------- */}
            <Modal
                title={selectedVolunteer ? `Applicant: ${getDisplayName(selectedVolunteer)}` : 'Applicant'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button key="close" onClick={() => setIsModalOpen(false)}>
                        Close
                    </Button>,
                    <Button
                        key="accept"
                        type="primary"
                        onClick={async () => {
                            if (selectedVolunteer) {
                                await acceptVolunteer(selectedVolunteer);
                            }
                            setIsModalOpen(false);
                        }}
                    >
                        Accept
                    </Button>,
                ]}
                width={800}
                style={{ top: 20 }}
            >
                {selectedVolunteer?.organization_name && selectedVolunteer?.contact_person_name && (
                    <div style={{ marginTop: -8, marginBottom: 12, color: '#666' }}>
                        Contact Person: {selectedVolunteer.contact_person_name}
                        {selectedVolunteer.contact_person_position ? ` — ${selectedVolunteer.contact_person_position}` : ''}
                    </div>
                )}
                {selectedVolunteer && (
                    <>
                        {/* TYPE BADGE */}
                        <div style={{ marginBottom: 12 }}>
                            {selectedVolunteer.organization_name ? (
                                <Tag color="blue">Organization</Tag>
                            ) : (
                                <Tag color="green">Individual</Tag>
                            )}
                        </div>

                        {/* ORG VIEW */}
                        {selectedVolunteer.organization_name ? (
                            <>
                                <Descriptions title="Organization Details" column={2} bordered size="middle">
                                    <Descriptions.Item label="Organization Name" span={2}>
                                        {show(selectedVolunteer.organization_name)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Organization Email">
                                        {show(selectedVolunteer.organization_email || selectedVolunteer.email)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Organization Phone">
                                        {show(selectedVolunteer.organization_phone_number || selectedVolunteer.phone_number)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Organization Address" span={2}>
                                        {show(selectedVolunteer.organization_address || selectedVolunteer.address)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Availability" span={2}>
                                        {show(selectedVolunteer.availability)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Applied On">
                                        {formatDate(selectedVolunteer.created_at)}
                                    </Descriptions.Item>
                                </Descriptions>

                                <Divider />

                                <Descriptions title="Contact Person" column={2} bordered size="middle">
                                    <Descriptions.Item label="Name" span={2}>
                                        {show(selectedVolunteer.contact_person_name)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Position">
                                        {show(selectedVolunteer.contact_person_position)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Email">
                                        {show(selectedVolunteer.contact_person_email)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Phone">
                                        {show(selectedVolunteer.contact_person_phone_number)}
                                    </Descriptions.Item>
                                </Descriptions>
                            </>
                        ) : (

                            /* INDIVIDUAL VIEW */
                            <>
                                <Descriptions
                                    title="Personal Details"
                                    column={2}
                                    bordered
                                    size="middle"
                                >
                                    <Descriptions.Item label="Full Name" span={2}>
                                        {getFullNamewMid(selectedVolunteer)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Email">
                                        {selectedVolunteer.email || 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Contact Number">
                                        {selectedVolunteer.phone_number || 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Date of Birth">
                                        {formatDate(selectedVolunteer.birthday)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Age">
                                        {selectedVolunteer.age ?? 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Gender">
                                        {selectedVolunteer.gender || 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Address" span={2}>
                                        {selectedVolunteer.address || 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Availability" span={2}>
                                        {selectedVolunteer.availability || 'N/A'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Applied On">
                                        {formatDate(selectedVolunteer.created_at)}
                                    </Descriptions.Item>
                                </Descriptions>

                                <Divider />

                                <Descriptions
                                    title="Medical Information"
                                    column={1}
                                    bordered
                                    size="middle"
                                >
                                    <Descriptions.Item label="Medical Conditions">
                                        {selectedVolunteer.medical_conditions || 'None'}
                                    </Descriptions.Item>
                                    {selectedVolunteer.other_medical_conditions && (
                                        <Descriptions.Item label="Other Medical Conditions">
                                            {selectedVolunteer.other_medical_conditions}
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </>
                        )}

                        <Divider />

                        {/* CERTIFICATES SECTION */}
                        <div>
                            <h4 style={{ marginBottom: 12 }}>Certificates</h4>

                            {/* If you already store URLs or IDs, map them here. For now, show placeholders. */}
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                                    gap: 12,
                                }}
                            >
                                {/* Placeholder cells – replace with real data mapping later */}
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        style={{
                                            border: '1px dashed #d9d9d9',
                                            borderRadius: 8,
                                            height: 120,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 12,
                                            color: '#999',
                                            background: '#fafafa',
                                        }}
                                    >
                                        Certificate Placeholder #{i}
                                    </div>
                                ))}
                            </div>

                            {/* If you have a single text field like "certification" */}
                            {selectedVolunteer.certification && (
                                <p style={{ marginTop: 12, color: '#555' }}>
                                    Attached note: {selectedVolunteer.certification}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </Modal>
            {/* ---------- /MODAL ---------- */}
        </div>
    );
};

export default ManageApplicant;

import React, { useState, useEffect } from "react";
import {
    Button,
    Breadcrumb,
    Input,
    Spin,
    message,
    Modal,
    Descriptions,
    Divider,
    Tag,
    Empty,
    Image,
} from "antd";
import DataTable, { TableColumn } from "react-data-table-component";
import "./css/ManageApplicant.css";
import { Link, useNavigate } from "react-router-dom";
import Swal, { SweetAlertResult } from "sweetalert2";
import {
    getAllVolunteers,
    updateVolunteerStatus,
} from "../../../API_Handler/individual_volunter_handler";
import {
    getAllOrganizationVolunteers,
    updateOrganizationVolunteerStatus,
} from "../../../API_Handler/organization_volunteer_handler";
import {
    FilePdfOutlined,
    FileImageOutlined,
    DownloadOutlined,
    FileOutlined,
} from "@ant-design/icons";
import { API } from "../../../API_Handler/Axio_API_Handler";

type VolunteerStatus =
    | "pending"
    | "submitted"
    | "verifying"
    | "approved"
    | "rejected";
type Availability = "available" | "unavailable" | "assigned";

interface VolunteerCertificate {
    id: number;
    file_name: string;
    file_path: string;
    mime_type?: string;
    uploaded_at?: string;
}

interface Volunteer {
    volunteer_id: number;
    user_id: number;

    // Individual
    first_name?: string;
    middle_name?: string;
    last_name?: string;

    // Organization
    organization_name?: string;
    organization_email?: string;
    organization_phone_number?: string;
    organization_address?: string;
    contact_person_name?: string;
    contact_person_email?: string;
    contact_person_position?: string;
    contact_person_phone_number?: string;

    // Certificates (normalized + raw)
    certificates?: VolunteerCertificate[]; // from BE (individuals)
    ind_cert_files?: string[]; // normalized file paths (individuals)
    org_cert_files?: string[]; // normalized file paths (organizations)
    organization_certificate?: string; // legacy (org)
    certification_paths?: string; // possible legacy csv
    certification?: string; // legacy (individual single)
    organization_picture?: string; // single path (current BE)
    organization_pictures?: string[]; // optional future array
    // Common
    email?: string;
    phone_number?: string;
    address?: string;
    birthday?: string;
    gender?: string;
    age?: number;
    availability?: string;
    availability_status?: Availability; // ✅ now tracked in UI state
    medical_conditions?: string;
    other_medical_conditions?: string;
    created_at?: string;
    status?: VolunteerStatus | string;
}

const ManageApplicant: React.FC = () => {
    const navigate = useNavigate();

    // -------- State --------
    const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchText, setSearchText] = useState<string>("");
    const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(
        null,
    );
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const show = (v?: string | number | null) =>
        v === undefined || v === null || v === "" ? "N/A" : String(v);

    const API_BASE = API.defaults.baseURL;

    // -------- Helpers (declare before first use) --------
    function toAbsoluteFileUrl(p?: string) {
        if (!p) return "";
        if (/^https?:\/\//i.test(p)) return p;
        const clean = p.replace(/^(\.\/|\/)/, "");
        return `${API_BASE}/${clean}`;
    }

    function getFileName(p?: string) {
        return p ? p.split("/").pop() || "" : "";
    }

    function getExt(p?: string) {
        return (p?.split(".").pop() || "").toLowerCase();
    }

    function statusOf(v: Volunteer) {
        return String(v.status ?? "")
            .trim()
            .toLowerCase();
    }

    function getFullName(v: Volunteer): string {
        const parts = [v.first_name, v.middle_name, v.last_name];
        return parts.filter(Boolean).join(" ");
    }

    function getDisplayName(v: Volunteer): string {
        if (v.organization_name) return v.organization_name;
        const name = getFullName(v);
        return name || "—";
    }

    function formatDate(dateString?: string): string {
        if (!dateString) return "N/A";
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
        } catch {
            return dateString || "N/A";
        }
    }

    function renderFileRow(path: string, key?: React.Key) {
        const url = toAbsoluteFileUrl(path);
        const name = getFileName(path);
        const ext = getExt(path);
        const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
        const icon =
            ext === "pdf" ? (
                <FilePdfOutlined style={{ fontSize: 24, color: "#cf1322" }} />
            ) : isImg ? (
                <FileImageOutlined style={{ fontSize: 24 }} />
            ) : (
                <FileOutlined style={{ fontSize: 24, color: "#1677ff" }} />
            );

        return (
            <div
                key={key ?? path}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: "1px solid #f0f0f0",
                    borderRadius: 8,
                    padding: 12,
                    background: "#fff",
                    marginBottom: 8,
                }}
            >
                {icon}
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        flex: 1,
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: 500,
                    }}
                    title={name}
                >
                    {name || "certificate"}
                </a>

                <a href={url} download target="_blank" rel="noopener noreferrer">
                    <Button icon={<DownloadOutlined />}>Download</Button>
                </a>
            </div>
        );
    }

    // Normalize & get certificate files from a volunteer (individual/org)
    function getCertFiles(v?: Volunteer): string[] {
        if (!v) return [];
        if (v.organization_name) {
            // Organization
            return v.org_cert_files ?? [];
        }
        // Individual
        if (Array.isArray(v.ind_cert_files)) return v.ind_cert_files;
        if (Array.isArray(v.certificates) && v.certificates.length)
            return v.certificates.map((c) => c.file_path);
        if (v.certification) return [v.certification]; // legacy single
        return [];
    }

    // -------- Data fetch --------
    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                setLoading(true);

                const individualData = await getAllVolunteers();
                const orgData = await getAllOrganizationVolunteers();

                const splitCsv = (s?: string) =>
                    s
                        ? s
                            .split(",")
                            .map((x) => x.trim())
                            .filter(Boolean)
                        : [];

                const extractOrgCertFiles = (org: any): string[] => {
                    if (Array.isArray(org.organization_certificates))
                        return org.organization_certificates;
                    if (
                        typeof org.organization_certificate === "string" &&
                        org.organization_certificate
                    )
                        return [org.organization_certificate];
                    if (Array.isArray(org.certification_files))
                        return org.certification_files;
                    if (typeof org.certification_paths === "string")
                        return splitCsv(org.certification_paths);
                    if (typeof org.certification === "string") return [org.certification];
                    return [];
                };

                // Normalize individual volunteers to include ind_cert_files (from certificates[] or legacy certification)
                const mappedIndData: Volunteer[] = (individualData || []).map(
                    (iv: any) => ({
                        ...iv,
                        availability_status:
                            (iv.availability_status as Availability) ?? "unavailable", // ✅ default explicit
                        ind_cert_files:
                            Array.isArray(iv.certificates) && iv.certificates.length > 0
                                ? iv.certificates.map((c: any) => c.file_path)
                                : iv.certification
                                    ? [iv.certification]
                                    : [],
                    }),
                );

                // Normalize organization volunteers
                const mappedOrgData: Volunteer[] = (orgData || []).map((org: any) => ({
                    ...org,
                    availability_status:
                        (org.availability_status as Availability) ?? "unavailable", // ✅ default explicit
                    organization_name: org.organization_name,
                    organization_email: org.organization_email,
                    organization_phone_number: org.organization_phone_number,
                    organization_address: org.organization_address,
                    contact_person_name: org.contact_person_name,
                    contact_person_email: org.contact_person_email,
                    contact_person_position: org.contact_person_position,
                    contact_person_phone_number: org.contact_person_phone_number,

                    // normalize for table/search convenience
                    first_name: org.organization_name,
                    email: org.organization_email,
                    phone_number: org.organization_phone_number,
                    address: org.organization_address ?? org.address,

                    organization_picture: org.organization_picture,
                    organization_pictures: Array.isArray(org.organization_pictures)
                        ? org.organization_pictures
                        : undefined,

                    // normalized org certs
                    org_cert_files: extractOrgCertFiles(org),
                }));

                const allData: Volunteer[] = [...mappedIndData, ...mappedOrgData];

                setVolunteers(allData);

                // pick a non-approved as initial selection if available
                const firstVisible = allData.find(isVisible) ?? null;
                setSelectedVolunteer(firstVisible);
            } catch (error) {
                console.error("Error fetching volunteers:", error);
                message.error("Failed to load volunteers data");
            } finally {
                setLoading(false);
            }
        };

        fetchVolunteers();
    }, []);

    const isOrg = (v: Volunteer) => !!v.organization_name;

    async function setStatus(
        v: Volunteer,
        status?: VolunteerStatus,
        availability?: Availability,
    ) {
        if (isOrg(v)) {
            // ✅ Make sure this is being called for organization volunteers
            console.log(
                "Updating ORG volunteer:",
                v.volunteer_id,
                status,
                availability,
            );
            return updateOrganizationVolunteerStatus(
                v.volunteer_id,
                status as any,
                availability,
            );
        } else {
            // ✅ And this for individual volunteers
            console.log(
                "Updating INDIVIDUAL volunteer:",
                v.volunteer_id,
                status,
                availability,
            );
            return updateVolunteerStatus(v.volunteer_id, status as any, availability);
        }
    }

    // -------- Derived values --------
    const middleInitial = selectedVolunteer?.middle_name
        ? selectedVolunteer.middle_name.charAt(0) + ". "
        : "";

    function getFullNamewMid(v: Volunteer): string {
        const parts = [
            v.first_name,
            v === selectedVolunteer ? middleInitial : v.middle_name,
            v.last_name,
        ];
        return parts.filter(Boolean).join(" ");
    }

    // ✅ UPDATED: Hide approved, rejected, and accepted applicants
    const HIDESTATUS = new Set<string>(["approved", "rejected", "accepted"]);

    const isVisible = (v: Volunteer): boolean => {
        // ✅ Only show applicants that are NOT in HIDESTATUS
        return !HIDESTATUS.has(statusOf(v));
    };

    const visibleVolunteers: Volunteer[] = volunteers.filter(isVisible);

    // search filter
    const filteredVolunteers: Volunteer[] = visibleVolunteers.filter(
        (v: Volunteer) => {
            const searchLower = searchText.toLowerCase();
            const displayName = getDisplayName(v).toLowerCase();
            const email = (v.email || v.organization_email || "").toLowerCase();
            const phone = (
                v.phone_number ||
                v.organization_phone_number ||
                ""
            ).toString();

            return (
                displayName.includes(searchLower) ||
                email.includes(searchLower) ||
                phone.includes(searchText)
            );
        },
    );

    function getOrgPictures(v?: Volunteer): string[] {
        if (!v || !v.organization_name) return [];
        const pics: string[] = [];
        if (
            Array.isArray(v.organization_pictures) &&
            v.organization_pictures.length
        ) {
            pics.push(...v.organization_pictures);
        } else if (v.organization_picture) {
            pics.push(v.organization_picture);
        }
        // de-dupe + truthy
        return pics.filter(Boolean).filter((p, i, a) => a.indexOf(p) === i);
    }

    // -------- UI actions --------
    const showAlert = (): void => {
        Swal.fire({
            title: "You have successfully accepted the applicant.",
            icon: "success",
            confirmButtonColor: "#749AB6",
            width: "380px",
            showConfirmButton: false,
            customClass: {
                popup: "custom-height-modal",
                title: "custom-swal-title",
                htmlContainer: "custom-swal-text",
                confirmButton: "custom-swal-button",
                icon: "custom-swal-icon",
            },
        });
    };

    const handleDelete = (volunteerId: number): void => {
        const swalWithCustomButtons = Swal.mixin({
            customClass: {
                popup: "custom-swal-popup",
                confirmButton: "my-confirm-button",
                cancelButton: "my-cancel-button",
            },
            buttonsStyling: false,
        });

        swalWithCustomButtons
            .fire({
                title: "Are you sure you want to decline this applicant?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, decline it!",
                cancelButtonText: "No, cancel!",
                reverseButtons: true,
                width: "380px",
            })
            .then((result: SweetAlertResult) => {
                if (result.isConfirmed) {
                    swalWithCustomButtons.fire({
                        title: "Deleted!",
                        text: "Applicant has been deleted.",
                        icon: "success",
                        width: "380px",
                    });

                    setVolunteers((prev) =>
                        prev.filter((v) => v.volunteer_id !== volunteerId),
                    );

                    if (selectedVolunteer?.volunteer_id === volunteerId) {
                        const remaining = volunteers.filter(
                            (v) => v.volunteer_id !== volunteerId,
                        );
                        setSelectedVolunteer(remaining.length > 0 ? remaining[0] : null);
                    }
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    swalWithCustomButtons.fire({
                        title: "Cancelled",
                        text: "The applicant's application has been cancelled.",
                        icon: "error",
                        width: "380px",
                    });
                }
            });
    };

    const pickNextVisible = (currentId: number): Volunteer | null => {
        const next = volunteers.find(
            (v) => v.volunteer_id !== currentId && isVisible(v),
        );
        return next ?? null;
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        setSearchText(e.target.value);
    };

    const handleRowClick = (row: Volunteer): void => {
        setSelectedVolunteer(row);
    };

    const handleViewCredentials = async (): Promise<void> => {
        if (!selectedVolunteer) return;

        const allowedFromView = new Set(["pending", "submitted", ""]);
        if (!allowedFromView.has(statusOf(selectedVolunteer))) {
            setIsModalOpen(true);
            return;
        }

        const id = selectedVolunteer.volunteer_id;
        const prevStatus = selectedVolunteer.status;
        const nextStatus: Volunteer["status"] = "verifying";

        // optimistic
        setVolunteers((prev) =>
            prev.map((v) =>
                v.volunteer_id === id ? { ...v, status: nextStatus } : v,
            ),
        );
        setSelectedVolunteer({ ...selectedVolunteer, status: nextStatus });
        setIsModalOpen(true);

        try {
            await setStatus(selectedVolunteer, "verifying"); // <-- 🔁 unified API call
        } catch (err: any) {
            // rollback
            setVolunteers((prev) =>
                prev.map((v) =>
                    v.volunteer_id === id ? { ...v, status: prevStatus } : v,
                ),
            );
            setSelectedVolunteer({ ...selectedVolunteer, status: prevStatus });
            message.error(err?.message || "Failed to set status to verifying.");
        }
    };

    const acceptVolunteer = async (volunteer: Volunteer) => {
        const id = volunteer.volunteer_id;
        const prevStatus = volunteer.status;
        const prevAvail = volunteer.availability_status;

        const allowedFrom = new Set(["verifying"]);
        if (!allowedFrom.has(statusOf(volunteer))) {
            message.warning("Only applications in verifying can be accepted.");
            return;
        }

        // ✅ Add debug logging
        console.log("Accepting volunteer:", {
            id,
            name: getDisplayName(volunteer),
            isOrg: isOrg(volunteer),
            status: prevStatus,
            availability: prevAvail,
        });

        // Optimistic update
        setVolunteers((prev) =>
            prev.map((v) =>
                v.volunteer_id === id
                    ? { ...v, status: "approved", availability_status: "available" }
                    : v,
            ),
        );

        if (selectedVolunteer?.volunteer_id === id) {
            setSelectedVolunteer(pickNextVisible(id));
        }

        try {
            const result = await setStatus(volunteer, "approved", "available");
            console.log("Accept result:", result); // ✅ Add logging
            showAlert();
        } catch (err: any) {
            console.error("Accept error:", err); // ✅ Add logging
            // Rollback
            setVolunteers((prev) =>
                prev.map((v) =>
                    v.volunteer_id === id
                        ? { ...v, status: prevStatus, availability_status: prevAvail }
                        : v,
                ),
            );

            if (selectedVolunteer?.volunteer_id === id) {
                setSelectedVolunteer({
                    ...volunteer,
                    status: prevStatus,
                    availability_status: prevAvail,
                });
            }

            message.error(err?.message ?? "Failed to accept applicant.");
        }
    };

    const handleAcceptClick = async (
        e: React.MouseEvent<HTMLSpanElement>,
        volunteer: Volunteer,
    ) => {
        e.preventDefault();
        e.stopPropagation();
        await acceptVolunteer(volunteer);
    };

    const handleDeclineClick = (
        e: React.MouseEvent<HTMLSpanElement>,
        volunteer: Volunteer,
    ): void => {
        e.preventDefault();
        e.stopPropagation();

        const swalWithCustomButtons = Swal.mixin({
            customClass: {
                popup: "custom-swal-popup",
                confirmButton: "my-confirm-button",
                cancelButton: "my-cancel-button",
            },
            buttonsStyling: false,
        });

        swalWithCustomButtons
            .fire({
                title: "Are you sure you want to decline this applicant?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes, decline it!",
                cancelButtonText: "No, cancel!",
                reverseButtons: true,
                width: "380px",
            })
            .then(async (result: SweetAlertResult) => {
                if (!result.isConfirmed) return;

                const prevStatus = volunteer.status;

                // optimistic
                setVolunteers((prev) =>
                    prev.map((v) =>
                        v.volunteer_id === volunteer.volunteer_id
                            ? { ...v, status: "rejected" }
                            : v,
                    ),
                );
                if (selectedVolunteer?.volunteer_id === volunteer.volunteer_id) {
                    setSelectedVolunteer({ ...volunteer, status: "rejected" });
                }

                try {
                    await updateVolunteerStatus(volunteer.volunteer_id, "rejected");
                    swalWithCustomButtons.fire({
                        title: "Declined!",
                        text: "Applicant has been marked as rejected.",
                        icon: "success",
                        width: "380px",
                    });
                } catch (err: any) {
                    // rollback
                    setVolunteers((prev) =>
                        prev.map((v) =>
                            v.volunteer_id === volunteer.volunteer_id
                                ? { ...v, status: prevStatus }
                                : v,
                        ),
                    );
                    if (selectedVolunteer?.volunteer_id === volunteer.volunteer_id) {
                        setSelectedVolunteer({ ...volunteer, status: prevStatus });
                    }
                    message.error(
                        err?.message || "Failed to update status. Please try again.",
                    );
                }
            });
    };

    // -------- Table columns --------
    const columns: TableColumn<Volunteer>[] = [
        {
            name: "No.",
            selector: (_row: Volunteer, index?: number) => (index || 0) + 1,
            sortable: true,
            width: "70px",
        },
        {
            name: "Name / Organization",
            selector: (row: Volunteer) => getDisplayName(row),
            sortable: true,
        },
        {
            name: "Email",
            selector: (row: Volunteer) =>
                row.email || row.organization_email || "N/A",
            sortable: true,
        },
        {
            name: "Contact Number",
            selector: (row: Volunteer) =>
                row.phone_number || row.organization_phone_number || "N/A",
        },
        {
            name: "Date Applied",
            selector: (row: Volunteer) => formatDate(row.created_at),
        },
        {
            name: "Action",
            cell: (row: Volunteer) => (
                <div className="action-buttons">
                    <span
                        className={`action-accept ${["approved", "rejected"].includes(statusOf(row)) ? "disabled" : ""}`}
                        onClick={(e) => {
                            if (["approved", "rejected"].includes(statusOf(row))) return;
                            handleAcceptClick(e, row);
                        }}
                    >
                        Accept
                    </span>
                    {" | "}
                    <span
                        className="action-decline"
                        onClick={(e) => handleDeclineClick(e, row)}
                    >
                        Decline
                    </span>
                </div>
            ),
            ignoreRowClick: true,
            allowOverflow: true,
            button: true,
            width: "200px",
        },
    ];

    // -------- Loading --------
    if (loading) {
        return (
            <div className="applicants-container">
                <div className="breadcrumb-section">
                    <h2 className="page-title">Applicants</h2>
                    <Breadcrumb>
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
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "400px",
                    }}
                >
                    <Spin size="large" />
                </div>
            </div>
        );
    }

    // -------- UI --------
    return (
        <div className="applicants-container">
            {/* Breadcrumb */}
            <div className="breadcrumb-section">
                <h2 className="page-title">Applicants</h2>
                <Breadcrumb>
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
                            noDataComponent={<Empty description="No volunteers found" />}
                            customStyles={{
                                rows: {
                                    style: {
                                        cursor: "pointer",
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
                            : "Select an applicant to view details"}
                    </h3>

                    {selectedVolunteer && (
                        <div className="details-container">
                            <div className="detail-item">
                                <p className="detail-label">Email</p>
                                <p className="detail-value">
                                    {selectedVolunteer.email ||
                                        selectedVolunteer.organization_email ||
                                        "N/A"}
                                </p>
                            </div>
                            <div className="detail-item">
                                <p className="detail-label">Contact Number</p>
                                <p className="detail-value">
                                    {selectedVolunteer.phone_number ||
                                        selectedVolunteer.organization_phone_number ||
                                        "N/A"}
                                </p>
                            </div>
                            <div className="detail-item">
                                <p className="detail-label">Date Applied</p>
                                <p className="detail-value">
                                    {formatDate(selectedVolunteer.created_at)}
                                </p>
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

            {/* Modal */}
            <Modal
                title={
                    selectedVolunteer
                        ? `Applicant: ${getDisplayName(selectedVolunteer)}`
                        : "Applicant"
                }
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
                                await acceptVolunteer(selectedVolunteer); // ✅ sets approved + available
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
                {selectedVolunteer?.organization_name &&
                    selectedVolunteer?.contact_person_name && (
                        <div style={{ marginTop: -8, marginBottom: 12, color: "#666" }}>
                            Contact Person: {selectedVolunteer.contact_person_name}
                            {selectedVolunteer.contact_person_position
                                ? ` — ${selectedVolunteer.contact_person_position}`
                                : ""}
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
                                <Descriptions
                                    title="Organization Details"
                                    column={2}
                                    bordered
                                    size="middle"
                                >
                                    <Descriptions.Item label="Organization Name" span={2}>
                                        {show(selectedVolunteer.organization_name)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Organization Email">
                                        {show(
                                            selectedVolunteer.organization_email ||
                                            selectedVolunteer.email,
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Organization Phone">
                                        {show(
                                            selectedVolunteer.organization_phone_number ||
                                            selectedVolunteer.phone_number,
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Organization Address" span={2}>
                                        {show(
                                            selectedVolunteer.organization_address ||
                                            selectedVolunteer.address,
                                        )}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Availability" span={2}>
                                        {show(selectedVolunteer.availability)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Applied On">
                                        {formatDate(selectedVolunteer.created_at)}
                                    </Descriptions.Item>
                                </Descriptions>

                                <Divider />

                                <Descriptions
                                    title="Contact Person"
                                    column={2}
                                    bordered
                                    size="middle"
                                >
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

                                <div>
                                    <h4 style={{ marginBottom: 12 }}>Organization Picture</h4>
                                    {(() => {
                                        const pics = getOrgPictures(selectedVolunteer);
                                        if (pics.length === 0) {
                                            // ✅ Placeholder when no picture uploaded
                                            return (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 12,
                                                        padding: 16,
                                                        border: "1px dashed #d9d9d9",
                                                        borderRadius: 8,
                                                        background: "#fafafa",
                                                    }}
                                                >
                                                    <FileImageOutlined
                                                        style={{ fontSize: 24, color: "#999" }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>
                                                            No organization picture
                                                        </div>
                                                        <div style={{ fontSize: 12, color: "#888" }}>
                                                            A placeholder is shown until the applicant uploads
                                                            an image.
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        // ✅ Image grid with preview
                                        return (
                                            <Image.PreviewGroup>
                                                <div
                                                    style={{
                                                        display: "grid",
                                                        gridTemplateColumns:
                                                            "repeat(auto-fill, minmax(160px, 1fr))",
                                                        gap: 12,
                                                    }}
                                                >
                                                    {pics.map((p, idx) => {
                                                        const url = toAbsoluteFileUrl(p);
                                                        const name = getFileName(p);
                                                        return (
                                                            <div
                                                                key={idx}
                                                                style={{
                                                                    border: "1px solid #f0f0f0",
                                                                    borderRadius: 8,
                                                                    padding: 8,
                                                                    background: "#fff",
                                                                }}
                                                            >
                                                                <Image
                                                                    src={url}
                                                                    alt={
                                                                        name || `Organization picture ${idx + 1}`
                                                                    }
                                                                    width="100%"
                                                                    height={150}
                                                                    style={{
                                                                        objectFit: "cover",
                                                                        borderRadius: 6,
                                                                    }}
                                                                />
                                                                <div
                                                                    style={{
                                                                        fontSize: 12,
                                                                        marginTop: 6,
                                                                        color: "#666",
                                                                        textAlign: "center",
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis",
                                                                        whiteSpace: "nowrap",
                                                                    }}
                                                                    title={name}
                                                                >
                                                                    {name || `picture_${idx + 1}`}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </Image.PreviewGroup>
                                        );
                                    })()}
                                </div>
                            </>
                        ) : (
                            // INDIVIDUAL VIEW
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
                                        {selectedVolunteer.email || "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Contact Number">
                                        {selectedVolunteer.phone_number || "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Date of Birth">
                                        {formatDate(selectedVolunteer.birthday)}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Age">
                                        {selectedVolunteer.age ?? "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Gender">
                                        {selectedVolunteer.gender || "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Address" span={2}>
                                        {selectedVolunteer.address || "N/A"}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Availability" span={2}>
                                        {selectedVolunteer.availability || "N/A"}
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
                                        {selectedVolunteer.medical_conditions || "None"}
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

                        {/* Certificates */}
                        <div>
                            <h4 style={{ marginBottom: 12 }}>Certificates:</h4>
                            {(() => {
                                const certFiles = getCertFiles(selectedVolunteer);
                                return certFiles.length === 0 ? (
                                    <Empty description="No certificate uploaded" />
                                ) : (
                                    certFiles.map((p, i) => renderFileRow(p, i))
                                );
                            })()}
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default ManageApplicant;

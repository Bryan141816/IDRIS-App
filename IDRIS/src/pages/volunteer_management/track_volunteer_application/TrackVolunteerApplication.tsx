import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Breadcrumb, Alert, Spin } from "antd";
import { FileTextOutlined, AuditOutlined, SyncOutlined, IdcardOutlined } from "@ant-design/icons";
import "./css/TrackVolunteerApplication.css";
import { fetchVolunteerStatus, VolunteerStatus } from "../../../API_Handler/volunteer_status_handler";

const SubmittedIcon: React.FC = () => <FileTextOutlined style={{ fontSize: 28 }} />;
const VerifyingIcon: React.FC = () => <AuditOutlined style={{ fontSize: 28 }} />;
const VerifiedIcon: React.FC = () => <IdcardOutlined style={{ fontSize: 28 }} />;

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none">
        <path
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={3}
            paintOrder="stroke fill"
        />
    </svg>
);

const TrackVolunteerApplication: React.FC = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<VolunteerStatus | null>(null);
    const [volType, setVolType] = useState<"individual" | "organization" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetchVolunteerStatus();
                if (!res) { setNotFound(true); return; }
                setStatus(res.status);
                setVolType(res.type);
            } catch (e: any) {
                if (e?.response?.status === 401) setError("You're not signed in. Please log in to track your application.");
                else setError("Unable to load application status. Please try again.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const statusToStep: Record<VolunteerStatus, number> = useMemo(
        () => ({ submitted: 1, verifying: 2, approved: 3, rejected: 1 }),
        []
    );
    const currentStep = status ? statusToStep[status] : 0;
    const allStepsCompleted = status === "approved";

    return (
        <div className="application-form">
            <h2 className="page-title">Track Volunteer Application</h2>
            <Breadcrumb>
                <Breadcrumb.Item><Link to="/">Home</Link></Breadcrumb.Item>
                <Breadcrumb.Item><Link to="/volunteer_management/volunteer_dashboard">Volunteer Dashboard</Link></Breadcrumb.Item>
                <Breadcrumb.Item>Track Volunteer Application</Breadcrumb.Item>
            </Breadcrumb>

            <div className="tracker-container">
                {loading && (
                    <div style={{ display: "grid", placeItems: "center", padding: 24 }}>
                        <Spin tip="Loading status..." />
                    </div>
                )}

                {!loading && error && (
                    <Alert type="error" showIcon message="Error" description={error} style={{ marginBottom: 16 }} />
                )}

                {!loading && !error && notFound && (
                    <Alert
                        type="info"
                        showIcon
                        message="No application found"
                        description="You haven’t submitted an application yet."
                        style={{ marginBottom: 16 }}
                    />
                )}

                {!loading && !error && !notFound && status && (
                    <>
                        {status === "rejected" && (
                            <Alert
                                type="error"
                                showIcon
                                message="Application Rejected"
                                description="Sorry, your application has been rejected. You may review the requirements and submit a new application."
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <h1 className="tracker-title">
                            {volType ? `Tracking your ${volType === "individual" ? "Individual" : "Organization"} application` : "Track your Application"}
                        </h1>

                        <div className="tracker-steps">
                            {/* Step 1 */}
                            <div className="tracker-step">
                                <div className={`step-circle ${currentStep >= 1 ? "active" : ""}`}><CheckIcon /></div>
                                <div className="step-connector" />
                                <div className="step-content">
                                    <div className="step-icon"><VerifyingIcon /></div>
                                    <div className="step-label">
                                        Submitted<br />Application Form


                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="tracker-step">
                                <div className={`step-circle ${currentStep >= 2 ? "active" : ""}`}><CheckIcon /></div>
                                <div className="step-connector" />
                                <div className="step-content">
                                    <div className="step-icon"><VerifyingIcon/></div>
                                    <div className="step-label">Verifying<br />Application Form</div>
                                    {status === "verifying" && (
                                            <div className="step-substatus">
                                                <SyncOutlined spin />
                                                <span>Checking your documents…</span>
                                            </div>
                                        )}
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="tracker-step">
                                <div className={`step-circle ${currentStep >= 3 ? "active" : ""}`}><CheckIcon /></div>
                                <div className="step-content">
                                    <div className="step-icon"><VerifiedIcon /></div>
                                    <div className="step-label">Successfully<br />Verified</div>
                                </div>
                            </div>
                        </div>

                        <div className="tracker-actions">
                            {status !== "rejected" ? (
                                <button
                                    className={`view-profile-btn ${allStepsCompleted ? "enabled" : "disabled"}`}
                                    disabled={!allStepsCompleted}
                                    onClick={() => navigate("/volunteer_management/volunteer_profiles")}
                                >
                                    View Profile
                                </button>
                            ) : (
                                <button
                                    className="view-profile-btn enabled"
                                    onClick={() =>
                                        navigate(
                                            volType === "organization"
                                                ? "/volunteer_management/organization_form"
                                                : "/volunteer_management/individual_form"
                                        )
                                    }
                                >
                                    Submit New Application
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TrackVolunteerApplication;

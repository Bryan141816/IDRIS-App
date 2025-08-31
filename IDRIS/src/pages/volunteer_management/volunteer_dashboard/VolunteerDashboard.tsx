import React, { useState, useEffect, useMemo } from "react";
import "./css/VolunteerDashboard.css";
import Modal from "./Modal";
import VolunteerModal from "./VolunteerModal";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../../UserContext";
import { useUserRoleContext } from "../../../UserRoleContext";
import { getAllVolunteers } from "../../../API_Handler/individual_volunter_handler";
import { getAllOrganizationVolunteers } from "../../../API_Handler/organization_volunteer_handler";
import { message } from "antd";

// Align with your FastAPI response_model=IndividualVolunteerRead
interface IndividualVolunteerRead {
    volunteer_id: number;
    user_id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
    phone_number?: string | null;
    address?: string | null;
    birthday?: string | null;
    gender?: string | null;
    age?: number | null;
    availability?: string | null;
    medical_conditions?: string | null;
    other_medical_conditions?: string | null;
    certification?: string | null;
    skills?: string[] | null;
    created_at: string;
    status: string; // we'll normalize this
}

interface Partner { id: number; name: string; }
interface NewsAnnouncement { id: number; title: string; description: string; date: string; ongoing: boolean; }
interface DeploymentSchedule { date: string; title: string; location: string; }
interface FormattedDate { dayName: string; day: number; month: string; year: number; }

export default function IDRISDashboard() {
    const { userRoles } = useUserRoleContext();
    const { userType } = useUserContext();
    const navigate = useNavigate();

    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [viewDate, setViewDate] = useState<Date>(new Date());
    const [today] = useState<Date>(new Date());
    const [isProgramModalOpen, setIsProgramModalOpen] = useState<boolean>(false);
    const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState<boolean>(false);
    const [volunteers, setVolunteers] = useState<IndividualVolunteerRead[]>([]);
    const [organizationVolunteers, setOrganizationVolunteers] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedVolunteer, setSelectedVolunteer] = useState<IndividualVolunteerRead | null>(null);
    const [volunteerStatus, setVolunteerStatus] = useState<string>("");

    // --- helpers for status ---
    const normalizeStatus = (row: any): string =>
        String(row?.status ?? row?.application_status ?? row?.volunteer_status ?? "")
            .trim()
            .toLowerCase();

    const statusOf = (row: any): string =>
        String(row?.status ?? "").trim().toLowerCase();

    useEffect(() => {
        if (selectedVolunteer) setVolunteerStatus(statusOf(selectedVolunteer));
    }, [selectedVolunteer]);

    useEffect(() => {
        const fetchVolunteers = async () => {
            try {
                setLoading(true);

                const data = await getAllVolunteers();
                const orgData = await getAllOrganizationVolunteers();

                // Normalize & save
                const list = Array.isArray(data)
                    ? data.map((v) => ({ ...v, status: normalizeStatus(v) }))
                    : [];

                const orgList = Array.isArray(orgData)
                    ? orgData.map((o) => ({ ...o, status: normalizeStatus(o) }))
                    : [];

                setVolunteers(list);
                setOrganizationVolunteers(orgList);

                if (list.length > 0) setSelectedVolunteer(list[0]);
            } catch (error) {
                console.error("Error fetching volunteers:", error);
                message.error("Failed to load volunteers data");
            } finally {
                setLoading(false);
            }
        };

        fetchVolunteers();
    }, []);

    // ✅ Totals
    const totalVolunteersNumber = useMemo(() => {
        const ind = volunteers.filter((v) => statusOf(v) === "approved").length;
        const org = organizationVolunteers.filter((v) => statusOf(v) === "approved").length;
        return ind + org;
    }, [volunteers, organizationVolunteers]);

    // Total applicants EXCLUDING approved
    const totalApplicantsNumber = useMemo(() => {
        const ind = volunteers.filter((v) => statusOf(v) !== "approved").length;
        const org = organizationVolunteers.filter((v) => statusOf(v) !== "approved").length;
        return ind + org;
    }, [volunteers, organizationVolunteers]);

    const totalApplicants = totalApplicantsNumber.toLocaleString();
    const totalVolunteers = totalVolunteersNumber.toLocaleString();

    // Program modal controls
    const openProgramModal = (): void => setIsProgramModalOpen(true);
    const closeProgramModal = (): void => setIsProgramModalOpen(false);

    // Volunteer modal controls
    const openVolunteerModal = (): void => setIsVolunteerModalOpen(true);
    const closeVolunteerModal = (): void => setIsVolunteerModalOpen(false);

    const activeVolunteers = [
        { id: 1, name: "Volunteer Name", programs: 20, status: "joined" },
        { id: 2, name: "Volunteer Name", programs: 15, status: "joined" },
        { id: 3, name: "Volunteer Name", programs: 10, status: "joined" },
    ];

    const accreditedPartners: Partner[] = [
        { id: 1, name: "Sample Organization" },
        { id: 2, name: "Sample Organization" },
        { id: 3, name: "Sample Organization" },
    ];

    const newsAnnouncements: NewsAnnouncement[] = [
        { id: 1, title: "Example Program", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum orci ......", date: "March 1 - 2, 2025", ongoing: true },
        { id: 2, title: "Example Program", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum orci ......", date: "March 5 - 10, 2025", ongoing: false },
        { id: 3, title: "Example Program", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum orci ......", date: "March 15 - 20, 2025", ongoing: false },
        { id: 4, title: "Another Example Program", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum orci ......", date: "April 1 - 5, 2025", ongoing: false },
    ];

    useEffect(() => {
        const savedDate = localStorage.getItem("viewDate");
        if (savedDate) setViewDate(new Date(savedDate));
        else setViewDate(new Date());
    }, []);

    useEffect(() => {
        localStorage.setItem("viewDate", viewDate.toISOString());
    }, [viewDate]);

    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
    const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();
    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    const formatDate = (date: Date): FormattedDate => {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return { dayName: days[date.getDay()], day: date.getDate(), month: months[date.getMonth()], year: date.getFullYear() };
    };

    const generateCalendarDays = (): (number | null)[] => {
        const y = viewDate.getFullYear();
        const m = viewDate.getMonth();
        const total = daysInMonth(y, m);
        const first = getFirstDayOfMonth(y, m);
        const days: (number | null)[] = [];
        for (let i = 0; i < first; i++) days.push(null);
        for (let i = 1; i <= total; i++) days.push(i);
        return days;
    };

    const isToday = (d: number) =>
        d === today.getDate() &&
        viewDate.getMonth() === today.getMonth() &&
        viewDate.getFullYear() === today.getFullYear();

    const isSelected = (d: number) =>
        d === currentDate.getDate() &&
        viewDate.getMonth() === currentDate.getMonth() &&
        viewDate.getFullYear() === currentDate.getFullYear();

    const selectDate = (d: number | undefined) => {
        if (d) setCurrentDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
    };

    const formattedDate = formatDate(currentDate);
    const days = generateCalendarDays();
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const deploymentSchedules: DeploymentSchedule[] = [
        { date: "2025-01-05", title: "Field Deployment", location: "Central District" },
        { date: "2025-01-12", title: "Emergency Response", location: "Eastern Region" },
        { date: "2025-01-20", title: "Volunteer Training", location: "Headquarters" },
        { date: "2025-02-10", title: "Community Outreach", location: "Southern Region" },
        { date: "2025-03-15", title: "Disaster Preparedness", location: "Western District" },
    ];

    const currentMonthSchedules = deploymentSchedules.filter((s) => {
        const d = new Date(s.date);
        return d.getMonth() === viewDate.getMonth() && d.getFullYear() === viewDate.getFullYear();
    });

    if (loading) {
        return <div className="dashboard-container"><div className="main-container"><div className="content">Loading…</div></div></div>;
    }

    return (
        <div className="dashboard-container">
            <div className="main-container">
                <div className="content">
                    <div className="content-grid">
                        {/* Left column */}
                        <div className="left-column">
                            {/* Total Applicants (exclude approved) */}
                            <div className="card total-card applicants">
                                <div className="card-content">
                                    <div className="card-title-white">Total Applicants</div>
                                    <div className="card-number">{totalApplicants}</div>
                                </div>
                                {userType === "admin" && userRoles.includes("operations admin") ? (
                                    <button className="manage-btn" onClick={() => navigate("/volunteer_management/manage_applicant")}>
                                        Manage Applicants
                                    </button>
                                ) : volunteerStatus === "submitted" ? (
                                    <button className="manage-btn" style={{ fontSize: "90%" }} onClick={() => setIsVolunteerModalOpen(true)}>
                                        Become a Volunteer
                                    </button>
                                ) : volunteerStatus !== "submitted" ? (
                                    <button className="manage-btn" style={{ fontSize: "88%" }} onClick={() => navigate("/volunteer_management/track_volunteer_application")}>
                                        Track Volunteer Application
                                    </button>
                                ) : null }
                            </div>

                            {/* Total Volunteers (approved only) */}
                            <div className="card total-card volunteers">
                                <div className="card-content">
                                    <div className="card-title-white">Total Volunteers</div>
                                    <div className="card-number">{totalVolunteers}</div>
                                </div>
                                {userType === "admin" && userRoles.includes("operations admin") ? (
                                    <button className="manage-btn" style={{ fontSize: "98%" }} onClick={() => navigate("/volunteer_management/volunteer_assignment")}>
                                        Manage Volunteers
                                    </button>
                                ) : (
                                    <button className="manage-btn" style={{ display: "none" }} onClick={() => navigate("/volunteer_management/become_volunteer")}>
                                        Become a Volunteer
                                    </button>
                                )}
                            </div>

                            {/* Cards grid */}
                            <div className="cards-grid">
                                {/* Active Volunteers */}
                                <div className="card">
                                    <h2 className="blue-title">Active Volunteers</h2>
                                    <div className="volunteer-list">
                                        {[{ id: 1, name: "Volunteer Name", programs: 20, status: "joined" },
                                        { id: 2, name: "Volunteer Name", programs: 15, status: "joined" },
                                        { id: 3, name: "Volunteer Name", programs: 10, status: "joined" }].map((v) => (
                                            <div key={v.id} className="volunteer-item">
                                                <div className="volunteer-avatar"></div>
                                                <div className="volunteer-info">
                                                    <div className="volunteer-name">{v.name}</div>
                                                    <div className="volunteer-meta">{v.programs} Programs {v.status}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Accredited Partners */}
                                <div className="card">
                                    <h2 className="blue-title">Accredited Partners</h2>
                                    <div className="partner-list">
                                        {[{ id: 1, name: "Sample Organization" }, { id: 2, name: "Sample Organization" }, { id: 3, name: "Sample Organization" }].map((p) => (
                                            <div key={p.id} className="partner-item">
                                                <div className="partner-logo"></div>
                                                <div className="partner-info">
                                                    <div className="partner-name">{p.name}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right column */}
                        <div className="right-column">
                            {/* Deployment Schedules & Calendar */}
                            <div className="card deployment-calendar">
                                <div className="deployment-calendar-grid">
                                    {/* Deployment Schedules */}
                                    <div className="deployment-section">
                                        <h2 className="deployment-title">Deployment Schedules</h2>
                                        <div className="deployment-list">
                                            {currentMonthSchedules.length > 0 ? (
                                                currentMonthSchedules.map((s, i) => (
                                                    <div key={i} className="deployment-item">
                                                        <div className="deployment-item-title">{s.title}</div>
                                                        <div className="deployment-item-date">
                                                            {s.date.split("-")[2]}, {formatDate(viewDate).month}
                                                        </div>
                                                        <div className="deployment-item-location">{s.location}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p>No scheduled deployments for {formatDate(viewDate).month} {viewDate.getFullYear()}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Calendar */}
                                    <div className="calendar-section">
                                        <div className="calendar-header">
                                            <button onClick={prevMonth} className="calendar-nav-btn">&lt;</button>
                                            <div>
                                                <div className="day-name">{formatDate(currentDate).dayName}</div>
                                                <div className="date-display">
                                                    <span className="month-day">{formattedDate.month} {formattedDate.day}</span>
                                                    <span className="year">{formattedDate.year}</span>
                                                </div>
                                            </div>
                                            <button onClick={nextMonth} className="calendar-nav-btn">&gt;</button>
                                        </div>
                                        <div className="calendar">
                                            <div className="weekdays">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="weekday">{d}</div>)}</div>
                                            <div className="days">
                                                {days.map((d, idx) => (
                                                    <div key={idx} className="calendar-day-container">
                                                        {d && (
                                                            <div
                                                                onClick={() => setCurrentDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d))}
                                                                className={`calendar-day ${isToday(d) ? "today" : ""} ${isSelected(d) && !isToday(d) ? "selected" : ""}`}
                                                            >
                                                                {d}
                                                                {/* add schedule dot if you like */}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* News & Announcements */}
                            <div className="card news-card">
                                <div className="news-header">
                                    <h2 className="news-title">News & Announcements</h2>
                                    {userType === "admin" ? (
                                        <button onClick={openProgramModal} className="add-program-btn">+ Add Program</button>
                                    ) : (
                                        <button className="manage-btn" style={{ display: "none" }} onClick={() => setIsVolunteerModalOpen(true)}>
                                            Become a Volunteer
                                        </button>
                                    )}
                                </div>
                                <div className="news-list">
                                    {newsAnnouncements.map((item) => (
                                        <div key={item.id} className="news-item">
                                            <div className="edit-icon">✏️</div>
                                            <h3 className="news-item-title">{item.title}</h3>
                                            <p className="news-item-desc">{item.description}</p>
                                            <div className="news-item-meta">
                                                <span className="news-item-date">{item.date}</span>
                                                {item.ongoing && <span className="ongoing-badge">Ongoing</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal isOpen={isProgramModalOpen} onClose={closeProgramModal} />
            <VolunteerModal isOpen={isVolunteerModalOpen} onClose={closeVolunteerModal} />
        </div>
    );
}

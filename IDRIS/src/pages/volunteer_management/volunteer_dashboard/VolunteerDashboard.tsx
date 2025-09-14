import React, { useState, useEffect, useMemo } from "react";
import "./css/VolunteerDashboard.css";
import Modal from "./Modal";
import VolunteerModal from "./VolunteerModal";
import ReportModal from "./reports_modal";
import { useNavigate } from "react-router-dom";
import { useUserContext } from "../../../UserContext";
import { useUserRoleContext } from "../../../UserRoleContext";
import { getAllVolunteers } from "../../../API_Handler/individual_volunter_handler";
import { getAllOrganizationVolunteers } from "../../../API_Handler/organization_volunteer_handler";
import { message, Empty } from "antd";
import { MapPin, Calendar as CalendarIcon } from "lucide-react";
import { listPrograms, createAssignment as apiCreateAssignment } from "../../../API_Handler/assignment_handler";

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
  status: string;

  // computed counters
  tasks_joined?: number;
  active_tasks_joined?: number;
  events_joined?: number;
  active_events_joined?: number;

  profile_picture?: string | null;
}

type TaskLifecycle = "incoming" | "ongoing" | "finished";

interface NewsAnnouncement {
  id: number;
  title: string;
  description: string;
  location?: string;
  start_at?: string;
  end_at?: string;
  task_date?: string;
  lifecycle: TaskLifecycle;
  maxVolunteers: number;
  currentVolunteers: number;
  volunteersNeeded: number;
}

interface CalendarEvent {
  id: number | string;
  title: string;
  location?: string;
  startISO: string;
  endISO: string;
}

export default function IDRISDashboard() {
  const { userRoles } = useUserRoleContext();
  const { userType } = useUserContext();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [today] = useState<Date>(new Date());
  const [isProgramModalOpen, setIsProgramModalOpen] = useState<boolean>(false);
  const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState<boolean>(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState<boolean>(false);
  const [volunteers, setVolunteers] = useState<IndividualVolunteerRead[]>([]);
  const [organizationVolunteers, setOrganizationVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVolunteer, setSelectedVolunteer] = useState<IndividualVolunteerRead | null>(null);
  const [volunteerStatus, setVolunteerStatus] = useState<string>("");

  const [newsAnnouncements, setNewsAnnouncements] = useState<NewsAnnouncement[]>([]);
  const [hoveredDayKey, setHoveredDayKey] = useState<string | null>(null);

  // NEW: current user's volunteer profiles (individual/org)
  const [myVolunteer, setMyVolunteer] = useState<IndividualVolunteerRead | null>(null);
  const [myOrgVolunteer, setMyOrgVolunteer] = useState<any | null>(null);
  const [joining, setJoining] = useState<Record<number, boolean>>({}); // programId -> loading

  // ---------- helpers ----------
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const toAbsoluteFileUrl = (p?: string) => {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    const clean = p.replace(/^(\.\/|\/)/, "");
    return `${API_BASE}/${clean}`;
  };

  const normalizeStatus = (row: any): string =>
    String(row?.status ?? row?.application_status ?? row?.volunteer_status ?? "")
      .trim()
      .toLowerCase();

  const statusOf = (row: any): string => String(row?.status ?? "").trim().toLowerCase();

  const fullName = (v: IndividualVolunteerRead) =>
    [v.first_name, v.middle_name, v.last_name].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

  // Top 3 “active volunteers”
  const top3ActiveVolunteers = useMemo(() => {
    const approved = volunteers.filter((v) => statusOf(v) === "approved");
    const withCount = approved
      .map((v) => ({ ...v, _events: Number(v.events_joined ?? 0) }))
      .filter((v) => v._events > 0);
    withCount.sort((a, b) => b._events - a._events);
    return withCount.slice(0, 3);
  }, [volunteers]);

  const getOrgLogoPath = (org: any): string | null => {
    if (Array.isArray(org?.organization_pictures) && org.organization_pictures.length > 0) {
      return org.organization_pictures[0] || null;
    }
    if (typeof org?.organization_picture === "string" && org.organization_picture.trim()) {
      return org.organization_picture;
    }
    return null;
  };

  const getInitial = (name?: string) => name?.trim()?.charAt(0)?.toUpperCase() || "?";

  const fmtRange = (startISO?: string, endISO?: string, fallbackDate?: string) => {
    if (startISO && endISO) {
      const s = new Date(startISO);
      const e = new Date(endISO);
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        const sameDay =
          s.getFullYear() === e.getFullYear() &&
          s.getMonth() === e.getMonth() &&
          s.getDate() === e.getDate();

        const sDate = s.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
        const sTime = s.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
        const eDate = e.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
        const eTime = e.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

        return sameDay ? `${sDate} · ${sTime} – ${eTime}` : `${sDate} ${sTime} → ${eDate} ${eTime}`;
      }
    }
    if (fallbackDate) {
      const d = new Date(fallbackDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
      }
      return fallbackDate;
    }
    return "—";
  };

  const computeLifecycle = (startISO?: string, endISO?: string, dateOnly?: string): TaskLifecycle => {
    const now = new Date();
    if (startISO && endISO) {
      const s = new Date(startISO);
      const e = new Date(endISO);
      if (now < s) return "incoming";
      if (now >= e) return "finished";
      return "ongoing";
    }
    if (dateOnly) {
      const d = new Date(dateOnly + "T00:00:00");
      const end = new Date(dateOnly + "T23:59:59");
      if (now < d) return "incoming";
      if (now > end) return "finished";
      return "ongoing";
    }
    return "incoming";
  };

  const ymd = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
  const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

  const activeNewsAnnouncements = useMemo(
    () => newsAnnouncements.filter((n) => n.lifecycle !== "finished"),
    [newsAnnouncements]
  );

  // ---------- Fetch Programs ----------
  useEffect(() => {
    const toArray = (resp: any): any[] => {
      if (Array.isArray(resp)) return resp;
      if (Array.isArray(resp?.data)) return resp.data;
      if (Array.isArray(resp?.results)) return resp.results;
      if (Array.isArray(resp?.items)) return resp.items;
      if (Array.isArray(resp?.programs)) return resp.programs;
      return [];
    };

    const coerceInt = (v: any, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const fetchNewsAnnouncements = async () => {
      try {
        const raw = await listPrograms();
        const arr = toArray(raw);

        const announcements: NewsAnnouncement[] = arr.map((program: any) => {
          const max = coerceInt(program.max_volunteers ?? program.maxVolunteers ?? program.capacity ?? 0, 0);

          const assignedList =
            program.assigned_volunteer_ids ??
            program.assignedVolunteers ??
            [];
          const assignedLen = Array.isArray(assignedList) ? assignedList.length : 0;

          const current = Math.min(
            max,
            coerceInt(
              program.current_count ??
                program.currentVolunteers ??
                program.current_volunteers ??
                assignedLen,
              0
            )
          );

          const start_at = program.start_at ?? null;
          const end_at = program.end_at ?? null;
          const task_date = program.task_date ?? program.date ?? null;

          const lifecycle = computeLifecycle(start_at, end_at, task_date);

          return {
            id: coerceInt(program.id, Date.now()),
            title: String(program.title ?? "Untitled Program"),
            description: String(program.description ?? ""),
            location: program.location || "TBA",
            start_at: start_at || undefined,
            end_at: end_at || undefined,
            task_date: task_date || undefined,
            lifecycle,
            maxVolunteers: max,
            currentVolunteers: current,
            volunteersNeeded: Math.max(0, max - current),
          };
        });

        setNewsAnnouncements(announcements);
      } catch (e) {
        console.error("Failed to load programs/announcements:", e);
        message.error("Failed to load programs/announcements.");
        setNewsAnnouncements([]);
      }
    };

    fetchNewsAnnouncements();
  }, []);

  // ---------- Calendar events derived from programs ----------
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return activeNewsAnnouncements.map((n) => {
      if (n.start_at && n.end_at) {
        return { id: n.id, title: n.title, location: n.location, startISO: n.start_at, endISO: n.end_at };
        }
      if (n.task_date) {
        const startISO = new Date(`${n.task_date}T08:00:00`).toISOString();
        const endISO = new Date(`${n.task_date}T17:00:00`).toISOString();
        return { id: n.id, title: n.title, location: n.location, startISO, endISO };
      }
      const now = new Date();
      const end = new Date(now.getTime() + 60 * 60 * 1000);
      return { id: n.id, title: n.title, location: n.location, startISO: now.toISOString(), endISO: end.toISOString() };
    });
  }, [activeNewsAnnouncements]);

  // Map events to YYYY-MM-DD
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    for (const ev of calendarEvents) {
      const s = new Date(ev.startISO);
      const e = new Date(ev.endISO);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) continue;

      let cur = new Date(s.getFullYear(), s.getMonth(), s.getDate(), 0, 0, 0, 0);
      const last = new Date(e.getFullYear(), e.getMonth(), e.getDate(), 0, 0, 0, 0);

      while (cur.getTime() <= last.getTime()) {
        const key = ymd(cur);
        const arr = map.get(key) ?? [];
        arr.push(ev);
        map.set(key, arr);
        cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1);
      }
    }

    return map;
  }, [calendarEvents]);

  // Month events list (for “Deployment Schedules”)
  const monthEvents = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);
    return calendarEvents.filter((ev) => {
      const s = new Date(ev.startISO);
      const e = new Date(ev.endISO);
      return s <= end && e >= start;
    });
  }, [calendarEvents, viewDate]);

  useEffect(() => {
    if (selectedVolunteer) setVolunteerStatus(statusOf(selectedVolunteer));
  }, [selectedVolunteer]);

  // Fetch volunteers + my profiles
  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        setLoading(true);

        const data = await getAllVolunteers();
        const orgData = await getAllOrganizationVolunteers();

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

    // try fetch "my" individual/org volunteer profiles (requires auth)
    const fetchMyProfiles = async () => {
      try {
        const iv = await fetch(`${API_BASE}/volunteer/my_profile`, { credentials: "include" });
        if (iv.ok) {
          const data = await iv.json();
          setMyVolunteer({ ...data, status: normalizeStatus(data) });
        }
      } catch {/* ignore */}

      try {
        const ov = await fetch(`${API_BASE}/organization_volunteer/my_profile`, { credentials: "include" });
        if (ov.ok) {
          const data = await ov.json();
          setMyOrgVolunteer({ ...data, status: normalizeStatus(data) });
        }
      } catch {/* ignore */}
    };

    fetchVolunteers();
    fetchMyProfiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalVolunteersNumber = useMemo(() => {
    const ind = volunteers.filter((v) => statusOf(v) === "approved").length;
    const org = organizationVolunteers.filter((v) => statusOf(v) === "approved").length;
    return ind + org;
  }, [volunteers, organizationVolunteers]);

  const totalApplicantsNumber = useMemo(() => {
    const ind = volunteers.filter((v) => statusOf(v) !== "approved").length;
    const org = organizationVolunteers.filter((v) => statusOf(v) !== "approved").length;
    return ind + org;
  }, [volunteers, organizationVolunteers]);

  const totalApplicants = totalApplicantsNumber.toLocaleString();
  const totalVolunteers = totalVolunteersNumber.toLocaleString();

  const openProgramModal = (): void => setIsProgramModalOpen(true);
  const closeProgramModal = (): void => setIsProgramModalOpen(false);
  const openVolunteerModal = (): void => setIsVolunteerModalOpen(true);
  const closeVolunteerModal = (): void => setIsVolunteerModalOpen(false);
  const openReportModal = (): void => setIsReportsModalOpen(true);
  const closeReportModal = (): void => setIsReportsModalOpen(false);
  const isOpsAdmin = userType === "user" && userRoles.includes("operations admin");

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

  const formatDate = (date: Date) => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    return {
      dayName: days[date.getDay()],
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear(),
    };
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

  // ---- Derived: Approved Organizations for "Accredited Partners" ----
  const approvedPartners = useMemo(
    () => organizationVolunteers.filter((o) => (o?.status ?? "").toLowerCase() === "approved"),
    [organizationVolunteers]
  );

  // ---------- JOIN LOGIC ----------
  const canJoin = (n: NewsAnnouncement) =>
    n.lifecycle !== "finished" && n.currentVolunteers < n.maxVolunteers;

  const joinProgram = async (n: NewsAnnouncement) => {
    if (!canJoin(n)) return;

    // prefer individual volunteer if approved; else try org volunteer if approved
    const iv = myVolunteer && statusOf(myVolunteer) === "approved" ? myVolunteer : null;
    const ov = myOrgVolunteer && statusOf(myOrgVolunteer) === "approved" ? myOrgVolunteer : null;

    if (!iv && !ov) {
      // Not a volunteer yet, or not approved → guide to Become a Volunteer
      setIsVolunteerModalOpen(true);
      return;
    }

    try {
      setJoining((prev) => ({ ...prev, [n.id]: true }));

      if (iv) {
        await apiCreateAssignment(n.id, { individual_volunteer_id: iv.volunteer_id });
      } else if (ov) {
        await apiCreateAssignment(n.id, { organization_volunteer_id: ov.volunteer_id });
      }

      message.success(`You joined "${n.title}"`);
      // update local counters
      setNewsAnnouncements((prev) =>
        prev.map((x) =>
          x.id === n.id
            ? {
                ...x,
                currentVolunteers: Math.min(x.currentVolunteers + 1, x.maxVolunteers),
                volunteersNeeded: Math.max(x.volunteersNeeded - 1, 0),
              }
            : x
        )
      );
    } catch (e: any) {
      const detail =
        e?.response?.data?.detail ||
        e?.message ||
        "Failed to join this event";
      // Handle duplicate join (409) gracefully if your backend returns it
      if (String(detail).toLowerCase().includes("already") || e?.response?.status === 409) {
        message.info("You already joined this event.");
      } else {
        message.error(detail);
      }
    } finally {
      setJoining((prev) => ({ ...prev, [n.id]: false }));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="main-container">
        <div className="content">
          <div className="content-grid">
            {/* Left column */}
            <div className="left-column">
              {/* Total Applicants */}
              <div className="card total-card applicants">
                <div className="card-content">
                  <div className="card-title-white">Total Applicants</div>
                  <div className="card-number">{totalApplicants}</div>
                </div>
                {isOpsAdmin ? (
                  <button className="manage-btn" onClick={() => navigate("/volunteer_management/manage_applicant")}>
                    Manage Applicants
                  </button>
                ) : (String(volunteerStatus) === "submitted" || String(volunteerStatus) === "verifying") ? (
                  <button
                    className="manage-btn"
                    style={{ fontSize: "88%" }}
                    onClick={() => navigate("/volunteer_management/track_volunteer_application")}
                  >
                    Track Volunteer Application
                  </button>
                ) : (
                  <button
                    className="manage-btn"
                    style={{ fontSize: "90%" }}
                    onClick={() => setIsVolunteerModalOpen(true)}
                  >
                    Become a Volunteer
                  </button>
                )}
              </div>

              {/* Total Volunteers */}
              <div className="card total-card volunteers">
                <div className="card-content">
                  <div className="card-title-white">Total Volunteers</div>
                  <div className="card-number">{totalVolunteers}</div>
                </div>
                {userType === "user" && userRoles.includes("operations admin") ? (
                  <>
                    <button
                      className="manage-btn"
                      style={{ fontSize: "98%" }}
                      onClick={() => setIsReportsModalOpen(true)}
                    >
                      Generate Reports
                    </button>
                    <button
                      className="generate-btn"
                      style={{ fontSize: "98%"}}
                      onClick={() => navigate("/volunteer_management/volunteer_assignment")}
                    >
                      Manage Volunteers
                    </button>
                  </>
                ) : (
                  <button
                    className="manage-btn"
                    style={{ display: "none" }}
                    onClick={() => navigate("/volunteer_management/become_volunteer")}
                  >
                    Become a Volunteer
                  </button>
                )}
              </div>

              {/* Cards grid */}
              <div className="cards-grid">
                {/* Active Volunteers (Top 3 by programs joined) */}
                <div className="card">
                  <h2 className="blue-title">Active Volunteers</h2>
                  <div className="volunteer-list">
                    {top3ActiveVolunteers.length === 0 ? (
                      <Empty description="No active volunteers yet" />
                    ) : (
                      top3ActiveVolunteers.map((v) => {
                        const name = fullName(v) || "Unnamed Volunteer";
                        const programs = Number(v.events_joined ?? 0);

                        const picUrl = v.profile_picture ? toAbsoluteFileUrl(v.profile_picture) : "";

                        return (
                          <div key={v.volunteer_id} className="volunteer-item">
                            {picUrl ? (
                              <img
                                src={picUrl}
                                alt={`${name} avatar`}
                                className="volunteer-avatar"
                              />
                            ) : (
                              <div className="volunteer-avatar placeholder" aria-label={`${name} placeholder`}>
                                {getInitial(name)}
                              </div>
                            )}

                            <div className="volunteer-info">
                              <div className="volunteer-name">{name}</div>
                              <div className="volunteer-meta">
                                {programs} program{programs === 1 ? "" : "s"} joined
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Accredited Partners (dynamic) */}
                <div className="card">
                  <h2 className="blue-title">Accredited Partners</h2>

                  <div className="partner-list">
                    {approvedPartners.length === 0 ? (
                      <Empty description="No accredited partners yet" />
                    ) : (
                      approvedPartners.map((org) => {
                        const logoPath = getOrgLogoPath(org);
                        const logoUrl = logoPath ? toAbsoluteFileUrl(logoPath) : "";
                        const orgName = String(org?.organization_name ?? "—").trim();
                        const orgEmail = String(org?.organization_email ?? "").trim();

                        return (
                          <div key={org.volunteer_id ?? org.id ?? orgName} className="partner-item">
                            {/* Circular logo / fallback */}
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={`${orgName} logo`}
                                className="partner-avatar"
                              />
                            ) : (
                              <div className="partner-avatar placeholder" aria-label={`${orgName} placeholder`}>
                                {getInitial(orgName)}
                              </div>
                            )}

                            <div className="partner-info">
                              <div className="partner-name">{orgName}</div>
                              {orgEmail ? (
                                <a className="partner-email" href={`mailto:${orgEmail}`} title={orgEmail}>
                                  {orgEmail}
                                </a>
                              ) : (
                                <div className="partner-email muted">No email provided</div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
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
                      {monthEvents.length > 0 ? (
                        monthEvents.map((ev, i) => (
                          <div key={i} className="deployment-item">
                            <div className="deployment-item-title">{ev.title}</div>
                            <div className="deployment-item-date flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {fmtRange(ev.startISO, ev.endISO)}
                            </div>
                            {ev.location && (
                              <div className="deployment-item-location flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {ev.location}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p>
                          No scheduled deployments for {formatDate(viewDate).month} {viewDate.getFullYear()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Calendar with hover tooltips */}
                  <div className="calendar-section">
                    <div className="calendar-header">
                      <button onClick={prevMonth} className="calendar-nav-btn">&lt;</button>
                      <div>
                        <div className="day-name">{formatDate(currentDate).dayName}</div>
                        <div className="date-display">
                          <span className="month-day">{formatDate(currentDate).month} {formatDate(currentDate).day}</span>
                          <span className="year">{formatDate(currentDate).year}</span>
                        </div>
                      </div>
                      <button onClick={nextMonth} className="calendar-nav-btn">&gt;</button>
                    </div>

                    <div className="calendar">
                      <div className="weekdays">
                        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                          <div key={d} className="weekday">{d}</div>
                        ))}
                      </div>

                      <div className="days">
                        {generateCalendarDays().map((d, idx) => {
                          const cellDate = d
                            ? new Date(viewDate.getFullYear(), viewDate.getMonth(), d)
                            : null;
                          const key = cellDate ? ymd(cellDate) : "";
                          const dayEvents = cellDate ? (eventsByDay.get(key) ?? []) : [];
                          const count = dayEvents.length;

                          return (
                            <div key={idx} className="calendar-day-container relative">
                              {d && (
                                <div
                                  onClick={() => selectDate(d)}
                                  onMouseEnter={() => setHoveredDayKey(key)}
                                  onMouseLeave={() => setHoveredDayKey((prev) => (prev === key ? null : prev))}
                                  className={`calendar-day ${isToday(d) ? "today" : ""} ${isSelected(d) && !isToday(d) ? "selected" : ""}`}
                                >
                                  {/* keep original layout: just show the number */}
                                  <span className="day-number">{d}</span>

                                  {/* tiny dot in lower-right if there are events */}
                                  {count > 0 && <span className="event-dot-small" aria-hidden="true" />}

                                  {/* Hover tooltip (now LEFT of the cell) */}
                                  {hoveredDayKey === key && count > 0 && (
                                    <div
                                      className="absolute z-10 bg-white border border-gray-200 rounded shadow-md p-2 text-xs w-64 tooltip-left"
                                      style={{ right: "110%", top: "50%", transform: "translateY(-50%)" }}
                                    >
                                      <div className="font-semibold mb-1">
                                        {count} event{count > 1 ? "s" : ""} on {cellDate?.toLocaleDateString()}
                                      </div>
                                      <div className="max-h-48 overflow-auto space-y-2">
                                        {dayEvents.map((ev, i2) => (
                                          <div key={`${ev.id}-${i2}`} className="border border-gray-100 rounded p-1">
                                            <div className="text-gray-900 font-medium">{ev.title}</div>
                                            <div className="text-gray-600 flex items-center gap-1">
                                              <CalendarIcon className="w-3 h-3" />
                                              {fmtRange(ev.startISO, ev.endISO)}
                                            </div>
                                            {ev.location && (
                                              <div className="text-gray-600 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {ev.location}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* (kept the original “no bottom list”, tooltip only) */}
                  </div>
                </div>
              </div>

              {/* News & Announcements */}
              <div className="card news-card">
                <div className="news-header">
                  <h2 className="news-title">News & Announcements</h2>
                  {isOpsAdmin ? (
                    <button
                      onClick={() => navigate("/volunteer_management/volunteer_assignment")}
                      className="add-program-btn"
                    >
                      + Add Program
                    </button>
                  ) : (
                    <button
                      className="manage-btn"
                      style={{ display: "none" }}
                      onClick={() => setIsVolunteerModalOpen(true)}
                    >
                      Become a Volunteer
                    </button>
                  )}
                </div>

                <div className="news-list">
                  {activeNewsAnnouncements.length === 0 ? (
                    <Empty description="No News & Announcements yet" />
                  ) : (
                    activeNewsAnnouncements.map((item) => {
                      const pct =
                        item.maxVolunteers > 0
                          ? Math.min(100, Math.max(0, (item.currentVolunteers / item.maxVolunteers) * 100))
                          : 0;
                      const barColor =
                        item.currentVolunteers >= item.maxVolunteers ? "bg-red-500" : "bg-blue-600";
                      const disabled = !canJoin(item) || !!joining[item.id];
                      const buttonLabel = item.lifecycle === "finished"
                        ? "Closed"
                        : (item.currentVolunteers >= item.maxVolunteers ? "Full" : (joining[item.id] ? "Joining..." : "Join"));

                      return (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow mb-4 bg-white"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold" style={{ color: "#749ab6" }}>{item.title}</h3>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs ${item.lifecycle === "incoming"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : item.lifecycle === "ongoing"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                    }`}
                                >
                                  {item.lifecycle}
                                </span>
                              </div>
                              {item.description && (
                                <p className="text-gray-600 text-sm">{item.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {item.location || "TBA"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-4 h-4" />
                                  {fmtRange(item.start_at, item.end_at, item.task_date)}
                                </span>
                              </div>
                            </div>

                            {/* JOIN BUTTON */}
                            {!isOpsAdmin && (
                              <button
                                onClick={() => joinProgram(item)}
                                disabled={disabled}
                                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                                  disabled
                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                                title={disabled ? "You can't join this event now" : "Join this event"}
                              >
                                {buttonLabel}
                              </button>
                            )}
                          </div>

                          {/* Assigned / Capacity + progress + Needed */}
                          <div className="mb-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-700">Volunteers Assigned</span>
                              <span
                                className={
                                  item.currentVolunteers >= item.maxVolunteers ? "text-red-600" : "text-gray-600"
                                }
                              >
                                {item.currentVolunteers} / {item.maxVolunteers}
                              </span>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            <div className="flex justify-between text-sm mt-1">
                              <span className="text-gray-700">Needed</span>
                              <span className={item.volunteersNeeded === 0 ? "text-green-600" : "text-gray-700"}>
                                {item.volunteersNeeded}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isProgramModalOpen} onClose={closeProgramModal} />
      <VolunteerModal isOpen={isVolunteerModalOpen} onClose={closeVolunteerModal} />
      <ReportModal isOpen={isReportsModalOpen} onClose={closeReportModal}/>
    </div>
  );
}

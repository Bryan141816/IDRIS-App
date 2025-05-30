import React, { useState,useEffect } from 'react';
import './css/VolunteerDashboard.css'; // We'll create this CSS file separately
import Modal from './Modal'; // Import Modal component
import VolunteerModal from './VolunteerModal';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../../../UserContext';
import { useUserRoleContext } from '../../../UserRoleContext';

export default function IDRISDashboard() {
    const { userRole } = useUserRoleContext();
    const {userType} = useUserContext();

    const navigate = useNavigate();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewDate, setViewDate] = useState(new Date());
    const [today] = useState(new Date());

    const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
    const [isVolunteerModalOpen, setIsVolunteerModalOpen] = useState(false);

    // Functions for Program Modal
    const openProgramModal = () => {
    setIsProgramModalOpen(true);
    };
    const closeProgramModal = () => {
    setIsProgramModalOpen(false);
    };

    // Functions for Volunteer Modal
    const openVolunteerModal = () => {
    setIsVolunteerModalOpen(true);
    };
    const closeVolunteerModal = () => {
    setIsVolunteerModalOpen(false);
    };
  // Mock data
  const totalApplicants = "100,000";
  const totalVolunteers = "100,000";

  const activeVolunteers = [
    { id: 1, name: "Volunteer Name", programs: 20, status: "joined" },
    { id: 2, name: "Volunteer Name", programs: 15, status: "joined" },
    { id: 3, name: "Volunteer Name", programs: 10, status: "joined" }
  ];

  const accreditedPartners = [
    { id: 1, name: "Sample Organization" },
    { id: 2, name: "Sample Organization" },
    { id: 3, name: "Sample Organization" }
  ];

  const newsAnnouncements = [
    {
      id: 1,
      title: "Example Program",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum orci ......",
      date: "March 1 - 2, 2025",
      ongoing: true
    },
    {
      id: 2,
      title: "Example Program",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum orci ......",
      date: "March 5 - 10, 2025",
      ongoing: false
    },
    {
      id: 3,
      title: "Example Program",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum orci ......",
      date: "March 15 - 20, 2025",
      ongoing: false
    },
    {
      id: 4,
      title: "Another Example Program",
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum orci ......",
      date: "April 1 - 5, 2025",
      ongoing: false
    }
  ];



  useEffect(() => {
    // Retrieve saved date from localStorage if available
    const savedDate = localStorage.getItem('viewDate');
    if (savedDate) {
      setViewDate(new Date(savedDate));
    } else {
      setViewDate(new Date()); // Default to today's date if nothing is saved
    }
  }, []);

  useEffect(() => {
    // Save the current viewDate to localStorage
    localStorage.setItem('viewDate', viewDate.toISOString());
  }, [viewDate]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };


  // Format date for display
  const formatDate = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return {
      dayName: days[date.getDay()],
      day: date.getDate(),
      month: months[date.getMonth()],
      year: date.getFullYear()
    };
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  };

  const isToday = (day: number) => {
    return day === today.getDate() &&
      viewDate.getMonth() === today.getMonth() &&
      viewDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === currentDate.getDate() &&
      viewDate.getMonth() === currentDate.getMonth() &&
      viewDate.getFullYear() === currentDate.getFullYear();
  };

  const selectDate = (day: number | undefined) => {
    if (day) {
      setCurrentDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
    }
  };

  // Get formatted date
  const formattedDate = formatDate(currentDate);
  const days = generateCalendarDays();
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Mock deployment schedules
  const deploymentSchedules = [
    { date: '2025-01-05', title: 'Field Deployment', location: 'Central District' },
    { date: '2025-01-12', title: 'Emergency Response', location: 'Eastern Region' },
    { date: '2025-01-20', title: 'Volunteer Training', location: 'Headquarters' },
    { date: '2025-02-10', title: 'Community Outreach', location: 'Southern Region' },
    { date: '2025-03-15', title: 'Disaster Preparedness', location: 'Western District' }
  ];

  // Filter schedules for current month
  const currentMonthSchedules = deploymentSchedules.filter(schedule => {
    const scheduleDate = new Date(schedule.date);
    return scheduleDate.getMonth() === viewDate.getMonth() &&
           scheduleDate.getFullYear() === viewDate.getFullYear();
  });

  // Check if a day has a schedule
  const hasSchedule = (day: number) => {
    if (!day) return false;
    const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return deploymentSchedules.some(schedule => schedule.date === dateStr);
  };

  return (
    <div className="dashboard-container">


      {/* Main container */}
      <div className="main-container">

        {/* Main content */}
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
                    {userType === 'admin' && userRole === "operations admin" ? (
                    <button className="manage-btn" onClick={() => navigate('/volunteer_management/manage_applicant')}>
                    Manage Applicants
                    </button>
                    ) : (
                        <button  className="manage-btn" style={{ fontSize: '17.4px' }} onClick={openVolunteerModal}>
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
            { userType === 'admin' && userRole === "operations admin" ? (
            <button className="manage-btn" onClick={() => navigate('/volunteer_management/manage_volunteers')}>
            Manage Volunteers
            </button>
            ) : (
            <button className="manage-btn" style={{display:'none'}} onClick={() => navigate('/volunteer_management/become_volunteer')}>
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
                    {activeVolunteers.map(volunteer => (
                      <div key={volunteer.id} className="volunteer-item">
                        <div className="volunteer-avatar"></div>
                        <div className="volunteer-info">
                          <div className="volunteer-name">{volunteer.name}</div>
                          <div className="volunteer-meta">{volunteer.programs} Programs {volunteer.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accredited Partners */}
                <div className="card">
                  <h2 className="blue-title">Accredited Partners</h2>
                  <div className="partner-list">
                    {accreditedPartners.map(partner => (
                      <div key={partner.id} className="partner-item">
                        <div className="partner-logo"></div>
                        <div className="partner-info">
                          <div className="partner-name">{partner.name}</div>
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
                        currentMonthSchedules.map((schedule, index) => (
                          <div key={index} className="deployment-item">
                            <div className="deployment-item-title">{schedule.title}</div>
                            <div className="deployment-item-date">{schedule.date.split('-')[2]}, {formatDate(viewDate).month}</div>
                            <div className="deployment-item-location">{schedule.location}</div>
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
                        <div className="day-name">{formatDate(currentDate).dayName}</div> {/* CHANGE TO currentDate */}
                        <div className="date-display">
                        <span className="month-day">{formattedDate.month} {formattedDate.day}</span> {/* use formattedDate */}
                        <span className="year">{formattedDate.year}</span> {/* use formattedDate */}
                        </div>
                    </div>
                    <button onClick={nextMonth} className="calendar-nav-btn">&gt;</button>
                    </div>



                    <div className="calendar">
                      <div className="weekdays">
                        {weekdays.map(day => (
                          <div key={day} className="weekday">{day}</div>
                        ))}
                      </div>

                      <div className="days">
                        {days.map((day, idx) => (
                          <div key={idx} className="calendar-day-container">
                            {day && (
                              <div
                                onClick={() => selectDate(day)}
                                className={`calendar-day ${isToday(day) ? 'today' : ''} ${isSelected(day) && !isToday(day) ? 'selected' : ''} ${hasSchedule(day) ? 'has-schedule' : ''}`}
                              >
                                {day}
                                {hasSchedule(day) && <span className="schedule-indicator"></span>}
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
                  {userType === 'admin' ? (
            <button onClick={openProgramModal} className="add-program-btn">+ Add Program</button>
            ) : (
            <button className="manage-btn" style={{display:'none'}} onClick={() => navigate('/volunteer_management/become_volunteer')}>
            Become a Volunteer
            </button>
            )}

                </div>

                <div className="news-list">
                  {newsAnnouncements.map(item => (
                    <div key={item.id} className="news-item">
                      <div className="edit-icon">✏️</div>
                      <h3 className="news-item-title">{item.title}</h3>
                      <p className="news-item-desc">{item.description}</p>
                      <div className="news-item-meta">
                        <span className="news-item-date">{item.date}</span>
                        {item.ongoing && (
                          <span className="ongoing-badge">Ongoing</span>
                        )}
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

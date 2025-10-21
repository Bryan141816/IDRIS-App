import React, { useState, useEffect } from 'react';

import { Button, Breadcrumb, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { getUserProfileByUserId } from '../../../API_Handler/user_profile_handler';
import { getVolunteerByUserId } from '../../../API_Handler/individual_volunter_handler';
import { getOrganizationVolunteerByUserId } from '../../../API_Handler/organization_volunteer_handler';
import { fetchCurrentUserId } from '../../../API_Handler/auth';
import { useUserContext } from "../../../UserContext"
import userProfile from "../../../media/account-profile.png";;
import dayjs from 'dayjs';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './css/VolunteerProfile.css';
import { API } from '../../../API_Handler/Axio_API_Handler';

// Fix for Leaflet marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Define interfaces for type safety
interface PersonalInfo {
    age: number;
    dateOfBirth: string;
    phoneNumber: string;
    address: string;
    gender: string;
}

interface Location {
    lat: number;
    lng: number;
}

interface VolunteerData {
    name: string;
    role: string;
    certified: boolean;
    address: string;
    personalInfo: PersonalInfo;
    location: Location;
    description?: string;
    skillsAndInterest?: string[];
    availability?: string;
    credentials?: string[];
    volunteerId?: string;
    statistics?: {
        totalPrograms: number;
        monthlyActivity: number;
        joinDate: string;
        lastActiveDate?: string;
        status: string;
    };
}

// Define tab types
type TabType = 'personalInfo' | 'description' | 'skillsAndInterest' | 'availability' | 'credentials';

const VolunteerProfile: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('personalInfo');
    const [volunteerData, setVolunteerData] = useState<VolunteerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isIndividual, setIsIndividual] = useState(true); // Track volunteer type

    // Calculate age from birthdate
    const calculateAge = (birthDate: string): number => {
        const birth = dayjs(birthDate);
        const today = dayjs();
        let age = today.year() - birth.year();
        if (
            today.month() < birth.month() ||
            (today.month() === birth.month() && today.date() < birth.date())
        ) {
            age--;
        }
        return age;
    };
    const { email, username, userId, userImage } = useUserContext();
    const profileImage = userImage
        ? `${API.defaults.baseURL}/${userImage}`
        : userProfile;

    console.log("User Image:", userImage);
    // Add this function before the VolunteerProfile component
    const calculateMonthlyActivity = (joinDate?: string, lastActive?: string): number => {
        if (!joinDate) return 0;

        const start = dayjs(joinDate);
        const end = lastActive ? dayjs(lastActive) : dayjs();

        const months = end.diff(start, 'month');
        return Math.max(months, 0);
    };

    // Add this helper function at the top of your file, after the calculateAge function
    const generateMonthlyProgramData = (joinDate: string, totalPrograms: number, lastActiveDate?: string) => {
        const start = dayjs(joinDate);
        const end = lastActiveDate ? dayjs(lastActiveDate) : dayjs();
        const monthsDiff = end.diff(start, 'month') + 1;

        if (monthsDiff <= 0) return [];

        // Generate data for each month
        const data = [];
        const avgPerMonth = totalPrograms / monthsDiff;

        for (let i = 0; i < Math.min(monthsDiff, 12); i++) {
            const month = start.add(i, 'month');
            // Add some variation to make the graph more realistic
            const variance = (Math.random() - 0.5) * avgPerMonth * 0.4;
            const programs = Math.max(0, Math.round(avgPerMonth + variance));

            data.push({
                month: month.format('MMM YYYY'),
                programs: programs,
                cumulative: Math.round(avgPerMonth * (i + 1))
            });
        }

        return data;
    };
    useEffect(() => {
        async function loadVolunteerProfile() {
            try {
                setLoading(true);

                // 1️⃣ Get current user ID
                const currentUser = await fetchCurrentUserId();
                if (!currentUser?.id) {
                    console.warn("No user ID found.");
                    setLoading(false);
                    return;
                }

                // 2️⃣ Fetch user profile
                const userProfile = await getUserProfileByUserId(currentUser.id);
                if (!userProfile) {
                    console.warn("User profile not found.");
                    setLoading(false);
                    return;
                }

                // 3️⃣ Try to fetch individual volunteer data first
                let volunteerInfo = null;
                let isIndividualVolunteer = true;

                try {
                    volunteerInfo = await getVolunteerByUserId(); // ✅ Removed currentUser.id parameter
                } catch (error) {
                    console.log("Not an individual volunteer, checking organization...");
                    isIndividualVolunteer = false;
                }

                // 4️⃣ If not individual, try organization volunteer
                if (!volunteerInfo) {
                    try {
                        volunteerInfo = await getOrganizationVolunteerByUserId(); // ✅ Removed currentUser.id parameter
                        isIndividualVolunteer = false;
                    } catch (error) {
                        console.warn("No volunteer record found.");
                        setLoading(false);
                        return;
                    }
                }

                setIsIndividual(isIndividualVolunteer);

                // 5️⃣ Format the data
                const fullName = [userProfile.first_name, userProfile.last_name]
                    .filter(Boolean)
                    .join(" ");

                const formattedData: VolunteerData = {
                    name: fullName || "Volunteer Name",
                    role: isIndividualVolunteer
                        ? `Individual Volunteer (ID: ${volunteerInfo?.volunteer_id || 'N/A'})`
                        : `Organization Volunteer (ID: ${volunteerInfo?.org_volunteer_id || 'N/A'})`,
                    certified: volunteerInfo?.status === 'approved' || false,
                    address: userProfile.address || "Address not available",
                    personalInfo: {
                        age: userProfile.bday ? calculateAge(userProfile.bday) : 0,
                        dateOfBirth: userProfile.bday
                            ? dayjs(userProfile.bday).format('MMMM DD, YYYY').toUpperCase()
                            : "N/A",
                        phoneNumber: userProfile.phone_number || "N/A",
                        address: userProfile.address || "N/A",
                        gender: userProfile.gender || "N/A"
                    },
                    location: {
                        lat: userProfile.latitude || 10.3157,
                        lng: userProfile.longitude || 123.8854
                    },
                    description: userProfile?.bio || volunteerInfo?.description || "No description available.",
                    skillsAndInterest: (() => {
                        // Safe skills/services handler
                        const data = isIndividualVolunteer ? volunteerInfo?.skills : volunteerInfo?.services_offered;

                        if (!data) return [];
                        if (Array.isArray(data)) return data;
                        if (typeof data === 'string') return data.split(',').map((s: string) => s.trim());
                        return [];
                    })(),
                    availability: volunteerInfo?.availability || "Not specified",
                    credentials: (() => {
                        const certs = volunteerInfo?.certifications || volunteerInfo?.certification;
                        if (!certs) return [];
                        if (Array.isArray(certs)) return certs;
                        if (typeof certs === 'string') return certs.split(',').map((c: string) => c.trim());
                        return [];
                    })(),
                    volunteerId: volunteerInfo?.volunteer_id || volunteerInfo?.org_volunteer_id || 'N/A',

                    statistics: {
                        totalPrograms: Number(
                            volunteerInfo?.events_joined ??
                            volunteerInfo?.active_events_joined ??
                            volunteerInfo?.tasks_joined ??
                            volunteerInfo?.active_tasks_joined ?? 0
                        ),
                        monthlyActivity: calculateMonthlyActivity(
                            volunteerInfo?.created_at ?? volunteerInfo?.join_date,
                            volunteerInfo?.last_active_date
                        ),
                        joinDate: volunteerInfo?.created_at ?? volunteerInfo?.join_date ?? new Date().toISOString(),
                        lastActiveDate: volunteerInfo?.last_active_date ?? volunteerInfo?.updated_at,
                        status: volunteerInfo?.status || 'N/A'
                    }
                };

                setVolunteerData(formattedData);

            } catch (error) {
                console.error("Error loading volunteer profile:", error);
            } finally {
                setLoading(false);
            }
        }

        loadVolunteerProfile();
    }, []);

    const renderTabContent = (): React.ReactNode => {
        if (!volunteerData) return <p>No data available</p>;

        switch (activeTab) {
            case 'personalInfo':
                return (
                    <div className="info-content">
                        <div className="info-grid">
                            <div className="info-item">
                                <div className="info-label">Age</div>
                                <div className="info-value">
                                    <span className="info-icon"></span> {volunteerData.personalInfo.age}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Date of Birth</div>
                                <div className="info-value">
                                    <span className="info-icon"></span> {volunteerData.personalInfo.dateOfBirth}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Phone Number</div>
                                <div className="info-value">
                                    <span className="info-icon"></span> {volunteerData.personalInfo.phoneNumber}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Address</div>
                                <div className="info-value">
                                    <span className="info-icon"></span> {volunteerData.personalInfo.address}
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Gender</div>
                                <div className="info-value">
                                    <span className="info-icon"></span> {volunteerData.personalInfo.gender}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'description':
                return (
                    <div className="info-content">
                        <p>{volunteerData.description || 'No description available for this volunteer.'}</p>
                    </div>
                );
            case 'skillsAndInterest':
                return (
                    <div className="info-content">
                        {volunteerData.skillsAndInterest && volunteerData.skillsAndInterest.length > 0 ? (
                            <ul>
                                {volunteerData.skillsAndInterest.map((skill, index) => (
                                    <li key={index}>{skill}</li>
                                ))}
                            </ul>
                        ) : (
                            <p>No {isIndividual ? 'skills and interests' : 'services'} listed for this volunteer.</p>
                        )}
                    </div>
                );
            case 'availability':
                return (
                    <div className="info-content">
                        <p>{volunteerData.availability || 'Availability schedule not set.'}</p>
                    </div>
                );
            case 'credentials':
                return (
                    <div className="info-content">
                        {volunteerData.credentials && volunteerData.credentials.length > 0 ? (
                            <div className="credentials-list">
                                {volunteerData.credentials.map((credential, index) => {
                                    // Handle if credential is a full URL or relative path
                                    const fileUrl = credential.startsWith('http')
                                        ? credential
                                        : `${API.defaults.baseURL}/${credential}`;

                                    // Extract filename from path
                                    const fileName = credential.split('/').pop() || `Certificate_${index + 1}`;

                                    // Get file extension
                                    const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'FILE';

                                    // Get file name without extension
                                    const fileNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;

                                    return (
                                        <div key={index} className="credential-item">
                                            <div className="credential-info">
                                                <span className="file-icon">📄</span>
                                                <div className="file-details">
                                                    <div className="file-name">{fileNameWithoutExt}</div>
                                                    <div className="file-type">{fileExtension} File</div>
                                                </div>
                                            </div>
                                            <a
                                                href={fileUrl}
                                                download={fileName}
                                                className="download-btn"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    // Trigger download
                                                    fetch(fileUrl)
                                                        .then(response => response.blob())
                                                        .then(blob => {
                                                            const url = window.URL.createObjectURL(blob);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.download = fileName;
                                                            document.body.appendChild(link);
                                                            link.click();
                                                            document.body.removeChild(link);
                                                            window.URL.revokeObjectURL(url);
                                                        })
                                                        .catch(error => {
                                                            console.error('Download failed:', error);
                                                            // Fallback: open in new tab
                                                            window.open(fileUrl, '_blank');
                                                        });
                                                }}
                                            >
                                                Download
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p>No credentials uploaded.</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const handleTabClick = (tab: TabType): void => {
        setActiveTab(tab);
    };

    if (loading) {
        return (
            <div className="volunteer-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Spin size="large" tip="Loading volunteer profile..." />
            </div>
        );
    }

    if (!volunteerData) {
        return (
            <div className="volunteer-container">
                <h2 className="page-title">Volunteer Profile</h2>
                <p>No volunteer data found. Please submit your volunteer application first.</p>
            </div>
        );
    }

    const mapCenter: LatLngExpression = [volunteerData.location.lat, volunteerData.location.lng];

    return (
        <div className="volunteer-container">
            {/* Breadcrumb Navigation */}
            <h2 className="page-title">Volunteer Profile</h2>
            <Breadcrumb>
                <Breadcrumb.Item><Link to="/">Home</Link></Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link to="/volunteer_management/volunteer_dashboard">
                        Volunteer Dashboard
                    </Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    <span>Volunteer Profile</span>
                </Breadcrumb.Item>
            </Breadcrumb>

            {/* Main Content */}
            <div className="main-content1">
                <div className="profile-container">
                    {/* Banner and Profile Info */}
                    <div className="profile-header">
                        <div className="profile-banner">
                            {/* Mountain background image will be set via CSS */}
                        </div>
                        <div className="profile-info">
                            <div className="profile-avatar">

                                <img
                                    src={profileImage}
                                    alt="user-profile"
                                    style={{ borderRadius: "50%" }}
                                />
                            </div>
                            <div className="profile-details">
                                <h2 className="volunteer-name">
                                    <span className="name-text">{volunteerData.name}</span>
                                    {volunteerData.certified && (
                                        <span className="certified-badge">Approved</span>
                                    )}
                                </h2>
                                <p className="volunteer-role">{volunteerData.role}</p>
                            </div>
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="profile-content">
                        <div className="profile-left">
                            <div className="address-label">( Volunteer Address )</div>
                            <div className="map-placeholder">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={13}
                                    scrollWheelZoom={false}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <Marker position={mapCenter}>
                                        <Popup>
                                            {volunteerData.address}
                                        </Popup>
                                    </Marker>
                                </MapContainer>
                            </div>
                            <div className="address-text">{volunteerData.address}</div>
                        </div>

                        <div className="profile-right">
                            <h2 className="about-title">About</h2>
                            <div className="about-container">
                                <div className="about-sidebar">
                                    <div
                                        className={`sidebar-item ${activeTab === 'personalInfo' ? 'active' : ''}`}
                                        onClick={() => handleTabClick('personalInfo')}
                                    >
                                        Personal Information
                                    </div>
                                    <div
                                        className={`sidebar-item ${activeTab === 'description' ? 'active' : ''}`}
                                        onClick={() => handleTabClick('description')}
                                    >
                                        Description
                                    </div>
                                    <div
                                        className={`sidebar-item ${activeTab === 'skillsAndInterest' ? 'active' : ''}`}
                                        onClick={() => handleTabClick('skillsAndInterest')}
                                    >
                                        {isIndividual ? 'Skills and Interest' : 'Services Offered'}
                                    </div>
                                    <div
                                        className={`sidebar-item ${activeTab === 'availability' ? 'active' : ''}`}
                                        onClick={() => handleTabClick('availability')}
                                    >
                                        Availability
                                    </div>
                                    <div
                                        className={`sidebar-item ${activeTab === 'credentials' ? 'active' : ''}`}
                                        onClick={() => handleTabClick('credentials')}
                                    >
                                        Certifications
                                    </div>
                                </div>
                                <div className="about-content">
                                    {renderTabContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Statistics Section */}
                    {volunteerData.statistics && (
                        <div className="statistics-section">
                            <h2 className="statistics-title">Volunteer Statistics</h2>
                            <div className="statistics-grid">
                                <div className="stat-card">
                                    <div className="stat-icon">📊</div>
                                    <div className="stat-content">
                                        <p className="stat-label">Total Programs Joined</p>
                                        <p className="stat-value">{volunteerData.statistics.totalPrograms}</p>
                                    </div>
                                </div>

                                <div className="stat-card">
                                    <div className="stat-icon">📅</div>
                                    <div className="stat-content">
                                        <p className="stat-label">Months Active</p>
                                        <p className="stat-value">{volunteerData.statistics.monthlyActivity}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">📈</div>
                                    <div className="stat-content">
                                        <p className="stat-label">Average Programs/Month</p>
                                        <p className="stat-value">
                                            {volunteerData.statistics.monthlyActivity > 0
                                                ? (volunteerData.statistics.totalPrograms / volunteerData.statistics.monthlyActivity).toFixed(1)
                                                : '0'}
                                        </p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon">🎯</div>
                                    <div className="stat-content">
                                        <p className="stat-label">Join Date</p>
                                        <p className="stat-value">
                                            {dayjs(volunteerData.statistics.joinDate).format('MMM DD, YYYY')}
                                        </p>
                                    </div>
                                </div>



                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VolunteerProfile;

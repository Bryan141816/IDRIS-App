import React, { useState, useEffect } from 'react';
import { Button, Breadcrumb, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { getUserProfileByUserId } from '../../../API_Handler/user_profile_handler';
import { getVolunteerByUserId } from '../../../API_Handler/individual_volunter_handler';
import { getOrganizationVolunteerByUserId } from '../../../API_Handler/organization_volunteer_handler';
import { fetchCurrentUserId } from '../../../API_Handler/auth';
import { useUserContext } from "../../../UserContext";
import userProfile from "../../../media/account-profile.png";
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

interface OrganizationInfo {
    organizationName: string;
    organizationType: string;
    phoneNumber: string;
    address: string;
    email: string;
    website?: string;
    establishedDate?: string;
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
    personalInfo?: PersonalInfo;
    organizationInfo?: OrganizationInfo;
    location: Location;
    description?: string;
    skillsAndInterest?: string[];
    availability?: string;
    credentials?: string[];
    volunteerId?: string;
    profileImage?: string;
    statistics?: {
        totalPrograms: number;
        monthlyActivity: number;
        joinDate: string;
        lastActiveDate?: string;
        status: string;
    };
}

// Define tab types
type TabType = 'personalInfo' | 'organizationInfo' | 'description' | 'skillsAndInterest' | 'availability' | 'credentials';

const VolunteerProfile: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('personalInfo');
    const [volunteerData, setVolunteerData] = useState<VolunteerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isIndividual, setIsIndividual] = useState(true);
    const [mapCenter, setMapCenter] = useState<LatLngExpression>([10.3157, 123.8854]);
    const [isGeocoding, setIsGeocoding] = useState(false);

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
    const defaultProfileImage = userImage
        ? `${API.defaults.baseURL}/${userImage}`
        : userProfile;

    const calculateMonthlyActivity = (joinDate?: string, lastActive?: string): number => {
        if (!joinDate) return 0;

        const start = dayjs(joinDate);
        const end = lastActive ? dayjs(lastActive) : dayjs();

        const months = end.diff(start, 'month');
        return Math.max(months, 0);
    };

    // Geocode address to get accurate coordinates
    const geocodeAddress = async (address: string) => {
        if (!address || address === "Address not available") {
            console.warn("No address to geocode");
            return null;
        }

        try {
            setIsGeocoding(true);
            console.log("🔍 Geocoding address:", address);

            const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const coords = data.features[0].geometry.coordinates;
                const lng = coords[0];
                const lat = coords[1];

                console.log("✅ Geocoded coordinates:", { lat, lng });
                return { lat, lng };
            } else {
                console.warn("⚠️ No geocoding results found");
                return null;
            }
        } catch (error) {
            console.error("❌ Geocoding error:", error);
            return null;
        } finally {
            setIsGeocoding(false);
        }
    };

    useEffect(() => {
        async function loadVolunteerProfile() {
            try {
                setLoading(true);

                // 1️⃣ Get current user ID
                const currentUser = await fetchCurrentUserId();
                console.log("Current User:", currentUser);

                if (!currentUser?.id) {
                    console.warn("No user ID found.");
                    setLoading(false);
                    return;
                }

                // 2️⃣ Fetch user profile
                const userProfileData = await getUserProfileByUserId(currentUser.id);
                console.log("User Profile Data:", userProfileData);

                if (!userProfileData) {
                    console.warn("User profile not found.");
                    setLoading(false);
                    return;
                }

                // 3️⃣ Try to fetch individual volunteer data first
                let volunteerInfo = null;
                let isIndividualVolunteer = true;

                try {
                    volunteerInfo = await getVolunteerByUserId();
                    console.log("Individual Volunteer Data:", volunteerInfo);

                    if (volunteerInfo) {
                        isIndividualVolunteer = true;
                    }
                } catch (error) {
                    console.log("Not an individual volunteer, checking organization...", error);
                }

                // 4️⃣ If not individual, try organization volunteer
                if (!volunteerInfo) {
                    try {
                        volunteerInfo = await getOrganizationVolunteerByUserId();
                        console.log("Organization Volunteer Data:", volunteerInfo);

                        if (volunteerInfo) {
                            isIndividualVolunteer = false;
                        }
                    } catch (error) {
                        console.warn("No volunteer record found.", error);
                        setLoading(false);
                        return;
                    }
                }

                // ✅ Set volunteer type and initial tab BEFORE formatting data
                setIsIndividual(isIndividualVolunteer);
                setActiveTab(isIndividualVolunteer ? 'personalInfo' : 'organizationInfo');

                // 5️⃣ Format the data
                let formattedData: VolunteerData;

                if (isIndividualVolunteer) {
                    const fullName = [userProfileData.first_name, userProfileData.last_name]
                        .filter(Boolean)
                        .join(" ");

                    formattedData = {
                        name: fullName || "Volunteer Name",
                        role: `Individual Volunteer (ID: ${volunteerInfo?.volunteer_id || 'N/A'})`,
                        certified: volunteerInfo?.status === 'approved' || false,
                        address: userProfileData.address || "Address not available",
                        personalInfo: {
                            age: userProfileData.bday ? calculateAge(userProfileData.bday) : 0,
                            dateOfBirth: userProfileData.bday
                                ? dayjs(userProfileData.bday).format('MMMM DD, YYYY').toUpperCase()
                                : "N/A",
                            phoneNumber: userProfileData.phone_number || "N/A",
                            address: userProfileData.address || "N/A",
                            gender: userProfileData.gender || "N/A"
                        },
                        location: {
                            lat: userProfileData.latitude || 10.3157,
                            lng: userProfileData.longitude || 123.8854
                        },
                        profileImage: defaultProfileImage,
                        description: userProfileData?.bio || volunteerInfo?.description || "No description available.",
                        skillsAndInterest: (() => {
                            const data = volunteerInfo?.skills;
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
                        volunteerId: volunteerInfo?.volunteer_id || 'N/A',
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
                } else {
                    console.log("Formatting Organization Data...");

                    formattedData = {
                        name: volunteerInfo?.organization_name || "Organization Name",
                        role: `Organization Volunteer`,
                        certified: volunteerInfo?.status === 'approved' || false,
                        address: volunteerInfo?.organization_address || "Address not available",
                        organizationInfo: {
                            organizationName: volunteerInfo?.organization_name || "N/A",
                            organizationType: volunteerInfo?.organization_type || "N/A",
                            phoneNumber: volunteerInfo?.organization_phone_number || "N/A",
                            address: volunteerInfo?.organization_address || "N/A",
                            email: volunteerInfo?.organization_email || "N/A",
                            website: volunteerInfo?.website || undefined,
                            establishedDate: volunteerInfo?.established_date
                                ? dayjs(volunteerInfo.established_date).format('MMMM DD, YYYY')
                                : undefined
                        },
                        location: {
                            lat: volunteerInfo?.latitude || userProfileData?.latitude || 10.3157,
                            lng: volunteerInfo?.longitude || userProfileData?.longitude || 123.8854
                        },
                        profileImage: volunteerInfo?.organization_picture
                            ? `${API.defaults.baseURL}/${volunteerInfo.organization_picture}`
                            : defaultProfileImage,
                        description: volunteerInfo?.description || "No description available.",
                        skillsAndInterest: (() => {
                            const data = volunteerInfo?.services_offered;
                            if (!data) return [];
                            if (Array.isArray(data)) return data;
                            if (typeof data === 'string') return data.split(',').map((s: string) => s.trim());
                            return [];
                        })(),
                        availability: volunteerInfo?.availability || "Not specified",
                        credentials: (() => {
                            const certs = volunteerInfo?.organization_certificate ||
                                volunteerInfo?.certifications ||
                                volunteerInfo?.certification;
                            if (!certs) return [];
                            if (Array.isArray(certs)) return certs;
                            if (typeof certs === 'string') return certs.split(',').map((c: string) => c.trim());
                            return [];
                        })(),
                        volunteerId: volunteerInfo?.org_volunteer_id || 'N/A',
                        statistics: {
                            totalPrograms: Number(
                                volunteerInfo?.active_events_joined ??
                                volunteerInfo?.events_joined ??
                                volunteerInfo?.active_tasks_joined ??
                                volunteerInfo?.tasks_joined ?? 0
                            ),
                            monthlyActivity: calculateMonthlyActivity(
                                volunteerInfo?.join_date || volunteerInfo?.created_at,
                                volunteerInfo?.last_active_date
                            ),
                            joinDate: volunteerInfo?.join_date || volunteerInfo?.created_at || new Date().toISOString(),
                            lastActiveDate: volunteerInfo?.last_active_date ?? volunteerInfo?.updated_at,
                            status: volunteerInfo?.status || 'N/A'
                        }
                    };
                }

                console.log("Formatted Volunteer Data:", formattedData);
                setVolunteerData(formattedData);

                // ✅ Geocode address for accurate map positioning
                if (formattedData.address && formattedData.address !== "Address not available") {
                    const hasDefaultCoords =
                        formattedData.location.lat === 10.3157 &&
                        formattedData.location.lng === 123.8854;

                    if (hasDefaultCoords) {
                        console.log("⚠️ Using default coordinates, geocoding address...");
                        const coords = await geocodeAddress(formattedData.address);
                        if (coords) {
                            setMapCenter([coords.lat, coords.lng]);
                        } else {
                            setMapCenter([formattedData.location.lat, formattedData.location.lng]);
                        }
                    } else {
                        setMapCenter([formattedData.location.lat, formattedData.location.lng]);
                    }
                }

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
                if (!isIndividual) return null;
                return (
                    <div className="info-content">
                        <div className="info-grid">
                            <div className="info-item">
                                <div className="info-label">Age</div>
                                <div className="info-value">{volunteerData.personalInfo?.age}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Date of Birth</div>
                                <div className="info-value">{volunteerData.personalInfo?.dateOfBirth}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Phone Number</div>
                                <div className="info-value">{volunteerData.personalInfo?.phoneNumber}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Address</div>
                                <div className="info-value">{volunteerData.personalInfo?.address}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Gender</div>
                                <div className="info-value">{volunteerData.personalInfo?.gender}</div>
                            </div>
                        </div>
                    </div>
                );

            case 'organizationInfo':
                if (isIndividual) return null;
                return (
                    <div className="info-content">
                        <div className="info-grid">
                            <div className="info-item">
                                <div className="info-label">Organization Name</div>
                                <div className="info-value">{volunteerData.organizationInfo?.organizationName}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Organization Type</div>
                                <div className="info-value">{volunteerData.organizationInfo?.organizationType}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Phone Number</div>
                                <div className="info-value">{volunteerData.organizationInfo?.phoneNumber}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Email</div>
                                <div className="info-value">{volunteerData.organizationInfo?.email}</div>
                            </div>
                            <div className="info-item">
                                <div className="info-label">Address</div>
                                <div className="info-value">{volunteerData.organizationInfo?.address}</div>
                            </div>
                            {volunteerData.organizationInfo?.website && (
                                <div className="info-item">
                                    <div className="info-label">Website</div>
                                    <div className="info-value">
                                        <span className="info-icon">🌐</span>
                                        <a href={volunteerData.organizationInfo.website} target="_blank" rel="noopener noreferrer">
                                            {volunteerData.organizationInfo.website}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {volunteerData.organizationInfo?.establishedDate && (
                                <div className="info-item">
                                    <div className="info-label">Established Date</div>
                                    <div className="info-value">
                                        <span className="info-icon">📅</span> {volunteerData.organizationInfo.establishedDate}
                                    </div>
                                </div>
                            )}
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
                                    const fileUrl = credential.startsWith('http')
                                        ? credential
                                        : `${API.defaults.baseURL}/${credential}`;
                                    const fileName = credential.split('/').pop() || `Certificate_${index + 1}`;
                                    const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'FILE';
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

    return (
        <div className="volunteer-container">
            <h2 className="page-title">Volunteer Profile</h2>
            <Breadcrumb>
                <Breadcrumb.Item><Link to="/">Home</Link></Breadcrumb.Item>
                <Breadcrumb.Item>
                    <Link to="/volunteer_management/volunteer_dashboard">Volunteer Dashboard</Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item><span>Volunteer Profile</span></Breadcrumb.Item>
            </Breadcrumb>

            <div className="main-content1">
                <div className="profile-container">
                    <div className="profile-header">
                        <div className="profile-banner"></div>
                        <div className="profile-info">
                            <div className="profile-avatar">
                                <img
                                    src={volunteerData.profileImage || defaultProfileImage}
                                    alt="profile"
                                    style={{ borderRadius: "50%", width: "100%", height: "100%", objectFit: "cover" }}
                                />
                            </div>
                            <div className="profile-details">
                                <h2 className="volunteer-name">
                                    <span className="name-text">{volunteerData.name}</span>
                                    {volunteerData.certified && <span className="certified-badge">Approved</span>}
                                </h2>
                                <p className="volunteer-role">{volunteerData.role}</p>
                            </div>
                        </div>
                    </div>

                    <div className="profile-content">
                        <div className="profile-left">
                            <div className="address-label">
                                ({isIndividual ? 'Volunteer Address' : 'Organization Address'})
                            </div>
                            <div className="map-placeholder">
                                {isGeocoding ? (
                                    <div style={{
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#f0f0f0'
                                    }}>
                                        <Spin tip="Loading accurate location..." />
                                    </div>
                                ) : (
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={15}
                                        zoomControl={false}
                                        attributionControl={false}
                                        style={{ height: '100%', width: '100%' }}
                                        key={`${mapCenter[0]}-${mapCenter[1]}`}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <Marker position={mapCenter}>
                                            <Popup>{volunteerData.address}</Popup>
                                        </Marker>
                                    </MapContainer>
                                )}
                            </div>
                            <div className="address-text">{volunteerData.address}</div>
                        </div>

                        <div className="profile-right">
                            <h2 className="about-title">About</h2>
                            <div className="about-container">
                                <div className="about-sidebar">
                                    {isIndividual ? (
                                        <div
                                            className={`sidebar-item ${activeTab === 'personalInfo' ? 'active' : ''}`}
                                            onClick={() => handleTabClick('personalInfo')}
                                        >
                                            Personal Information
                                        </div>
                                    ) : (
                                        <div
                                            className={`sidebar-item ${activeTab === 'organizationInfo' ? 'active' : ''}`}
                                            onClick={() => handleTabClick('organizationInfo')}
                                        >
                                            Organization Information
                                        </div>
                                    )}
                                    {isIndividual && (
                                        <div
                                            className={`sidebar-item ${activeTab === 'description' ? 'active' : ''}`}
                                            onClick={() => handleTabClick('description')}
                                        >
                                            Description
                                        </div>
                                    )}
                                    {isIndividual && (
                                        <div
                                            className={`sidebar-item ${activeTab === 'skillsAndInterest' ? 'active' : ''}`}
                                            onClick={() => handleTabClick('skillsAndInterest')}
                                        >
                                            Skills and Interest
                                        </div>
                                    )}
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

                    {volunteerData.statistics && (
                        <div className="statistics-section">
                            <h2 className="statistics-title">
                                {isIndividual ? 'Volunteer Statistics' : 'Organization Statistics'}
                            </h2>
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

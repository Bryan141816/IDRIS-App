import React, { useState, useEffect } from 'react';
import { Button, Breadcrumb, Spin } from 'antd';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { getUserProfileByUserId } from '../../../API_Handler/user_profile_handler';
import { getVolunteerByUserId } from '../../../API_Handler/individual_volunter_handler';
import { getOrganizationVolunteerByUserId } from '../../../API_Handler/organization_volunteer_handler';
import { fetchCurrentUserId } from '../../../API_Handler/auth';
import dayjs from 'dayjs';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './css/VolunteerProfile.css';

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
console.log("🔍 volunteerInfo.skills:", volunteerInfo?.skills);
console.log("🔍 Type:", typeof volunteerInfo?.skills);
console.log("🔍 Is Array?:", Array.isArray(volunteerInfo?.skills));
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
          description: volunteerInfo?.bio || volunteerInfo?.description || "No description available.",
          skillsAndInterest: (() => {
            // Safe skills/services handler
            const data = isIndividualVolunteer ? volunteerInfo?.skills : volunteerInfo?.services_offered;

            if (!data) return [];
            if (Array.isArray(data)) return data;
            if (typeof data === 'string') return data.split(',').map((s: string) => s.trim());
            return [];
          })(),
          availability: volunteerInfo?.availability || "Not specified",
          credentials: volunteerInfo?.certification_files || [],
          volunteerId: volunteerInfo?.volunteer_id || volunteerInfo?.org_volunteer_id || 'N/A'
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

    switch(activeTab) {
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
              <ul>
                {volunteerData.credentials.map((credential, index) => (
                  <li key={index}>
                    <a href={credential} target="_blank" rel="noopener noreferrer">
                      Certificate {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
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
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(volunteerData.name)}&size=200`}
                  alt="Volunteer"
                />
              </div>
              <div className="profile-details">
                <h2 className="volunteer-name">
                  <span className="name-text">{volunteerData.name}</span>
                  {volunteerData.certified && (
                    <span className="certified-badge">Certified</span>
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
                    Credentials
                  </div>
                </div>
                <div className="about-content">
                  {renderTabContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerProfile;

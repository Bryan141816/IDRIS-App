import React, { useState, useEffect } from 'react';
import { Button, Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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

export default function VolunteerProfile() {
  const [activeTab, setActiveTab] = useState('personalInfo');

  // Sample volunteer data
  const volunteerData = {
    name: "Volunteer name",
    role: "Role Assigned (Volunteer ID)",
    certified: true,
    address: "Cebu City, Philippines",
    personalInfo: {
      age: 21,
      dateOfBirth: "JULY 19, 2003",
      phoneNumber: "09123456789",
      address: "Address, address",
      gender: "Male"
    },
    location: {
        lat: 10.3157,
        lng: 123.8854
    }
  };

  const renderTabContent = () => {
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
            <p>No description available for this volunteer.</p>
          </div>
        );
      case 'skillsAndInterest':
        return (
          <div className="info-content">
            <p>No skills and interests listed for this volunteer.</p>
          </div>
        );
      case 'availability':
        return (
          <div className="info-content">
            <p>Availability schedule not set.</p>
          </div>
        );
      case 'credentials':
        return (
          <div className="info-content">
            <p>No credentials uploaded.</p>
          </div>
        );
      default:
        return null;
    }
  };

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
            <Link to="/volunteer_management/manage_volunteers">
              Volunteer
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
              <img src="https://ui-avatars.com/api/?name=Volunteer+Name&size=200" alt="Volunteer" />
              </div>
              <div className="profile-details">
                <h2 className="volunteer-name">
                  <span className="name-text">Volunteer name</span>
                  <span className="certified-badge">Certified</span>
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
                  center={[volunteerData.location.lat, volunteerData.location.lng]}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[volunteerData.location.lat, volunteerData.location.lng]}>
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
                    onClick={() => setActiveTab('personalInfo')}
                  >
                    Personal Information
                  </div>
                  <div
                    className={`sidebar-item ${activeTab === 'description' ? 'active' : ''}`}
                    onClick={() => setActiveTab('description')}
                  >
                    Description
                  </div>
                  <div
                    className={`sidebar-item ${activeTab === 'skillsAndInterest' ? 'active' : ''}`}
                    onClick={() => setActiveTab('skillsAndInterest')}
                  >
                    Skills and Interest
                  </div>
                  <div
                    className={`sidebar-item ${activeTab === 'availability' ? 'active' : ''}`}
                    onClick={() => setActiveTab('availability')}
                  >
                    Availability
                  </div>
                  <div
                    className={`sidebar-item ${activeTab === 'credentials' ? 'active' : ''}`}
                    onClick={() => setActiveTab('credentials')}
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
}

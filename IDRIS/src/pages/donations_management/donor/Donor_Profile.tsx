import { useEffect, useState } from "react";
import { getIndividualDonorProfile } from '../../../API_Handler/donations_donors_handler';
import { useUserRoleContext } from "../../../UserRoleContext";

interface DonorProfile {
  donorId: number;
  donor_name: string;
  donor_type: string;
  is_verified: boolean;
  date_joined: Date;
  last_updated: Date;
} 

const UserProfile = () => {
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const { userRoles }= useUserRoleContext();
  const [error, setError] = useState("");

  useEffect(() => {
    
    const fetchProfile = async () => {
      try {
        const response = await getIndividualDonorProfile();
        console.log(response);
        setProfile(response);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch profile.");
      }
      
    };

    fetchProfile();
  }, []);

  if (error) return <p>{error}</p>;
  if (!profile) return <p>Loading...</p>;

  return (
    <div className="profile-card">
      <h2>Donor Profile</h2>
      <p><strong>Donor ID:</strong> {profile.donorId}</p>
      <p><strong>Donor Type:</strong> {profile.donor_type}</p>
      <p><strong>Verified:</strong> {profile.is_verified ? "Yes" : "No"}</p>
      <p><strong>Date Joined:</strong> {new Date(profile.date_joined).toLocaleString()}</p>
      <p><strong>Last Updated:</strong> {new Date(profile.last_updated).toLocaleString()}</p>
      <div id="profile-main-container">
        <img src="" alt="background-image" id="background-image" />
        <div id="donor-main-info-container">
          <img src="" alt="user-image" id="user-image" />
          <div id="donor-name-container">
            <p className="donor-name"><strong>{profile.donor_name}</strong>  <p className="user-status">Unverified</p></p>
            <p className="role-assigned">{userRoles[0].toUpperCase()} ({profile.donorId})</p> 
          </div>
        </div>
        <hr />
        <div id="donor-sub-info-container">
          <div className="map-container">
            <p>( Volunteer Address )</p>
            <img src="" alt="volunteer-address" className="address" />
            <p className="location-name">Nalhub, Dalaguete, Cebu</p>
          </div>
          <div className="sub-box">
            <div className="info-label">
              <p className="about">About</p>
              <ul className="sub-info">
                <li>Personal Information</li>
                <li>Description</li>
                <li>Skills and Interest</li>
              </ul>
              <div id="personal-info">
                Age: 
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  
};

export default UserProfile;

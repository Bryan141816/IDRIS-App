import './donor_profile.scss';
import { useEffect, useState } from "react";
import { getIndividualDonorProfile } from '../../../API_Handler/donations_donors_handler';
import { useUserRoleContext } from "../../../UserRoleContext";
import NoImage from "../../images/no-image.jpg";
import { Modal } from "../../../components/Page_Furniture/Modals";
// import { RefreshCircle } from '../../../components/Page_Furniture/Icons';
import DonorStatusButton from '../../../components/Page_Furniture/TwoModeButton';
import { createNewDonor } from '../../../API_Handler/donations_donors_handler';

import { fetchCurrentUserId } from '../../../API_Handler/auth';

interface DonorProfile {
  donorId: number;
  donor_name: string;
  donor_type: string;
  is_verified: boolean;
  date_joined: Date;
  last_updated: Date;
}

interface PersonalInfo {
  age: number;
  dateOfBirth: string;
  phoneNumber: string;
  address: string;
  gender: string;
}

interface DonorData {
  donor_name: string;
  role: string;
  certified: boolean;
  address: string;
  personalInfo: PersonalInfo;
  location: Location;
  description?: string;
  skillsAndInterest?: string[];
  availability?: string;
  credentials?: string[];
}

interface Location {
  lat: number;
  lng: number;
}

// Sample Donor data
const donorData: DonorData = {
  donor_name: "No Data Found",
  role: "Role Assigned (Donor ID)",
  certified: true,
  address: "No Data Found",
  personalInfo: {
    age: 0,
    dateOfBirth: "No Data Found",
    phoneNumber: "No Data Found", 
    address: "No Data Found",
    gender: "No Data Found"
  },
  location: {
    lat: 0,
    lng: 0
  }
};

const UserProfile = () => {
  const { userRoles } = useUserRoleContext();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [donorId, setDonorId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null >(null);
  const [error, setError] = useState("");

  const [userProfilePicture] = useState<string | undefined>(undefined);
  const [userBackgroundPicture] = useState<string | undefined>(undefined);

  const fetchProfile = async () => {
    try {
      const response = await getIndividualDonorProfile();
      setProfile(response);
      setDonorId(response.donor_id);
    } catch (err) {
      console.error(err);
      // setError("Failed to fetch profile.");
    }

  };
  
  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(( ) => {
    const fetchUserid = async() => {
      try{
        const response = await fetchCurrentUserId();
        console.log("Current User ID: ", response.id);
        setUserId(response.id);
      } catch(error){
        console.error(error);
      }
    }

    fetchUserid();
  }, []);

  type TabType = 'personalInfo' | 'description' | 'skillsAndInterest' | 'availability' | 'credentials';
  const [activeTab, setActiveTab] = useState<TabType>('personalInfo');

  const renderTabContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'personalInfo':
        return (
          <table>
            <tbody>
              <tr>
                <th>Age:</th>
                <td>{donorData.personalInfo.age}</td>
              </tr>
              <tr>
                <th>Date of Birth:</th>
                <td>{donorData.personalInfo.dateOfBirth}</td>
              </tr>
              <tr>
                <th>Phone Number:</th>
                <td>{donorData.personalInfo.phoneNumber}</td>
              </tr>
              <tr>
                <th>Address:</th>
                <td>{donorData.personalInfo.address}</td>
              </tr>
              <tr>
                <th>Gender:</th>
                <td>{donorData.personalInfo.gender}</td>
              </tr>
            </tbody>
          </table>
        );
      case 'description':
        return (
          <div className="info-content">
            <p>{donorData.description || 'No description available for this Donor.'}</p>
          </div>
        );
      case 'skillsAndInterest':
        return (
          <div className="info-content">
            {donorData.skillsAndInterest && donorData.skillsAndInterest.length > 0 ? (
              <ul>
                {donorData.skillsAndInterest.map((skill, index) => (
                  <li key={index}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p>No skills and interests listed for this Donor.</p>
            )}
          </div>
        );
      case 'availability':
        return (
          <div className="info-content">
            <p>{donorData.availability || 'Availability schedule not set.'}</p>
          </div>
        );
      case 'credentials':
        return (
          <div className="info-content">
            {donorData.credentials && donorData.credentials.length > 0 ? (
              <ul>
                {donorData.credentials.map((credential, index) => (
                  <li key={index}>{credential}</li>
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

  // DONOR REGISTRATION MODAL
  // Form Values
  const [ organizationName, setOrganizationName] = useState<string | null>(null);
  const [ activeModal, setActiveModal] = useState("");
  const [isIndividual, setIsIndividual] = useState<boolean>(true);

  const closeModal = () => {
    setActiveModal("");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("user_id", userId?.toString() ?? "");
    formData.append("donor_type", isIndividual ? "Individual" : "Organization");
    formData.append("organization_name", organizationName || "");

    try {
      const res = await createNewDonor(formData);

      if (res.status !== 200) {
        // Log the error response for debugging
        console.error("Failed to register donor, status:", res.status);
        throw new Error("Failed to register donor");
      }

      setActiveModal("registration-successful");
      fetchProfile();
    } catch (err) {
      console.log(err);
      setActiveModal("registration-error");
    }
  }

  const renderRegisterDonorModal = (): React.ReactNode => {
    return (
      <Modal isOpen={activeModal == "registration-form"} onClose={closeModal}>
        <h3 className="modal-title">Register as Donor</h3>
        <form action="" id="donor-registration-form" onSubmit={handleSubmit}>
          <img src={userProfilePicture || NoImage} alt="user-profile" className="profile-picture" />
          <p>{profile?.donor_name}</p>

          <DonorStatusButton 
            isFirstMode={(isIndividual ? true : false)} 
            onToggle={() => {setIsIndividual(!isIndividual)}}
            firstLabel='Individual'
            secondLabel='Organization'
            id = "donor-status-button"
          />
          
          { !isIndividual ?
            <>
              <label htmlFor="organization-name">Organization Name: </label>
              <input type="text" name='organization-name' onChange={(e) => { setOrganizationName(e.target.value)} }/>
            </>    : 
            <></>
          }

          <button type='submit' className='green-modal-button'>Register</button>
        </form>
      </Modal>
    )
  }
  
  // if (error) return <p>{error}</p>;
  // if (!profile) return <p>Loading...</p>;

  // Fallback Donor Data
  const donorProfile = profile ?? {
    donorId: 0,
    donor_name: donorData.donor_name,
    donor_type: "Individual",
    is_verified: donorData.certified,
    date_joined: new Date(),
    last_updated: new Date(),
  };

  return (
    <div id="donor-profile">
      <h3 className='public-feed-title'>Donor Profile</h3>
      {/* USER NAME AND IMAGES */}
      <div id="profile-main-container">
        {userProfilePicture ?
          (<img src={userProfilePicture} alt="profile" id="background-picture" />) :
          (<img src={NoImage} alt="default" id="background-picture" />)
        }

        <div id="donor-main-info-container">
          {userBackgroundPicture ?
            (<img src={userBackgroundPicture} alt="profile" className="profile-picture" />) :
            (<img src={NoImage} alt="default" className="profile-picture" />)
          }
          <div id="donor-name-container">
            <p className="donor-name">
              <strong>{donorProfile.donor_name}</strong>
              <span className="user-status">
                ({donorProfile.is_verified ? "Verified" : "Unverified"})
              </span>
            </p>
            <p className="role-assigned">{userRoles[0].toUpperCase()} ({donorId})</p>
          </div>

          <button id="register-button" onClick={() => { setActiveModal("registration-form") }}> Register as Donor</button>
        </div>
        <hr />

        <div id="donor-sub-info-container">
          {/* Donor Address */}
          <div className="map-container">
            <p>( Donor Address )</p>
            <div
              className="map"
              style={{
                width: 200,
                height: 200,
                border: "2px solid red",
              }}
            ></div>
            <p className="location-name">Nalhub, Dalaguete, Cebu</p>
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
                  Skills and Interest
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

      {renderRegisterDonorModal()}

      <Modal isOpen={activeModal === "registration-successful"} onClose={closeModal}>
        <h3 className="modal-title">Registration Successful</h3>
        <div className="modal-button-container">
        </div>
      </Modal>

      <Modal isOpen={activeModal === "registration-error"} onClose={closeModal}>
        <h3 className="modal-title">Registration Failed</h3>
        <div className="modal-button-container">
        </div>
      </Modal>

    </div>

  );

};

export default UserProfile;

import './DonorProfile.scss';
import { useEffect, useState } from "react";
import { getIndividualDonorProfile } from '../../../API_Handler/donations_donors_handler';
import { useUserRoleContext } from "../../../UserRoleContext";
import NoImage from "../../images/no-image.jpg";
import { Modal } from "../../../components/Page_Furniture/Modals";
import DonorStatusButton from '../../../components/Page_Furniture/TwoModeButton';
import { createNewDonor } from '../../../API_Handler/donations_donors_handler';
import { fetchCurrentUserId } from '../../../API_Handler/auth';
import Swal from "sweetalert2";

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

// Sample Donor data (fallback)
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
  const { userRoles, setUserRoles } = useUserRoleContext();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [donorId, setDonorId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const [userProfilePicture] = useState<string | undefined>(undefined);
  const [userBackgroundPicture] = useState<string | undefined>(undefined);

  const fetchProfile = async () => {
    try {
      const response = await getIndividualDonorProfile();
      setProfile(response);
      const newDonorId = (response as any)?.donor_id ?? (response as any)?.donorId ?? null;
      setDonorId(newDonorId);
      if (newDonorId) {
        setIsRegistered(true);
      }
    } catch (err) {
      console.error(err);
      // setError("Failed to fetch profile.");
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchUserid = async () => {
      try {
        const response = await fetchCurrentUserId();
        setUserId(response.id);
      } catch (error) {
        console.error(error);
      }
    };

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
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState("");
  const [isIndividual, setIsIndividual] = useState<boolean>(true);

  const closeModal = () => setActiveModal("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isIndividual && (!organizationName || organizationName.trim() === "")) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Organization name cannot be empty.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const formData = new FormData();
    formData.append("user_id", userId?.toString() ?? "");
    formData.append("donor_type", isIndividual ? "Individual" : "Organization");
    formData.append("organization_name", organizationName || "");

    try {
      await createNewDonor(formData);

      // Close the registration form modal
      setActiveModal("");
      // Refresh profile
      await fetchProfile();

      // SweetAlert success
      await Swal.fire({
        icon: "success",
        title: "Registration Successful",
        text: "Your donor registration has been completed.",
        confirmButtonColor: "#16a34a"
      });

      setIsRegistered(true);
      if (setUserRoles) {
        setUserRoles([...userRoles, "donor"]);
      }

    } catch (err) {
      console.error(err);

      // Close any open form modal (optional)
      setActiveModal("");

      // SweetAlert error
      await Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: "We couldn’t complete your registration. Please try again.",
        confirmButtonColor: "#ef4444"
      });
    }
  };

  const renderRegisterDonorModal = (): React.ReactNode => {
    return (
      <Modal isOpen={activeModal === "registration-form"} onClose={closeModal}>
        <h3 className="modal-title">Register as Donor</h3>
        <form id="donor-registration-form" onSubmit={handleSubmit}>
          <img src={userProfilePicture || NoImage} alt="user-profile" className="profile-picture" />
          <p>{profile?.donor_name}</p>

          <DonorStatusButton
            isFirstMode={isIndividual}
            onToggle={() => setIsIndividual(!isIndividual)}
            firstLabel='Individual'
            secondLabel='Organization'
            id="donor-status-button"
          />

          {!isIndividual && (
            <>
              <label htmlFor="organization-name">Organization Name: </label>
              <input
                type="text"
                id="organization-name"
                name="organization-name"
                onChange={(e) => setOrganizationName(e.target.value)}
              />
            </>
          )}

          <button type="submit" className="green-modal-button" disabled={!userId}>
            Register
          </button>
        </form>
      </Modal>
    );
  };

  // Fallback Donor Data if profile not yet available
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
      <h3 className="public-feed-title">Donor Profile</h3>

      {/* USER NAME AND IMAGES */}
      <div id="profile-main-container">
        {userProfilePicture
          ? <img src={userProfilePicture} alt="profile" id="background-picture" />
          : <img src={NoImage} alt="default" id="background-picture" />
        }

        <div id="donor-main-info-container">
          {userBackgroundPicture
            ? <img src={userBackgroundPicture} alt="profile" className="profile-picture" />
            : <img src={NoImage} alt="default" className="profile-picture" />
          }

          <div id="donor-name-container">
            <p className="donor-name">
              <strong>{donorProfile.donor_name}</strong>
              <span className="user-status">
                ({donorProfile.is_verified ? "Verified" : "Unverified"})
              </span>
            </p>
            <p className="role-assigned">
              {userRoles && userRoles.length > 0 ? userRoles[0].toUpperCase() : "USER"} ({donorId ?? "—"})
            </p>
          </div>

            <button id="register-button" onClick={() => setActiveModal("registration-form")} disabled={isRegistered}>
              { isRegistered ? "Registered" : "Register as Donor"}
            </button>
          
        </div>

        <hr />

        <div id="donor-sub-info-container">
          {/* Donor Address (placeholder map) */}
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

      {/* Removed the success/error Modals in favor of SweetAlert2 */}
    </div>
  );
};

export default UserProfile;

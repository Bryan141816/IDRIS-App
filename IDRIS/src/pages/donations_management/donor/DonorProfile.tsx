import './DonorProfile.scss';
import { useEffect, useState } from "react";
import { getIndividualDonorProfile, getCurrentUserProfile } from '../../../API_Handler/donations_donors_handler';
import { API } from '../../../API_Handler/Axio_API_Handler';
import { useUserRoleContext } from "../../../UserRoleContext";
import NoImage from "../../images/no-image.jpg";
import { Modal } from "../../../components/Page_Furniture/Modals";
import DonorStatusButton from '../../../components/Page_Furniture/TwoModeButton';
import { createNewDonor } from '../../../API_Handler/donations_donors_handler';
import { fetchCurrentUserId } from '../../../API_Handler/auth';
import { DonorDashboard } from './DonorDashboard';
import Swal from "sweetalert2";

interface DonorProfile {
  donorId: number;
  donor_name: string;
  donor_type: string;
  is_verified: boolean;
  date_joined: Date;
  last_updated: Date;
}

interface CurrentUserProfile {
  first_name: string;
  last_name: string;
  profile_image: string;
  phone_number: string;
  bday: string;
  gender: string;
  address: string;
  bio: string;
}

const UserProfile = () => {
  const { userRoles, setUserRoles } = useUserRoleContext();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null);
  const [donorId, setDonorId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

  const [userProfilePicture, setUserProfilePicture] = useState<string | undefined>(undefined);
  const [userBackgroundPicture, setUserBackgroundPicture] = useState<string | undefined>(undefined);

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

  const fetchCurrentUserProfile = async () => {
    try {
      const response = await getCurrentUserProfile();
      setCurrentUserProfile(response);
      console.log(response);
      if (response && response.profile_image) {
        setUserProfilePicture(`${API.defaults.baseURL}/${response.profile_image}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchCurrentUserProfile();
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
    donor_name: "No Data Found",
    donor_type: "Individual",
    is_verified: false,
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
          {userProfilePicture
            ? <img src={userProfilePicture} alt="profile" className="profile-picture" />
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
            {isRegistered ? "Registered" : "Register as Donor"}
          </button>

        </div>

        <hr />

        <div id="donor-sub-info-container">
          <div className="profile-right">
            <h2 className="about-title">About</h2>
            <div className="about-container">
              <div className="about-content">
                {currentUserProfile && (
                  <table>
                    <tbody>
                      <tr>
                        <th>First Name:</th>
                        <td>{currentUserProfile.first_name}</td>
                      </tr>
                      <tr>
                        <th>Last Name:</th>
                        <td>{currentUserProfile.last_name}</td>
                      </tr>
                      <tr>
                        <th>Phone Number:</th>
                        <td>{currentUserProfile.phone_number}</td>
                      </tr>
                      <tr>
                        <th>Birthday:</th>
                        <td>
                          {currentUserProfile.bday
                            ? new Date(currentUserProfile.bday).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }).replace(",", ",")
                            : ""}
                        </td>
                      </tr>
                      <tr>
                        <th>Gender:</th>
                        <td>{currentUserProfile.gender.toLocaleUpperCase()}</td>
                      </tr>
                      <tr>
                        <th>Address:</th>
                        <td>{currentUserProfile.address}</td>
                      </tr>
                      <tr>
                        <th>Bio:</th>
                        <td>{currentUserProfile.bio}</td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isRegistered && <DonorDashboard />}

      {renderRegisterDonorModal()}

      {/* Removed the success/error Modals in favor of SweetAlert2 */}
    </div>
  );
};

export default UserProfile;

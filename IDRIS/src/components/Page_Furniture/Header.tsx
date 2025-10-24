import { useState } from "react";
import { MenuDots, CircleDot } from "./Icons";
import "./styles/header.scss";
import userProfile from "../../media/account-profile.png";
import { useUserContext } from "../../UserContext";
import { useUserRoleContext } from "../../UserRoleContext";
import { LogoutIcon } from "./Icons";
import { useLogout } from "../../utils/useLogout.ts";
import React from "react";
import { NotificationsButton } from "./Notifications.tsx";
import { API } from "../../API_Handler/Axio_API_Handler.ts";
interface FooterProps {
  onIconClick: () => void;
}

const Header: React.FC<FooterProps> = ({ onIconClick }) => {
  const [isUserSettingsVisible, showUserSettings] = useState<boolean>(false);
  const { userType } = useUserContext();
  const { highestRole } = useUserRoleContext();
  const logout = useLogout();
  const logOutUser = async () => {
    try {
      await logout();
      showUserSettings(false);
    } catch (err) {
      console.error("Logout failed:", err);
      showUserSettings(false);
    }
  };

  const toggleUserSettingsVisibility = () => {
    showUserSettings((prevState) => !prevState);
  };

  const { email, username, userId, userImage } = useUserContext();
  const profileImage = userImage
    ? `${API.defaults.baseURL}/${userImage}`
    : userProfile;

  console.log("User Image:", userImage);
  return (
    <header>
      <div id="left-items">
        <button onClick={onIconClick}>
          <MenuDots width={24} height={22} className="header-icon" />
        </button>
      </div>

      <div id="right-items">
        <NotificationsButton></NotificationsButton>
        <p id="rafi_btn">{`${highestRole?.toUpperCase()}`}</p>

        <div
          className="user-icon"
          onClick={() => toggleUserSettingsVisibility()}
        >
          <img
            src={profileImage}
            alt="user-profile"
            style={{ borderRadius: "50%" }}
          />
          <CircleDot width={16} height={16} />
        </div>

        {isUserSettingsVisible && (
          <>
            <div id="user-account-settings-container">
              <div className="user-icon">
                <img
                  src={profileImage}
                  alt="user-profile"
                  style={{
                    height: "32px",
                    width: "32px",
                    borderRadius: "50%",
                  }}
                />
                <CircleDot width={16} height={16} />
              </div>

              <div id="user-names">
                <p className="user-name">{username}</p>
                <p className="user-email">{email}</p>
              </div>
              <LogoutIcon
                width={24}
                height={24}
                className="logout-icon"
                onClick={logOutUser}
              />
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default React.memo(Header);

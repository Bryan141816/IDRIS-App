import { useState } from "react";
import { ArrowDown, MenuDots, CircleDot } from "./Icons";
import "./styles/header.scss";
import userProfile from "../../media/account-profile.png";
import { useUserContext } from "../../UserContext";
import { useUserRoleContext } from "../../UserRoleContext";
import { LogoutIcon } from "./Icons";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../API_Handler/auth.ts";
import React from "react";
import { NotificationsButton } from "./Notifications.tsx";
interface FooterProps {
  onIconClick: () => void;
}

const Header: React.FC<FooterProps> = ({ onIconClick }) => {
  const navigate = useNavigate();
  const [isUserSettingsVisible, showUserSettings] = useState<boolean>(false);
  const { setUserType, setEmail, setUsername, setUserReady, userType } =
    useUserContext();
  const { setUserRoles, userRoles, highestRole } = useUserRoleContext();
  const logOutUser = async () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("accessToken");
      await logoutUser();

      showUserSettings(false);
      setUserType("");
      setEmail("");
      setUsername("");
      setUserRoles?.([]);
      setUserReady(false);

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 50); // 10ms is enough
    } catch (err) {
      console.error("Logout failed:", err);
      showUserSettings(false);
      setUserType("");
      setEmail("");
      setUsername("");
      setUserRoles?.([]);
      setUserReady(false);
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 50); // 10ms is enough
    }
  };

  const toggleUserSettingsVisibility = () => {
    showUserSettings((prevState) => !prevState);
  };

  const { email, username, userId } = useUserContext();
  return (
    <header>
      <div id="left-items">
        <button onClick={onIconClick}>
          <MenuDots width={24} height={22} className="header-icon" />
        </button>
        <p id="user_role">{`${highestRole?.toUpperCase()} (${userType.toUpperCase()})`}</p>
      </div>

      <div id="right-items">
        <NotificationsButton userId={userId}></NotificationsButton>
        <p id="rafi_btn">
          RAFI <ArrowDown width={16} height={20} />
        </p>

        <div
          className="user-icon"
          onClick={() => toggleUserSettingsVisibility()}
        >
          <img src={userProfile} alt="user-profile" />
          <CircleDot width={16} height={16} />
        </div>

        {isUserSettingsVisible && (
          <>
            <div id="user-account-settings-container">
              <div className="user-icon">
                <img
                  src={userProfile}
                  alt="user-profile"
                  style={{
                    height: "32px",
                    width: "32px",
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

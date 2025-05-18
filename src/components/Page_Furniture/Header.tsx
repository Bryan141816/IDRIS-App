import { useState } from 'react';
import { ArrowDown, MenuDots, CircleDot } from '../Icons';
import './header.scss';
import userProfile from '../../media/account-profile.png';
import { useUserContext } from '../../UserContext';
import { LogoutIcon } from '../Icons';

interface FooterProps {
  onIconClick: () => void;
}

const Header: React.FC<FooterProps> = ({ onIconClick }) => {
  const [isUserSettingsVisible, showUserSettings] = useState<boolean>(false)
  
  const logOutUser = () => {
    showUserSettings(false);
    setUserType("");
  }

  const toggleUserSettingsVisibility = () => {
    showUserSettings((prevState) => !prevState);
  }

  const { userType, setUserType } = useUserContext();

  return (
    <header>
      <div id="left-items">
        <button onClick={onIconClick} >
          <MenuDots width={24} height={22} className='header-icon' />
        </button>
        <p id="user_role">{userType.toUpperCase()}</p>
      </div>

      <div id="right-items">

        <p id="rafi_btn">RAFI <ArrowDown width={16} height={20} /></p>

        <div className="user-icon" onClick={() => toggleUserSettingsVisibility()}>
          <img src={userProfile} alt="user-profile" />
          <CircleDot width={16} height={16} />
        </div>

        {isUserSettingsVisible && <div id="user-account-settings-container">
          <div className="user-icon">
            <img src={userProfile} alt="user-profile" />
            <CircleDot width={16} height={16} />
          </div>

          <div id="user-names">
            <p className='user-name'>User Name</p>
            <p className="user-email">user-email.@gmail.com</p>
          </div>
          <LogoutIcon width={24} height={24} className='logout-icon' onClick={logOutUser} />
        </div>}
      </div>
    </header>
  );
};

export default Header;
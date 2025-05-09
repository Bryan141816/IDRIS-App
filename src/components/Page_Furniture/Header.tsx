import { ArrowDown, MenuDots, CircleDot} from '../Icons';
import './header.scss';
import userProfile from '../../media/account-profile.png';

interface FooterProps {
  onIconClick: () => void;
}

const Header: React.FC<FooterProps> = ({onIconClick}) => {
  return (
    <header>
      <div id="left-items">
        <button onClick = {onIconClick} >
        <MenuDots width={24} height={22} className='header-icon' />
        </button>
        <p id="user_role">USER ROLE</p>
      </div>
      <div id="right-items">
        <p id="rafi_btn">RAFI <ArrowDown width={16} height={20} /></p>
        <div id="user-icon">
          <img src={userProfile} alt="user-profile" />
          <CircleDot width={16} height={16} />
        </div>
      </div>
    </header>
  );
};

export default Header;
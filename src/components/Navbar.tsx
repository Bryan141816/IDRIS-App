
import './Navbar.scss'; 
import logo1 from "../media/logo1.png";
import {Volunteer , Donations, LGU, HeartHandsIcon} from './Icons';

const Navbar = () => {
  return (
    <nav className="navbar">

      <div id="sidebar-logo-container">
        <img src={logo1} alt="sidebar-logo.png" />
        <p>IDRIS</p>
      </div>

      <div id="nav-links">

        <div className="nav-items" id="lgu-profiling">
          <LGU width={14} height={14} className='sidebar-icons' />
          LGU PROFILING
          <div className="nav-sub-items">
            {/* Sub items here */}
          </div>
        </div>

        <div className="nav-items" id="volunteer-management">
          <Volunteer width={14} height={14} className='sidebar-icons' />
          VOLUNTEER MANAGEMENT
          <div className="nav-sub-items">
            {/* Sub items here */}
          </div>
        </div>

        <div className="nav-items" id="donations-management">
          <HeartHandsIcon width={14} height={14} className='sidebar-icons' />
          DONATIONS MANAGEMENT
          <div className="nav-sub-items">
            {/* Sub items here */}
          </div>
        </div>


      </div>
    </nav>
  );
};

export default Navbar;

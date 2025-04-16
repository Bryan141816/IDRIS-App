
import './Navbar.scss'; 
import logo1 from "../../media/logo1.png";
import {Volunteer , LGU, Response, Donations} from './Icons';
import {useState} from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [activeNav, setActiveNav] = useState<string | null>(null);
  
  const toggleNav = (navId: string) => {
    setActiveNav(prev => (prev === navId ? null : navId));
  }

  return (
    <nav className="navbar">

      <div id="sidebar-logo-container">
        <img src={logo1} alt="sidebar-logo.png" />
        <p>IDRIS</p>
      </div>

      <div id="nav-links">

      <div className="nav-items" id="lgu-profiling" >
          <div className="flex-control" onClick={() => { toggleNav('lgu')}}>
            <LGU width={14} height={14} className='sidebar-icons' />
            <a href="#" >LGU PROFILING</a>
          </div>
          <div className={`nav-sub-items ${activeNav === 'lgu' ? 'active' : ''}`}>
            {/* Sub items here */}
            <Link to="/lgu_profiling/map_of_cebu" className='nav-sub-item'>Map of Cebu</Link>
          </div>
        </div>

        <div className="nav-items" id="lgu-profiling">
          <div className="flex-control" onClick={() => { toggleNav('volunteer')}}>
            <Volunteer width={14} height={14} className='sidebar-icons' />
            <a href="#">VOLUNTEER MANAGEMENT</a>
          </div>
          <div className={`nav-sub-items ${activeNav === 'volunteer' ? 'active' : ''}`}>
            {/* Sub items here */}
            <Link to="/volunteer_management/track_volunteer_application" className='nav-sub-item'>Track Volunteer Application</Link>
            <Link to="/volunteer_management/volunteer_profiles" className='nav-sub-item'>Volunteer Profiles</Link>
          </div>
        </div>


        <div className="nav-items" id="lgu-profiling" >
          <div className="flex-control" onClick={() => { toggleNav('donations')}}>
            <Donations width={14} height={14} className='sidebar-icons' />
            <a href="#">DONATIONS MANAGEMENT</a>
          </div>
          <div className={`nav-sub-items ${activeNav === 'donations' ? 'active' : ''}`}>
            {/* Sub items here */}
            <Link to="/donations_management/list_of_rafi_donors" className='nav-sub-item'>List of RAFI Donors</Link>
            <Link to="/donations_management/funding_proposals" className='nav-sub-item'>Funding Proposals</Link>
          </div>
        </div>

        <div className="nav-items" id="lgu-profiling" >
          <div className="flex-control" onClick={() => { toggleNav('response')}}>
            <Response width={14} height={14} className='sidebar-icons' />
            <Link to="/response_dashboard">RESPONSE DASHBOARD</Link>
          </div>
          <div className={`nav-sub-items ${activeNav === 'response' ? 'active' : ''}`}>
            {/* Sub items here */}
          </div>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;

  import {useState} from 'react';
  import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
  import { UserContext } from './UserContext';
  import './styles/App.scss';
  import MapOfCebu from './pages/lgu_profiling/map_of_cebu/MapOfCebu';
  import LGU from './pages/lgu_profiling/map_of_cebu/lgu';
  import LGUSeeMore from './pages/lgu_profiling/map_of_cebu/LGUSeeMore';
  import TrackVolunteerApplication from './pages/volunteer_management/track_volunteer_application/TrackVolunteerApplication';
  import ManageApplicant from './pages/volunteer_management/manage_applicant/ManageApplicant';
  import VolunteerDashboard from './pages/volunteer_management/volunteer_dashboard/VolunteerDashboard';
  import VolunteerProfiles from './pages/volunteer_management/volunteer_profiles/VolunteerPofiles';
  import OrganizationForm from './pages/volunteer_management/volunteer_form/OrganizationForm'
  import OtherOrganizationForm from './pages/volunteer_management/volunteer_form/otherOrganizationForm';
  import IndividualForm from './pages/volunteer_management/volunteer_form/IndividualForm';
  import ManageVolunteer from './pages/volunteer_management/manage_volunteers/ManageVolunteer';
  import DonationsDashboard from './pages/donations_management/donations_dashboard/Donations_Dashboard';
  import ViewCredentials from './pages/volunteer_management/manage_applicant/view_credentials';
  import ListOfRAFIDonors from './pages/donations_management/list_of_rafi_donors/ListOfRAFIDonors';
  import FundingProposals from './pages/donations_management/funding_proposals/FundingProposals';
  import ResponseDashboard from './pages/response_dashboard/ResponseDashboard';
  import ReportList from './pages/response_dashboard/report_list/ReportList';
  import Navbar from './components/Page_Furniture/Navbar';
  import Page from './components/Pages/Pages';
  import Header from './components/Page_Furniture/Header';
  import Footer from './components/Page_Furniture/Footer';

  function App() {
    let userType = { userType: 'admin'}

    return (
      <UserContext.Provider value={userType}>
        <Router>
          <AppRoutes />
        </Router>
      </UserContext.Provider>
    );
  }

  function AppRoutes() {
    const location = useLocation();

    // List of pages where you want to hide both Header and Footer
    const hideHeaderFooterRoutes = ['/lgu_profiling/map_of_cebu'];

    // Check if the current path is one of the pages where you want to hide Header/Footer
    const shouldHideHeaderFooter = hideHeaderFooterRoutes.includes(location.pathname);

    const [isNavbarVisible, setIsNavbarVisible] = useState(false);
    const toggleNavbar = () => {
      setIsNavbarVisible(prev => !prev);
    }
    const closeSidebar = () => setIsNavbarVisible(false);
    return (
      <>
        <Navbar isVisible={isNavbarVisible} onClose = {closeSidebar} />
        {/* Only show the Header and Footer if the current route isn't '/lgu_profiling/map_of_cebu' */}
        <div id="right-body-section">
          <Header onIconClick={toggleNavbar}/>
          {/* {!shouldHideHeaderFooter && <Header onIconClick={toggleNavbar}/>} */}
            <main>
              <Routes>
                <Route path='/lgu_profiling/map_of_cebu' element={<Page title='IDRIS | Map of Cebu'><MapOfCebu/></Page>}/>
                <Route path='/lgu_profiling/LGU' element={<Page title='IDRIS | LGU'><LGU/></Page>} />
                <Route path='/lgu_profiling/LGUSeeMore/:lguName' element={<Page title='IDRIS | LGUSeeMore'><LGUSeeMore/></Page>} />
                <Route path='/volunteer_management/track_volunteer_application' element={<Page title='IDRIS | Track Volunteer Application'><TrackVolunteerApplication/></Page> }/>
                <Route path='/volunteer_management/volunteer_dashboard' element={<Page title='IDRIS | Volunteer Profiles'><VolunteerDashboard/></Page>}/>
                <Route path='/volunteer_management/organization_form' element={<Page title='IDRIS | Volunteer Application'><OrganizationForm/></Page>}/>
                <Route path='/volunteer_management/otherorganization_form' element={<Page title='IDRIS | Volunteer Application'><OtherOrganizationForm/></Page>}/>
                <Route path='/volunteer_management/individual_form' element={<Page title='IDRIS | Volunteer Application'><IndividualForm/></Page>}/>
                <Route path='/volunteer_management/manage_applicant' element={<Page title='IDRIS | Manage Applicant'><ManageApplicant/></Page>}/>
                <Route path='/volunteer_management/view_credentials' element={<Page title='IDRIS | View Credentials'><ViewCredentials/></Page>}/>
                <Route path='/volunteer_management/volunteer_profiles' element={<Page title='IDRIS | Volunteer Profiles'><VolunteerProfiles/></Page>}/>
                <Route path='/volunteer_management/manage_volunteers' element={<Page title='IDRIS | Manage Volunteer'><ManageVolunteer/></Page>}/>
                <Route path='/donations_management/donations_dashboard' element={<Page title='IDRIS | Donations Dashboard'><DonationsDashboard/></Page>} />
                <Route path='/donations_management/list_of_rafi_donors' element={<Page title='IDRIS | List of RAFI Donors'><ListOfRAFIDonors/></Page>}/>
                <Route path='/donations_management/funding_proposals' element={<Page title='IDRIS | Funding Proposals'><FundingProposals/></Page>}/>
                <Route path='/response_dashboard' element={<Page title='IDRIS | Response Dashboard'><ResponseDashboard/></Page>}/>
                <Route path='/response_dashboard/report_list' element={<Page title='IDRIS | Report List'><ReportList/></Page>}/>
              </Routes>
            </main>
          {!shouldHideHeaderFooter && <Footer />}
        </div>
      </>
    );
  }

  export default App;

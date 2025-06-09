import { useState } from 'react';
import { useUserContext, UserProvider } from './UserContext';
import { useUserRoleContext, UserRoleProvider } from './UserRoleContext';
import { BrowserRouter as Router, Routes, Route, useLocation , Navigate } from 'react-router-dom';
import './styles/App.scss';
import ProtectedRoute from './ProtectedRoute';
import MapOfCebu from './pages/lgu_profiling/map_of_cebu/MapOfCebu';
import EvacuationAndShelter from './pages/lgu_profiling/evacuationandshelter/manage_evacuation_and_shelter';
import LGU from './pages/lgu_profiling/map_of_cebu/lgu';
import LGUSeeMore from './pages/lgu_profiling/map_of_cebu/LGUSeeMore';
import ManageLGU from './pages/lgu_profiling/LGUmanagement/manage_LGU';
import TrackVolunteerApplication from './pages/volunteer_management/track_volunteer_application/TrackVolunteerApplication';
import ManageApplicant from './pages/volunteer_management/manage_applicant/ManageApplicant';
import VolunteerDashboard from './pages/volunteer_management/volunteer_dashboard/VolunteerDashboard';
import VolunteerProfiles from './pages/volunteer_management/volunteer_profiles/VolunteerPofiles';
import OrganizationForm from './pages/volunteer_management/volunteer_form/OrganizationForm'
import OtherOrganizationForm from './pages/volunteer_management/volunteer_form/otherOrganizationForm';
import IndividualForm from './pages/volunteer_management/volunteer_form/IndividualForm';
import OtherIndividualForm from './pages/volunteer_management/volunteer_form/otherIndividualForm';
import ManageVolunteer from './pages/volunteer_management/manage_volunteers/ManageVolunteer';
import DonationsDashboard from './pages/donations_management/donations_dashboard/Donations_Dashboard';
import ViewCredentials from './pages/volunteer_management/manage_applicant/view_credentials';
import ListOfRAFIDonors from './pages/donations_management/list_of_rafi_donors/ListOfRAFIDonors';
import FundingProposals from './pages/donations_management/funding_proposals/FundingProposals';
import CreateFunding from './pages/donations_management/funding_proposals/CreateFunding';
import ResponseDashboard from './pages/response_dashboard/ResponseDashboard';
import ReportList from './pages/response_dashboard/report_list/ReportList';
import ReportsGeneration from './pages/reports_generation/reports_generation';
import DamageAssessment from './pages/damage_assessment/damage_assessment';
import ProcurementInventory from './pages/procurement_inventory/procurement_inventory/procurement_inventory';
import DistributionPlanning from './pages/procurement_inventory/distribution_planning/distribution_planning_and_monitoring';
import ProcurementManagement from './pages/procurement_inventory/procurement_management/procurement_management';
import FinanceManagement from './pages/finance&admin/finance_management/finance_management';
import Login from './components/Page_Furniture/Login';
import Navbar from './components/Page_Furniture/Navbar';
import Page from './components/Pages/Pages';
import Header from './components/Page_Furniture/Header';
import Footer from './components/Page_Furniture/Footer';
import Register from './components/Page_Furniture/Register';

function App() {
  return (
    <UserProvider>
      <UserRoleProvider>
        <Router>
          <AppRoutes />
        </Router>
      </UserRoleProvider>
    </UserProvider>
  );}

function AppRoutes() {
  const location = useLocation();
  const { userType } = useUserContext();
  const { userRole } = useUserRoleContext();

  // List of pages where you want to hide both Header and Footer
  const hideHeaderFooterRoutes = ['/lgu_profiling/map_of_cebu'];

  // Check if the current path is one of the pages where you want to hide Header/Footer
  const shouldHideHeaderFooter = hideHeaderFooterRoutes.includes(location.pathname);

  const [isNavbarVisible, setIsNavbarVisible] = useState(false);
  const toggleNavbar = () => {
    setIsNavbarVisible(prev => !prev);
  }

  const shouldHideUI = !userRole || userRole === ""; // (!userType || userType === "") &&

  const closeSidebar = () => setIsNavbarVisible(false);
  return (
    <>
      {!shouldHideUI && <Navbar isVisible={isNavbarVisible} onClose={closeSidebar} />}
      {/* Only show the Header and Footer if the current route isn't '/lgu_profiling/map_of_cebu' */}
      <div id="right-body-section">
        {!shouldHideUI && <Header onIconClick={toggleNavbar} />}
        {/* {!shouldHideHeaderFooter && <Header onIconClick={toggleNavbar}/>} */}
        <main>
            <Routes>
              {/* Public route (Login) */}
              <Route path='/' element={<Navigate to='/donations_management/donations_dashboard' replace />} />
              <Route path='/login' element={<Page title='IDRIS | Login'><Login /></Page>} />

              <Route path="/register" element={<Page title='IDRIS | Register'><Register/></Page>}></Route>

              {/* Protected routes wrapped in ProtectedRoute */}
              <Route path='/lgu_profiling/map_of_cebu' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Map of Cebu'><MapOfCebu /></Page>
                </ProtectedRoute>
              } />
              <Route path='/lgu_profiling/evacuationandshelter' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Evacuation and Shelter Management'><EvacuationAndShelter /></Page>
                </ProtectedRoute>
              } />
              <Route path='/lgu_profiling/LGU' element={
                <ProtectedRoute>
                  <Page title='IDRIS | LGU'><LGU /></Page>
                </ProtectedRoute>
              } />
              <Route path='/lgu_profiling/LGUmanagement' element={
                <ProtectedRoute>
                  <Page title='IDRIS | LGU Management'><ManageLGU/></Page>
                </ProtectedRoute>
              } />
              <Route path='/lgu_profiling/LGUSeeMore/:lguName' element={
                <ProtectedRoute>
                  <Page title='IDRIS | LGUSeeMore'><LGUSeeMore /></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/track_volunteer_application' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Track Volunteer Application'><TrackVolunteerApplication /></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/volunteer_dashboard' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Volunteer Profiles'><VolunteerDashboard /></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/organization_form' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Volunteer Application'><OrganizationForm /></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/otherorganization_form' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Volunteer Application'><OtherOrganizationForm /></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/individual_form' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Volunteer Application'><IndividualForm /></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/otherindividual_form' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Volunteer Application'><OtherIndividualForm/></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/manage_applicant' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Manage Applicant'><ManageApplicant /></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/view_credentials' element={
                <ProtectedRoute>
                  <Page title='IDRIS | View Credentials'><ViewCredentials /></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/volunteer_profiles' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Volunteer Profiles'><VolunteerProfiles /></Page>
                </ProtectedRoute>
              } />
              <Route path='/volunteer_management/manage_volunteers' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Manage Volunteer'><ManageVolunteer /></Page>
                </ProtectedRoute>
              } />
              <Route path='/donations_management/donations_dashboard' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Donations Dashboard'><DonationsDashboard /></Page>
                </ProtectedRoute>
              } />
              <Route path='/donations_management/list_of_rafi_donors' element={
                <ProtectedRoute>
                  <Page title='IDRIS | List of RAFI Donors'><ListOfRAFIDonors /></Page>
                </ProtectedRoute>
              } />
              <Route path='/donations_management/funding_proposals' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Funding Proposals'><FundingProposals /></Page>
                </ProtectedRoute>
              } />
              <Route path='/donations_management/funding_proposals/create' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Create Funding Proposal'><CreateFunding /></Page>
                </ProtectedRoute>
              } />
              <Route path='/response_dashboard' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Response Dashboard'><ResponseDashboard /></Page>
                </ProtectedRoute>
              } />
              <Route path='/response_dashboard/report_list' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Report List'><ReportList /></Page>
                </ProtectedRoute>
              } />
              <Route path='/reports_generation' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Reports Generation'><ReportsGeneration /></Page>
                </ProtectedRoute>
              } />
              <Route path='/damage_assessment' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Damage Assessment'><DamageAssessment /></Page>
                </ProtectedRoute>
              } />
              <Route path='/procurement_inventory/procurement_inventory' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Procurement Inventory'><ProcurementInventory /></Page>
                </ProtectedRoute>
              } />
              <Route path='/procurement_inventory/distribution_planning' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Distribution Planning'><DistributionPlanning /></Page>
                </ProtectedRoute>
              } />
              <Route path='/procurement_inventory/procurement_management' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Procurement Management'><ProcurementManagement /></Page>
                </ProtectedRoute>
              } />
              { userRole == "logistics admin" && <Route path='/finance&admin/finance_management' element={
                <ProtectedRoute>
                  <Page title='IDRIS | Finance Management'><FinanceManagement /></Page>
                </ProtectedRoute>
              } />}
            {/* Add more routes as needed */}

          </Routes>
        </main>
        {!shouldHideUI && !shouldHideHeaderFooter && <Footer />}
      </div>
    </>
  );
}

export default App;

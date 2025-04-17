import Navbar from './components/Page_Furniture/Navbar'
import './styles/App.scss'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapOfCebu from './pages/lgu_profiling/map_of_cebu/MapOfCebu';
import TrackVolunteerApplication from './pages/volunteer_management/track_volunteer_application/TrackVolunteerApplication';
import VolunteerDashboard from './pages/volunteer_management/volunteer_dashboard/VolunteerDashboard';
import VolunteerProfiles from './pages/volunteer_management/volunteer_profiles/VolunteerPofiles';
import ListOfRAFIDonors from './pages/donations_management/list_of_rafi_donors/ListOfRAFIDonors';
import FundingProposals from './pages/donations_management/funding_proposals/FundingProposals';
import ResponseDashboard from './pages/response_dashboard/ResponseDashboard';
import Page from './components/Pages/Pages';
import Header from './components/Page_Furniture/Header';
import Footer from './components/Page_Furniture/Footer';

function App() {

  return (
    <>
      <Router>
        <Navbar />
        <div id="right-body-section">
          <Header />
            <main>
              <Routes>
                <Route path='/lgu_profiling/map_of_cebu' element={<Page title='IDRIS | Map of Cebu'><MapOfCebu/></Page>}/>
                <Route path='/volunteer_management/track_volunteer_application' element={<Page title='IDRIS | Track Volunteer Application'><TrackVolunteerApplication/></Page> }/>
                <Route path='/volunteer_management/volunteer_dashboard' element={<Page title='IDRIS | Volunteer Profiles'><VolunteerDashboard/></Page>}/>
                <Route path='/volunteer_management/volunteer_profiles' element={<Page title='IDRIS | Volunteer Profiles'><VolunteerProfiles/></Page>}/>
                <Route path='/donations_management/list_of_rafi_donors' element={<Page title='IDRIS | List of RAFI Donors'><ListOfRAFIDonors/></Page>}/>
                <Route path='/donations_management/funding_proposals' element={<Page title='IDRIS | Funding Proposals'><FundingProposals/></Page>}/>
                <Route path='/response_dashboard' element={<Page title='IDRIS | Response Dashboard'><ResponseDashboard/></Page>}/>
              </Routes>
            </main>
          <Footer />
        </div>      
        </Router>
    </>
  )
}

export default App

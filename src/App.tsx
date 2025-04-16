import Navbar from './components/NavBar/Navbar'
import './styles/App.scss'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MapOfCebu from './pages/lgu_profiling/map_of_cebu/MapOfCebu';
import TrackVolunteerApplication from './pages/volunteer_management/track_volunteer_application/TrackVolunteerApplication';
import VolunteerProfiles from './pages/volunteer_management/volunteer_profiles/VolunteerPofiles';
import ListOfRAFIDonors from './pages/donations_management/list_of_rafi_donors/ListOfRAFIDonors';
import FundingProposals from './pages/donations_management/funding_proposals/FundingProposals';
import ResponseDashboard from './pages/response_dashboard/ResponseDashboard';

function App() {

  return (
    <>
      <Router>
        <Navbar />
        <main>
          <Routes>
            <Route path='/lgu_profiling/map_of_cebu' element={<MapOfCebu/>}/>
            <Route path='/volunteer_management/track_volunteer_application' element={<TrackVolunteerApplication/>}/>
            <Route path='/volunteer_management/volunteer_profiles' element={<VolunteerProfiles/>}/>
            <Route path='/donations_management/list_of_rafi_donors' element={<ListOfRAFIDonors/>}/>
            <Route path='/donations_management/funding_proposals' element={<FundingProposals/>}/>
            <Route path='/response_dashboard' element={<ResponseDashboard/>}/>
          </Routes>
        </main>  
      </Router>

    </>
  )
}

export default App

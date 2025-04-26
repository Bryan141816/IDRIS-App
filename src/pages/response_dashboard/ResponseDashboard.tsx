import { Link } from 'react-router-dom';
import './ReponseDashboard.scss'
import MapView from '../../components/MapView/MapView';
const markers = [
    {
      lat: 10.313924,
      lng: 123.887082,
      lguName: "Cebu City",
      type: "lgu",
      description: `Cebu City is the center of commerce, trade, education, and tourism in the Visayas region. It’s one of the Philippines' oldest and most developed cities.`,
      population: "964,169",
      resources: `Major hospitals (Chong Hua Hospital, Cebu Doctors’ University Hospital), CDRRMO...`,
      evacuationCenter: "Cebu City Sports Center",
      image: "../images/lgu/cebucity.jpeg",
      hazardAreas: [
        { lat: 10.313, lng: 123.885 },
        { lat: 10.315, lng: 123.889 },
      ],
    },
    {
      lat: 10.346693,
      lng: 123.898476,
      lguName: "Mandaue City",
      type: "lgu",
      description: `Mandaue City is known for its manufacturing and commercial establishments.`,
      population: "364,116",
      resources: `Ambulances, Fire trucks, MCDRRMO...`,
      evacuationCenter: "Mandaue Coliseum",
      image: "../images/lgu/mandaue.jpg",
      hazardAreas: [{ lat: 10.345, lng: 123.899 }],
    },
    {
      lat: 10.3400,
      lng: 123.9000,
      lguName: "Barangay Apas",
      type: "barangay",
      description: "It is a residential area known for its proximity to Cebu IT Park and the bustling business centers in the area. The barangay is home to schools, healthcare facilities, and various residential communities.",
      population: "15,000", 
      resources: "Basic Medical Kits, Barangay Tanod, Community Health Workers",
      evacuationCenter: "Barangay Apas Hall",
      image: "../images/baranggay/baranggay.jpg",  
      hazardAreas: [], 
    },
    {
      lat: 10.3500,
      lng: 123.9100,
      lguName: "RAFI Infra A",
      type: "raffi",
      description: "The facility includes warehouses, transportation hubs, and communication systems to ensure smooth coordination of relief efforts.",
      population: "-",
      resources: "-",
      evacuationCenter: "-",
      image: "../images/raffi/raffi.jpg",
      hazardAreas: [],
    },
  ];
const ResponseDashboard = () => {
    return(
        <div id="reponse_container">
            <h3>Reponse Dashboard</h3>
            <div className='sub-items'>
                <div className='sub-item-info'>
                    <h3>Reports</h3>
                    <Link to="/response_dashboard/report_list" className='manage-button'>Manage</Link>
                </div>
                <div className='sub-item-content'>
                    <div className='sub-item-content-big-data'>
                        <h1>5000</h1>
                        <span>Monthly Report Count</span>
                    </div>
                    <div className='sub-item-content-big-data'>
                        <h1>2000</h1>
                        <span>Completed Reports</span>
                    </div>
                    <div className='sub-item-content-big-data'>
                        <h1>3000</h1>
                        <span>Started Reports</span>
                    </div>
                </div>
            </div>
            <div className='sub-items'>
                <div className='sub-items-grid'>
                    <h3>Reponose Map</h3>
                    <h3>Demand Map</h3>
                    <h3>Modality Distribution</h3>
                    <div className='sub-item-grid-content'>
                        <MapView
                            center={[10.313924, 123.887082]}
                            markers={markers}
                            onMarkerClick={()=>{}}
                            />
                    </div>
                    <div className='sub-item-grid-content'>
                        <MapView
                            center={[10.313924, 123.887082]}
                            markers={markers}
                            onMarkerClick={()=>{}}
                        />
                    </div>
                    <div className='sub-item-grid-content'>

                    </div>
                </div>
            </div>
        </div>
    );
};
export default ResponseDashboard;
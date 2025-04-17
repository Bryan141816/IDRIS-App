import { useState } from "react";
import MapView from "../../../components/MapView/MapView";
import { Link } from "react-router-dom";
import "../css/MapOfCebu.css";

const markers = [
  {
    lat: 10.313924,
    lng: 123.887082,
    lguName: "Cebu City",
    description: `Cebu City is the center of commerce, trade, education, and tourism in the Visayas region. It’s one of the Philippines' oldest and most developed cities.`,
    population: "964,169",
    resources: `Major hospitals (Chong Hua Hospital, Cebu Doctors’ University Hospital), Disaster Risk Reduction and Management Office (CDRRMO) ...`,
    evacuationCenter: "Cebu City Sports Center",
    image: "../images/cebucity.jpeg",
    hazardAreas: [
      { lat: 10.313, lng: 123.885 },
      { lat: 10.315, lng: 123.889 },
    ],
  },
  {
    lat: 10.346693,
    lng: 123.898476,
    lguName: "Mandaue City",
    description: ` Mandaue City is known for its manufacturing, processing plants, and thriving commercial establishments. It serves as a gateway city to the rest of northern Cebu.`,
    population: "364,116",
    resources: `Ambulances, Emergency Kits, Fire trucks, Mandaue City Disaster Risk Reduction and Management Office (MCDRRMO) ..`,
    evacuationCenter: "Mandaue Coliseum",
    image: "../images/mandaue.jpg",
    hazardAreas: [
      { lat: 10.345, lng: 123.899 },
    ],
  },
];


const MapOfCebu = () => {
  const [selectedMarker, setSelectedMarker] = useState<any>(null);

  const handleMarkerClick = (marker: any) => {
    setSelectedMarker(marker);
  };

  return (
    <div className={`main-container ${selectedMarker ? 'sidebar-open' : ''}`}>
      <div className="map-buttons">
        <Link to="/lgu_profiling/LGU" className="map-button">LGU</Link>

        <Link to="../Baranggay/Baranggay" className="map-button">Baranggay</Link>
        <Link to="/Raffi" className="map-button">Raffi Infrastructure</Link>
      </div>

      <div className="map-container">
        <MapView
          center={[10.313924, 123.887082]}
          markers={markers}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {selectedMarker && (
        <div className="sidebar">
          <img src={selectedMarker.image} alt={selectedMarker.lguName} />
          <h2>{selectedMarker.lguName}</h2>
          <hr />
          <p>{selectedMarker.description}</p>
          <hr />
          <p><strong>Population:</strong> {selectedMarker.population}</p>
          <p><strong>Available Resources:</strong> {selectedMarker.resources}</p>
          <p><strong>Evacuation Center:</strong> {selectedMarker.evacuationCenter}</p><Link to="/lgu_profiling/LGUSeeMore" className="see-more-link">See More</Link>

          <hr />
          <div className="small-map">
            <h3 style={{ marginTop: '-15px', marginBottom: '5px' }}>Hazard Area</h3>
            <MapView
              center={[selectedMarker.lat, selectedMarker.lng]}
              markers={selectedMarker.hazardAreas}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MapOfCebu;

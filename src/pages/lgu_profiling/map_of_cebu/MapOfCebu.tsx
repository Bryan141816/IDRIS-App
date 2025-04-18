import { useState } from "react";
import MapView from "../../../components/MapView/MapView";
import { Link } from "react-router-dom";
import "../css/MapOfCebu.css";


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
    image: "../images/barangay/apas.jpg",  
    hazardAreas: [], 
  },
  {
    lat: 10.3500,
lng: 123.9100,
lguName: "RAFI Infra A",
type: "raffi",
description: "RAFI Infra A is a strategic location in the region, providing essential infrastructure support for disaster response and relief efforts. This site serves as a hub for coordinating logistics, offering a reliable base for relief distribution, and ensuring that resources are efficiently deployed during emergencies.",
population: "-",
resources: "-",
evacuationCenter: "-",
image: "../images/raffi/raffi.jpg",
hazardAreas: [],

  },
];

const MapOfCebu = () => {
  const [selectedMarker, setSelectedMarker] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar visibility state

  const handleMarkerClick = (marker: any) => {
    setSelectedMarker(marker);
    setSidebarOpen(true); // Open sidebar when a marker is clicked
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false); // Close the sidebar when the close button is clicked
    setSelectedMarker(null); // Reset selected marker
    setSelectedType(null); // Reset selected type to show all markers
  };

  const handleNearestEvacuation = () => {
    alert("Finding nearest evacuation...");
  };

  return (
    <div className={`main-container ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="map-buttons">
        <button className="map-button" onClick={() => setSelectedType(null)}>
          Show All
        </button>
        <button className="map-button" onClick={() => setSelectedType("lgu")}>
          LGU
        </button>
        <button className="map-button" onClick={() => setSelectedType("barangay")}>
          Barangay
        </button>
        <button className="map-button" onClick={() => setSelectedType("raffi")}>
          RAFI Infrastructure
        </button>
      </div>

      <div className="map-container">
        <MapView
          center={[10.313924, 123.887082]}
          markers={selectedType ? markers.filter((marker) => marker.type === selectedType) : markers}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {/* Sidebar */}
      {sidebarOpen && selectedMarker && (
        <div className="sidebar">
          <button className="close-sidebar" onClick={handleCloseSidebar}>x</button>
          <img src={selectedMarker.image} alt={selectedMarker.lguName} />
          <h2>{selectedMarker.lguName}</h2>
          <hr />
          <p>{selectedMarker.description}</p>
          <hr />

          {selectedMarker.type === "lgu" && (
            <>
              <p><strong>Population:</strong> {selectedMarker.population}</p>
              <p><strong>Available Resources:</strong> {selectedMarker.resources}</p>
              <p><strong>Evacuation Center:</strong> {selectedMarker.evacuationCenter}</p>
              <Link to="/lgu_profiling/LGUSeeMore" className="see-more-link">See More</Link>

              {selectedMarker.hazardAreas && selectedMarker.hazardAreas.length > 0 && (
                <>
                  <hr />
                  <div className="small-map">
                    <h3 style={{ marginTop: "-15px", marginBottom: "5px" }}>Hazard Area</h3>
                    <MapView
                      center={[selectedMarker.lat, selectedMarker.lng]}
                      markers={selectedMarker.hazardAreas}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {selectedMarker.type === "barangay" && (
            <>
              <p><strong>Population:</strong> {selectedMarker.population}</p>
              <p><strong>Available Resources:</strong> {selectedMarker.resources}</p>
              <p><strong>Evacuation Center:</strong> {selectedMarker.evacuationCenter}</p>
              <hr />
              <button
                className="map-button"
                onClick={handleNearestEvacuation}
              >
                Nearest Evacuation
              </button>
            </>
          )}

          {selectedMarker.type === "raffi" && (
            <>
              {/* Only name and description already displayed above */}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MapOfCebu;

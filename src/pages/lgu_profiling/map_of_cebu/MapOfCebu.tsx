import { useState } from "react";
import MapView, { MarkerType } from "../../../components/MapView/MapView";
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

const MapOfCebu = () => {
  const [selectedMarker, setSelectedMarker] = useState<MarkerType | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMarkerClick = (marker: MarkerType) => {
    setSelectedMarker(marker);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedMarker(null);
    setSelectedType(null);
  };

  const handleNearestEvacuation = () => {
    if (!selectedMarker) return;

    const lguMarkers = markers.filter((m) => m.type === "lgu");
    let nearest: MarkerType | null = null;
    let minDistance = Infinity;

    lguMarkers.forEach((marker) => {
      const distance = Math.sqrt(
        Math.pow(marker.lat - selectedMarker.lat, 2) + Math.pow(marker.lng - selectedMarker.lng, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearest = marker;
      }
    });

    if (nearest) {
      alert(`Nearest Evacuation Center: `);
    } else {
      alert("No nearby evacuation center found.");
    }
  };

  return (
    <div className={`main-container ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="map-buttons">
        <button className="map-button" onClick={() => setSelectedType(null)}>Show All</button>
        <button className="map-button" onClick={() => setSelectedType("lgu")}>LGU</button>
        <button className="map-button" onClick={() => setSelectedType("barangay")}>Barangay</button>
        <button className="map-button" onClick={() => setSelectedType("raffi")}>RAFI Infrastructure</button>
      </div>

      <div className="map-container">
        <MapView
          center={[10.313924, 123.887082]}
          markers={selectedType ? markers.filter((m) => m.type === selectedType) : markers}
          onMarkerClick={handleMarkerClick}
        />
      </div>

      {sidebarOpen && selectedMarker && (
        <div className="sidebar">
          <button className="close-sidebar" onClick={handleCloseSidebar}>x</button>
          <img src={selectedMarker.image} alt={selectedMarker.lguName} />
          <h2>{selectedMarker.lguName}</h2>
          <hr />
          <p>{selectedMarker.description}</p>
          <hr />

          {(selectedMarker.type === "lgu" || selectedMarker.type === "barangay") && (
            <>
              <p><strong>Population:</strong> {selectedMarker.population}</p>
              <p><strong>Available Resources:</strong> {selectedMarker.resources}</p>
              <p><strong>Evacuation Center:</strong> {selectedMarker.evacuationCenter}</p>
              {selectedMarker.type === "lgu" && (
                <Link to="/lgu_profiling/LGUSeeMore" className="see-more-link">See More</Link>
              )}
              {selectedMarker.type === "barangay" && (
                <button
                  className="map-button"
                  style={{ marginTop: "10px" }}
                  onClick={handleNearestEvacuation}
                >
                  Nearest Evacuation
                </button>
              )}
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
        </div>
      )}
    </div>
  );
};

export default MapOfCebu;

import { useState } from "react";
import MapView, { MarkerType } from "../../../components/MapView/MapView";
import { Link } from "react-router-dom";
import "../css/MapOfCebu.css";


const markers: MarkerType[] = [
  {
    lat: 10.313924,
    lng: 123.887082,
    lguName: "Cebu City",
    type: "lgu",
    description: `Cebu City is the center of commerce, trade, education, and tourism in the Visayas region.`,
    population: "964,169",
    resources: `Major hospitals (Chong Hua Hospital, Cebu Doctors’ University Hospital), CDRRMO...`,
    evacuationCenter: "Cebu City Sports Center",
    image: "../images/lgu/cebucity.jpeg",
    hazardAreas: [
      { lat: 10.313, lng: 123.885, type: "hazard" },
      { lat: 10.315, lng: 123.889, type: "hazard" },
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
    hazardAreas: [{ lat: 10.345, lng: 123.899, type: "hazard" }],
  },
  {
    lat: 10.34,
    lng: 123.9,
    lguName: "Barangay Apas",
    type: "barangay",
    description:
      "It is a residential area known for its proximity to Cebu IT Park...",
    population: "15,000",
    resources: "Basic Medical Kits, Barangay Tanod, Community Health Workers",
    evacuationCenter: "Barangay Apas Hall",
    image: "../images/baranggay/baranggay.jpg",
    hazardAreas: [],
  },
  {
    lat: 10.35,
    lng: 123.91,
    lguName: "RAFI Infra A",
    type: "raffi",
    description: "The facility includes warehouses and transportation hubs.",
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
  const [pathCoordinates, setPathCoordinates] = useState<[number, number][] | null>(null);
  const [evacuationCenter, setEvacuationCenter] = useState<MarkerType | null>(null); // separate evacuation marker

  const handleMarkerClick = (marker: MarkerType) => {
    setSelectedMarker(marker);
    setSidebarOpen(true);
    setPathCoordinates(null);
    setEvacuationCenter(null); // reset evacuation center when clicking new marker
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedMarker(null);
    setSelectedType(null);
    setPathCoordinates(null);
    setEvacuationCenter(null);
  };

  const handleNearestEvacuation = () => {
    if (!selectedMarker) return;
    // Sample random simulated evacuation center (nearby)
    const simulatedEvac: MarkerType = {
      lat: selectedMarker.lat + 0.005,
      lng: selectedMarker.lng + 0.007,
      lguName: "Simulated Evac Center",
      type: "evacuation",
      description: "Temporary shelter facility ",
      population: "-",
      resources: "Food packs, water, and beds",
      evacuationCenter: "Simulated Covered Court",
      image: "../images/icons/sample.png",

      hazardAreas: [],
    };

    setEvacuationCenter(simulatedEvac);
    setPathCoordinates([
      [selectedMarker.lat, selectedMarker.lng],
      [simulatedEvac.lat, simulatedEvac.lng],
    ]);
  };

  const combinedMarkers = () => {
    const base = selectedType ? markers.filter((m) => m.type === selectedType) : markers;
    return evacuationCenter ? [...base, evacuationCenter] : base;
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
<div className="legend-box">
  <h4>Legend</h4>
  <div className="legend-item">
    <span className="legend-color" style={{ backgroundColor: 'blue' }}></span> LGU
  </div>
  <div className="legend-item">
    <span className="legend-color" style={{ backgroundColor: 'red' }}></span> Barangay
  </div>
  <div className="legend-item">
    <span className="legend-color" style={{ backgroundColor: 'yellow' }}></span> RAFI Infrastructure
  </div>
</div>

      <div className="map-container">
        <MapView
          center={[10.313924, 123.887082]}
          markers={combinedMarkers()}
          onMarkerClick={handleMarkerClick}
          pathCoordinates={pathCoordinates}
        />
      </div>

      {sidebarOpen && selectedMarker && (
        <div className="sidebar">
          <button className="close-sidebar" onClick={handleCloseSidebar}>
            x
          </button>
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
                <Link
                  to={`/lgu_profiling/LGUSeeMore/${selectedMarker.lguName?.replace(/\s/g, "") ?? ""}`}
                  className="see-more-link"
                >
                  See More
                </Link>
              )}

              {selectedMarker.type === "barangay" && (
                <button className="map-button" style={{ marginTop: "10px" }} onClick={handleNearestEvacuation}>
                  Nearest Evacuation
                </button>
              )}

              {selectedMarker.hazardAreas && selectedMarker.hazardAreas.length > 0 && (
                <>
                  <hr />
                  <div className="small-map">
                    <h3 style={{ marginTop: "-15px", marginBottom: "5px" }}>Hazard Area</h3>
                    <MapView markers={selectedMarker.hazardAreas} fitBounds={true} />
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

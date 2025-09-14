// IDRIS/src/pages/lgu_profiling/map_of_cebu/MapOfCebu.tsx
import { useEffect, useMemo, useState } from "react";
import MapView, { MarkerType } from "../../../components/MapView/MapView";
import { Link } from "react-router-dom";
import "../css/MapOfCebu.css";

type HazardPhoto = { src: string; label: string };
type MarkerWithPhotos = MarkerType & {
  hazardPhotos?: HazardPhoto[];
  lguId?: number; // real LGU id from backend
};

type LGUPoint = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  classification: string;
  population: number;
  contact_info: string;
  risk_level: string;
  imageUrl?: string | null;
  description?: string | null;
  resources?: string[] | null;
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MAPOFCEBU_BASE = "/lgu_profiling/mapofcebu"; // ✅ matches your FastAPI include_router

/** ======= SAMPLE ONLY for non-LGU types ======= **/
const barangaySamples: MarkerWithPhotos[] = [
  {
    lat: 10.34,
    lng: 123.9,
    lguName: "Barangay Apas",
    type: "barangay",
    description: "It is a residential area known for its proximity to Cebu IT Park...",
    population: "15,000",
    resources: "Basic Medical Kits, Barangay Tanod, Community Health Workers",
    evacuationCenter: "Barangay Apas Hall",
    image: "../images/baranggay/baranggay.jpg",
    hazardAreas: [],
    hazardPhotos: [{ src: "../images/hazards/apas_flood_1.jpg", label: "Flood-prone: Sitio Kamputhaw" }],
  },
];

const raffiSamples: MarkerWithPhotos[] = [
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
/** ============================================ **/

const MapOfCebu = () => {
  const [lguMarkers, setLguMarkers] = useState<MarkerWithPhotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedMarker, setSelectedMarker] = useState<MarkerWithPhotos | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pathCoordinates, setPathCoordinates] = useState<[number, number][] | null>(null);
  const [evacuationCenter, setEvacuationCenter] = useState<MarkerType | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}${MAPOFCEBU_BASE}/points`); // ✅
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: LGUPoint[] = await res.json();

        const mapped: MarkerWithPhotos[] = data.map((p) => ({
          lat: p.lat,
          lng: p.lng,
          lguName: p.name,
          type: "lgu",
          description: p.description || "",
          population: String(p.population ?? ""),
          resources: Array.isArray(p.resources) && p.resources.length ? p.resources.join(", ") : "-",
          evacuationCenter: "",
          image: p.imageUrl || "/images/lgu/default.jpg",
          hazardAreas: [],
          lguId: p.id, // 👈 important
        }));

        setLguMarkers(mapped);
      } catch (e: any) {
        setError(e?.message || "Failed to load LGU points.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleMarkerClick = (marker: MarkerWithPhotos) => {
    setSelectedMarker(marker);
    setSidebarOpen(true);
    setPathCoordinates(null);
    setEvacuationCenter(null);
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

  const combinedMarkers = useMemo(() => {
    let base: MarkerWithPhotos[] = [...lguMarkers, ...barangaySamples, ...raffiSamples];
    if (selectedType) base = base.filter((m) => m.type === selectedType);
    return evacuationCenter ? [...base, evacuationCenter] : base;
  }, [lguMarkers, selectedType, evacuationCenter]);

  if (loading) return <div style={{ padding: 16 }}>Loading LGU markers…</div>;
  if (error) return <div style={{ padding: 16, color: "crimson" }}>{error}</div>;

  return (
    <div className={`main-container ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="map-buttons">
        <button className="map-button" onClick={() => setSelectedType(null)}>Show All</button>
        <button className="map-button" onClick={() => setSelectedType("lgu")}>LGU</button>
        <button className="map-button" onClick={() => setSelectedType("barangay")}>Barangay</button>
        <button className="map-button" onClick={() => setSelectedType("raffi")}>RAFI Infrastructure</button>
      </div>

      <div className="legend-box">
        <h4>Legend</h4>
        <div className="legend-item"><span className="legend-color" style={{ backgroundColor: "blue" }} /> LGU</div>
        <div className="legend-item"><span className="legend-color" style={{ backgroundColor: "red" }} /> Barangay</div>
        <div className="legend-item"><span className="legend-color" style={{ backgroundColor: "yellow" }} /> RAFFI Infrastructure</div>
      </div>

      <div className="map-container">
        <MapView
          center={[10.313924, 123.887082]}
          markers={combinedMarkers as MarkerType[]}
          onMarkerClick={handleMarkerClick as unknown as (m: MarkerType) => void}
          pathCoordinates={pathCoordinates}
        />
      </div>

      {sidebarOpen && selectedMarker && (
        <div className="sidebar">
          <button className="close-sidebar" onClick={handleCloseSidebar}>x</button>
          {selectedMarker.image && <img src={selectedMarker.image} alt={selectedMarker.lguName} />}
          <h2>{selectedMarker.lguName}</h2>
          <hr />
          <p>{selectedMarker.description}</p>
          <hr />
          {(selectedMarker.type === "lgu" || selectedMarker.type === "barangay") && (
            <>
              <p><strong>Population:</strong> {selectedMarker.population}</p>
              <p><strong>Available Resources:</strong> {selectedMarker.resources || "-"}</p>
              <p><strong>Evacuation Center:</strong> {selectedMarker.evacuationCenter}</p>

              {selectedMarker.type === "lgu" && selectedMarker.lguId != null && (
                <Link
                  to={`/lgu_profiling/LGUSeeMore/${selectedMarker.lguId}`}
                  className="see-more-link"
                >
                  See More
                </Link>
              )}

              {selectedMarker.type === "barangay" && (
                <button className="map-button" style={{ marginTop: 10 }} onClick={handleNearestEvacuation}>
                  Nearest Evacuation
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MapOfCebu;

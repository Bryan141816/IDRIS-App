  import { useEffect, useMemo, useState } from "react";
  import MapView, { MarkerType } from "../../../components/MapView/MapView";
  import { Link } from "react-router-dom";
  import "../css/MapOfCebu.css";

  type HazardPhoto = { src: string; label: string };
  type MarkerWithPhotos = MarkerType & {
    hazardPhotos?: HazardPhoto[];
    lguId?: number;
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

  type RafiPoint = {
    id: number;
    name: string;
    lat: number;
    lng: number;
    description?: string | null;
    imageUrl?: string | null;
  };

  /** Backend shape for Barangay (flattened w/ relation names) */
  type BarangayAPI = {
    id: number;
    name: string;
    lat: number;
    lng: number;
    contact_info?: string | null;
    population?: number | Record<string, unknown> | any[] | string | null;
    risk_level?: string | null;

    baranggay_pic?: string | null;
    baranggay_desc?: string | null;
    resources?: string[] | Record<string, unknown> | null;

    lgu_id: number;
    lgu_name?: string | null;
    evacuation_center_id?: number | null;
    evacuation_center_name?: string | null;
  };

  const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:8000";

  /** Existing endpoints you already use */
  const MAPOFCEBU_BASE = "/lgu_profiling/mapofcebu"; // for /points and /rafi
  const API_BASE = `${RAW_API.replace(/\/+$/, "")}${MAPOFCEBU_BASE}`;

  /** New: manage_lgu base for barangay listing */
  const MANAGE_BASE = "/lgu_profiling/manage_lgu";
  const MANAGE_API = `${RAW_API.replace(/\/+$/, "")}${MANAGE_BASE}`;

  const MapOfCebu = () => {
    const [lguMarkers, setLguMarkers] = useState<MarkerWithPhotos[]>([]);
    const [raffiMarkers, setRaffiMarkers] = useState<MarkerWithPhotos[]>([]);
    const [barangayMarkers, setBarangayMarkers] = useState<MarkerWithPhotos[]>([]);

    const [pendingLoads, setPendingLoads] = useState<number>(3); // LGU + RAFI + Barangay
    const loading = pendingLoads > 0;

    const [error, setError] = useState<string | null>(null);

    const [selectedMarker, setSelectedMarker] = useState<MarkerWithPhotos | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [pathCoordinates, setPathCoordinates] = useState<[number, number][] | null>(null);
    const [evacuationCenter, setEvacuationCenter] = useState<MarkerType | null>(null);

    // Fetch LGU points
    useEffect(() => {
      let cancelled = false;

      (async () => {
        const url = `${API_BASE}/points`;
        try {
          const res = await fetch(url, { mode: "cors" });
          if (!res.ok) throw new Error(`GET /points failed: HTTP ${res.status}`);
          const data: LGUPoint[] = await res.json();
          if (cancelled) return;

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
            lguId: p.id,
          }));

          setLguMarkers(mapped);
        } catch (e: any) {
          console.error("LGU fetch error:", e);
          setError((prev) => prev ?? (e?.message || "Failed to load LGU points."));
        } finally {
          setPendingLoads((n) => Math.max(0, n - 1));
        }
      })();

      return () => {
        cancelled = true;
      };
    }, []);

    // Fetch RAFI points
    useEffect(() => {
      let cancelled = false;

      (async () => {
        const url = `${API_BASE}/rafi`;
        try {
          const res = await fetch(url, { mode: "cors" });
          if (!res.ok) throw new Error(`GET /rafi failed: HTTP ${res.status}`);
          const data: RafiPoint[] = await res.json();
          if (cancelled) return;

          const mapped: MarkerWithPhotos[] = data.map((r) => ({
            lat: r.lat,
            lng: r.lng,
            lguName: r.name,
            type: "raffi",
            description: r.description || "",
            population: "-",
            resources: "-",
            evacuationCenter: "-",
            image: r.imageUrl || "/images/raffi/raffi.jpg",
            hazardAreas: [],
          }));

          setRaffiMarkers(mapped);
        } catch (e: any) {
          console.error("RAFI fetch error:", e);
          setError((prev) => prev ?? (e?.message || "Failed to load RAFI points."));
        } finally {
          setPendingLoads((n) => Math.max(0, n - 1));
        }
      })();

      return () => {
        cancelled = true;
      };
    }, []);

    // Fetch Barangays (replaces local samples)
  // ✅ Fetch Barangays (from backend)
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // correct backend route
      const url = `${API_BASE}/barangays?include=relations`;
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`GET /barangays failed: HTTP ${res.status}`);
        const data: BarangayAPI[] = await res.json();
        if (cancelled) return;

        const mapped: MarkerWithPhotos[] = data.map((b) => ({
          lat: Number(b.lat) || 0,
          lng: Number(b.lng) || 0,
          lguName: b.name,
          type: "barangay",
          description: b.baranggay_desc || "",
          population:
            typeof b.population === "number"
              ? String(b.population)
              : typeof b.population === "string"
              ? b.population
              : "-",
          resources: Array.isArray(b.resources)
            ? b.resources.join(", ")
            : JSON.stringify(b.resources || "-"),
          evacuationCenter: b.evacuation_center_name || "-",
          image: b.baranggay_pic || "/images/baranggay/default.jpg",
          hazardAreas: [],
          lguId: b.lgu_id,
        }));

        setBarangayMarkers(mapped);
      } catch (e: any) {
        console.error("Barangay fetch error:", e);
        setError((prev) => prev ?? (e?.message || "Failed to load Barangay points."));
      } finally {
        setPendingLoads((n) => Math.max(0, n - 1));
      }
    })();

    return () => {
      cancelled = true;
    };
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
      let base: MarkerWithPhotos[] = [
        ...lguMarkers,
        ...raffiMarkers,
        ...barangayMarkers, // fetched barangays instead of local samples
      ];
      if (selectedType) base = base.filter((m) => m.type === selectedType);
      return evacuationCenter ? [...base, evacuationCenter] : base;
    }, [lguMarkers, raffiMarkers, barangayMarkers, selectedType, evacuationCenter]);

    if (loading) {
      return <div style={{ padding: 16 }}>Loading markers…</div>;
    }

    return (
      <div className={`main-container ${sidebarOpen ? "sidebar-open" : ""}`}>
        {error && (
          <div
            style={{
              padding: 12,
              background: "#fff3cd",
              color: "#664d03",
              border: "1px solid #ffecb5",
              marginBottom: 8,
            }}
            role="alert"
          >
            ⚠️ {error}. Showing available data from successful requests.
          </div>
        )}

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
            <span className="legend-color" style={{ backgroundColor: "blue" }} /> LGU
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "red" }} /> Barangay
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: "yellow" }} /> RAFI Infrastructure
          </div>
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
            <button className="close-sidebar" onClick={handleCloseSidebar}>
              x
            </button>
            {selectedMarker.image && <img src={selectedMarker.image} alt={selectedMarker.lguName} />}
            <h2>{selectedMarker.lguName}</h2>
            <hr />
            <p>{selectedMarker.description}</p>
            <hr />
            {(selectedMarker.type === "lgu" || selectedMarker.type === "barangay") && (
              <>
                <p>
                  <strong>Population:</strong> {selectedMarker.population}
                </p>
                <p>
                  <strong>Available Resources:</strong> {selectedMarker.resources || "-"}
                </p>
                <p>
                  <strong>Evacuation Center:</strong> {selectedMarker.evacuationCenter}
                </p>

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

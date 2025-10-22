import { useEffect, useMemo, useState } from "react";
import MapView, { MarkerType } from "../../../components/MapView/MapView";
import { Link } from "react-router-dom";
import "../css/MapOfCebu.css";

/* ---------- Local Types ---------- */
type HazardPhoto = { src: string; label: string };
type MarkerWithPhotos = MarkerType & {
  hazardPhotos?: HazardPhoto[];
  lguId?: number;

  // Evac fields used by MapView + sidebar
  capacity?: number | null;
  occupied?: number | null;
  evacStatus?: string | null;
  address?: string | null; // optional if your API later adds it
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
  lat: number | string;
  lng: number | string;
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

/** Evacuation Center API shape */
type EvacAPI = {
  id: number | string;
  name: string;
  lat: number | string;
  lng: number | string;
  capacity: number | string | null;
  occupied: number | string | null;
  status: string; // "Full" | "Near Full" | "Available" | "Empty" | "Unknown"
  // address?: string | null; // if you add this server-side later, we'll pick it up
};

/* ---------- API Bases ---------- */
const RAW_API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const MAPOFCEBU_BASE = "/lgu_profiling/mapofcebu";
const API_BASE = `${RAW_API.replace(/\/+$/, "")}${MAPOFCEBU_BASE}`;

/** If you still need it elsewhere */
const MANAGE_BASE = "/lgu_profiling/manage_lgu";
const MANAGE_API = `${RAW_API.replace(/\/+$/, "")}${MANAGE_BASE}`;

/* ---------- Small UI helpers ---------- */
const fmtNum = (v?: number | null) =>
  Number.isFinite(v as number) ? (v as number).toLocaleString() : "Unknown";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

const badgeColor = (status?: string | null) => {
  switch ((status ?? "").toLowerCase()) {
    case "full":
      return "#dc2626"; // red-600
    case "near full":
      return "#d97706"; // amber-600
    case "available":
    case "empty":
      return "#16a34a"; // green-600
    default:
      return "#6b7280"; // gray-500
  }
};

const MapOfCebu = () => {
  const [lguMarkers, setLguMarkers] = useState<MarkerWithPhotos[]>([]);
  const [raffiMarkers, setRaffiMarkers] = useState<MarkerWithPhotos[]>([]);
  const [barangayMarkers, setBarangayMarkers] = useState<MarkerWithPhotos[]>([]);
  const [evacMarkers, setEvacMarkers] = useState<MarkerWithPhotos[]>([]);

  const [pendingLoads, setPendingLoads] = useState<number>(4);
  const loading = pendingLoads > 0;

  const [error, setError] = useState<string | null>(null);

  const [selectedMarker, setSelectedMarker] = useState<MarkerWithPhotos | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pathCoordinates, setPathCoordinates] = useState<[number, number][] | null>(null);
  const [evacuationCenter, setEvacuationCenter] = useState<MarkerType | null>(null);

  /* ---------- Helpers ---------- */
  const distKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const s1 = Math.sin(dLat / 2) ** 2;
    const s2 = Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s1 + s2));
  };

  /* ---------- Fetch LGU points ---------- */
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
          resources:
            Array.isArray(p.resources) && p.resources.length ? p.resources.join(", ") : "-",
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

  /* ---------- Fetch RAFI points ---------- */
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

  /* ---------- Fetch Barangays ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
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

  /* ---------- Fetch Evacuation Centers (REAL data) ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const url = `${API_BASE}/evacuation-centers`;
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok) throw new Error(`GET /evacuation-centers failed: HTTP ${res.status}`);
        const data: EvacAPI[] = await res.json();
        if (cancelled) return;

        const mapped: MarkerWithPhotos[] = data.map((e) => {
          const cap = Number(e.capacity);
          const occ = Number(e.occupied);

          return {
            lat: Number(e.lat) || 0,
            lng: Number(e.lng) || 0,
            lguName: e.name,
            type: "evacuation",

            capacity: Number.isFinite(cap) ? cap : null,
            occupied: Number.isFinite(occ) ? occ : null,
            evacStatus: (e.status ?? "Unknown") || "Unknown",
            // address: (e as any).address ?? null, // if you add it later

            // Useful text for default popup (we’ll override in sidebar anyway)
            description: `Status: ${e.status ?? "Unknown"}`,
            resources: `Capacity: ${Number.isFinite(cap) ? cap : "Unknown"} | Occupied: ${
              Number.isFinite(occ) ? occ : "Unknown"
            }`,

            hazardAreas: [],
          };
        });

        setEvacMarkers(mapped);
      } catch (e: any) {
        console.error("Evacuation fetch error:", e);
        setError((prev) => prev ?? (e?.message || "Failed to load Evacuation Centers."));
      } finally {
        setPendingLoads((n) => Math.max(0, n - 1));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- UI Handlers ---------- */
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
    if (!evacMarkers.length) {
      setError((prev) => prev ?? "No evacuation centers found.");
      return;
    }
    const nearest = evacMarkers
      .map((e) => ({
        m: e,
        d: distKm(selectedMarker.lat, selectedMarker.lng, e.lat, e.lng),
      }))
      .sort((a, b) => a.d - b.d)[0]?.m;

    if (!nearest) {
      setError((prev) => prev ?? "No evacuation centers found.");
      return;
    }

    setEvacuationCenter(nearest);
    setPathCoordinates([
      [selectedMarker.lat, selectedMarker.lng],
      [nearest.lat, nearest.lng],
    ]);
  };

  /* ---------- Combine markers (with filtering) ---------- */
  const combinedMarkers = useMemo(() => {
    let base: MarkerWithPhotos[] = [
      ...lguMarkers,
      ...raffiMarkers,
      ...barangayMarkers,
      ...evacMarkers,
    ];
    if (selectedType) base = base.filter((m) => m.type === selectedType);
    return evacuationCenter ? [...base, evacuationCenter] : base;
  }, [lguMarkers, raffiMarkers, barangayMarkers, evacMarkers, selectedType, evacuationCenter]);

  /* ---------- Render ---------- */
  if (loading) {
    return <div style={{ padding: 16 }}>Loading markers…</div>;
  }

  // Inline styles for the evacuation card
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  };
  const label = { color: "#6b7280", fontSize: 13 };
  const value = { fontWeight: 700, fontSize: 16 };
  const row = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6",
  };
  const progressWrap = {
    height: 8,
    width: "100%",
    background: "#f3f4f6",
    borderRadius: 9999,
    overflow: "hidden",
  };
  const small = { fontSize: 13, color: "#6b7280", marginTop: 6 };
  const statusPill = (s?: string | null) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 9999,
    background: "#f3f4f6",
    color: badgeColor(s),
    fontWeight: 700,
    fontSize: 12,
    border: `1px dashed ${badgeColor(s)}`,
  });

  const renderEvacCard = (m: MarkerWithPhotos) => {
    const cap = Number.isFinite(m.capacity as number) ? (m.capacity as number) : 0;
    const occ = Number.isFinite(m.occupied as number) ? (m.occupied as number) : 0;
    const available = Math.max(0, cap - occ);
    const utilPct = cap > 0 ? clamp((occ / cap) * 100, 0, 100) : 0;

    return (
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{m.lguName}</h3>
          <span style={statusPill(m.evacStatus)}>{m.evacStatus ?? "Unknown"}</span>
        </div>

        {m.address && (
          <div style={{ ...small, marginBottom: 8 }}>{m.address}</div>
        )}

        <div style={{ ...row, borderTop: "1px solid #f3f4f6" }}>
          <span style={label}>Capacity:</span>
          <span style={value}>{fmtNum(cap)}</span>
        </div>
        <div style={row}>
          <span style={label}>Occupied:</span>
          <span style={{ ...value, color: "#16a34a" }}>{fmtNum(occ)}</span>
        </div>
        <div style={row}>
          <span style={label}>Available:</span>
          <span style={value}>{fmtNum(available)}</span>
        </div>

        <div style={{ paddingTop: 12 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={label}>Utilization:</span>
            <span style={{ ...value, color: "#16a34a" }}>{utilPct.toFixed(1)}%</span>
          </div>
          <div style={{ ...progressWrap, marginTop: 8 }}>
            <div style={{ width: `${utilPct}%`, height: "100%", background: "#16a34a" }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`map-of-cebu-container ${sidebarOpen ? "sidebar-open" : ""}`}>
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
        <button className="map-button" onClick={() => setSelectedType("evacuation")}>
          Evacuation Centers
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
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "green" }} /> Evacuation Center
        </div>
      </div>

      <div className="map-container">
  <MapView
    center={[10.313924, 123.887082]} // Cebu City (centered between north & south Cebu)
    markers={combinedMarkers as MarkerType[]}
    onMarkerClick={handleMarkerClick as unknown as (m: MarkerType) => void}
    pathCoordinates={pathCoordinates}
    fitBounds={false} // we keep manual zoom
  />
</div>


      {sidebarOpen && selectedMarker && (
        <div className="sidebar">
          <button className="close-sidebar" onClick={handleCloseSidebar}>
            x
          </button>

          {/* Evacuation: custom stats card */}
          {selectedMarker.type === "evacuation" && renderEvacCard(selectedMarker)}

          {/* Others: keep your old layout */}
          {selectedMarker.type !== "evacuation" && (
            <>
              {selectedMarker.image && (
                <img src={selectedMarker.image} alt={selectedMarker.lguName} />
              )}

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
                    <button
                      className="map-button"
                      style={{ marginTop: 10 }}
                      onClick={handleNearestEvacuation}
                    >
                      Nearest Evacuation
                    </button>
                  )}
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

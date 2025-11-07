import { useEffect, useMemo, useState } from "react";
import MapView, { MarkerType } from "../../../components/MapView/MapView";
import { Link } from "react-router-dom";
import "../css/MapOfCebu.css";

/* ---------- Local Types ---------- */
type HazardPhoto = { src: string; label: string };
type MarkerWithPhotos = MarkerType & {
  hazardPhotos?: HazardPhoto[];
  lguId?: number;

  // Evac fields
  capacity?: number | null;
  occupied?: number | null;
  evacStatus?: string | null;
  address?: string | null;

  // LGU
  classification?: string;
  mayor?: string | null;
  drmmPersonnel?: string | null;
  baranggayCount?: number | null;
  hazardPic?: string | null;

  // BARANGAY-SPECIFIC
  captain?: string | null;
  contact?: string | null;
  totalPopulation?: number | string | null;
  households?: number | string | null;
  commonHazards?: string[] | null;
  pwd?: number | null;
  senior?: number | null;
  children?: number | null;
};

type LGUDetail = {
  id: number;
  lgu_name: string;
  lgu_classification: string;
  population?: number | null;
  mayor?: string | null;
  lgu_contact?: string | null;
  lat: number | string | null;
  lng: number | string | null;
  lgu_seal?: string | null;
  hazard_pic?: string | null;
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

  // images & desc
  baranggay_pic?: string | null;
  baranggay_desc?: string | null;

  // barangay info
  contact_info?: string | null;
  barangay_captain?: string | null;
  total_population?: number | string | null;
  household_count?: number | string | null;

  // risk
  common_hazards?: string[] | null;

  // vulnerable groups
  barangay_pwd?: number | null;
  barangay_senior?: number | null;
  barangay_children?: number | null;

  // relations
  lgu_id: number;
  lgu_name?: string | null;
  evacuation_center_id?: number | null;
  evacuation_center_name?: string | null;

  // (compat)
  population?: number | string | null;
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
  // address?: string | null; // optional on server
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

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

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
  // searching

  const [lguMarkers, setLguMarkers] = useState<MarkerWithPhotos[]>([]);
  const [raffiMarkers, setRaffiMarkers] = useState<MarkerWithPhotos[]>([]);
  const [barangayMarkers, setBarangayMarkers] = useState<MarkerWithPhotos[]>(
    []
  );
  const [evacMarkers, setEvacMarkers] = useState<MarkerWithPhotos[]>([]);
  // 🔎 Search state
  const [searchVisible, setSearchVisible] = useState(true);

  const [center, setCenter] = useState<[number, number]>([
    10.313924, 123.887082,
  ]);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const allMarkers: MarkerWithPhotos[] = useMemo(
    () => [...lguMarkers, ...barangayMarkers, ...raffiMarkers, ...evacMarkers],
    [lguMarkers, barangayMarkers, raffiMarkers, evacMarkers]
  );

  const normalize = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();

  // Support “lat,lng” direct jump
  const parseLatLng = (s: string): [number, number] | null => {
    const m = s
      .trim()
      .match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (!m) return null;
    const lat = Number(m[1]),
      lng = Number(m[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
    return null;
  };

  // Compute ranked suggestions
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = normalize(query);

    // If it's coordinates, show a single "Go to coordinates" pseudo-result
    const latlng = parseLatLng(query);
    if (latlng) {
      return [
        {
          __kind: "coords" as const,
          label: `Go to ${latlng[0].toFixed(5)}, ${latlng[1].toFixed(5)}`,
          coords: latlng,
        },
      ];
    }

    const score = (m: MarkerWithPhotos) => {
      const name = normalize(m.lguName || "");
      const type = normalize(m.type || "");
      let s = 0;
      if (name === q) s += 100; // exact
      if (name.includes(q)) s += 60; // substring
      if (type.includes(q)) s += 10; // type hint (e.g., "barangay")
      return s;
    };

    return allMarkers
      .map((m) => ({ __kind: "marker" as const, marker: m, sc: score(m) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 8);
  }, [query, allMarkers]);

  // Smoothly move + open sidebar
  const goToMarker = (m: MarkerWithPhotos) => {
  setCenter([m.lat, m.lng]);
  setSelectedMarker(m);
  setSidebarOpen(true);
  setSearchVisible(false); // 👈 hide search bar
  setPathCoordinates(null);
  setEvacuationCenter(null);
  if (m.type === "lgu" && typeof m.lguId === "number") {
    loadHazardsForLGU(m.lguId);
  }
};

const submitSearch = () => {
  if (!suggestions.length) return;

  const top = suggestions[activeIndex] ?? suggestions[0];
  if (top.__kind === "coords") {
    setCenter(top.coords);
    setSidebarOpen(false);
    setSelectedMarker(null);
    setSearchVisible(false); // 👈 hide when go to coords too
    return;
  }
  goToMarker(top.marker);
};


  // Keyboard nav for suggestions
  useEffect(() => {
    if (!isSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (!suggestions.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % suggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex(
          (i) => (i - 1 + suggestions.length) % suggestions.length
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitSearch();
        setIsSearchOpen(false);
      } else if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isSearchOpen, suggestions, activeIndex]);

  const [pendingLoads, setPendingLoads] = useState<number>(4);
  const loading = pendingLoads > 0;

  const [error, setError] = useState<string | null>(null);

  const [selectedMarker, setSelectedMarker] = useState<MarkerWithPhotos | null>(
    null
  );
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pathCoordinates, setPathCoordinates] = useState<
    [number, number][] | null
  >(null);
  const [evacuationCenter, setEvacuationCenter] = useState<MarkerType | null>(
    null
  );

  // per-LGU hazards cache & loading flags
  const [hazardsByLGU, setHazardsByLGU] = useState<
    Record<number, HazardPhoto[]>
  >({});
  const [hazardLoading, setHazardLoading] = useState<Record<number, boolean>>(
    {}
  );

  /* ---------- Helpers ---------- */
  const distKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(bLat - aLat);
    const dLng = toRad(bLng - aLng);
    const s1 = Math.sin(dLat / 2) ** 2;
    const s2 =
      Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s1 + s2));
  };

  // loader for LGU hazards (lazy-load & cache)
  async function loadHazardsForLGU(lguId: number) {
    if (hazardsByLGU[lguId]) return; // already loaded
    setHazardLoading((m) => ({ ...m, [lguId]: true }));
    try {
      const res = await fetch(`${MANAGE_API}/lgu/${lguId}/hazards`, {
        mode: "cors",
      });
      if (!res.ok) throw new Error(`GET hazards failed: HTTP ${res.status}`);
      const data = await res.json();
      const photos: HazardPhoto[] = (data.items || []).map((it: any) => ({
        src: it.image_url,
        label: `${it.type || "Hazard"}${it.area ? " • " + it.area : ""}`,
      }));
      setHazardsByLGU((m) => ({ ...m, [lguId]: photos }));
    } catch (e: any) {
      console.error("Hazards fetch error:", e);
      // non-fatal
    } finally {
      setHazardLoading((m) => ({ ...m, [lguId]: false }));
    }
  }

  /* ---------- Fetch LGU points ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const url = `${API_BASE}/lgu/points`;
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok)
          throw new Error(`GET /lgu/points failed: HTTP ${res.status}`);
        const data: LGUDetail[] = await res.json();
        if (cancelled) return;

        const mapped: MarkerWithPhotos[] = data
  .filter((p) => p && p.lat != null && p.lng != null)
  .map((p) => ({
    lat: Number(p.lat) || 0,
    lng: Number(p.lng) || 0,
    lguName: p.lgu_name,
    type: "lgu",
    population: String(p.population ?? ""),
    image: p.lgu_seal || "/images/lgu/default.jpg", // LGU Seal
    hazardAreas: [],
    lguId: p.id,

    classification: p.lgu_classification,
    mayor: p.mayor ?? null,

    // NEW:
    drmmPersonnel: (p as any).DRMMpersonel ?? null,
    drmmContact: (p as any).DRMM_contact ?? (p as any).lgu_contact ?? null,
    majorHazards: (p as any).lgu_majorHazard ?? null,
    criticalFacilities: (p as any).lgu_critical_facility ?? null,
    baranggayCount: (p as any).baranggay_count ?? null,
    pwdCount: (p as any).lgu_pwd ?? null,
    seniorCount: (p as any).lgu_senior ?? null,
    childrenCount: (p as any).lgu_children ?? null,

    hazardPic: (p as any).hazard_pic ?? null,
  }));


        setLguMarkers(mapped);
      } catch (e: any) {
        console.error("LGU fetch error:", e);
        setError(
          (prev) => prev ?? (e?.message || "Failed to load LGU points.")
        );
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
        setError(
          (prev) => prev ?? (e?.message || "Failed to load RAFI points.")
        );
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
        if (!res.ok)
          throw new Error(`GET /barangays failed: HTTP ${res.status}`);
        const data: BarangayAPI[] = await res.json();
        if (cancelled) return;

        const mapped: MarkerWithPhotos[] = data.map((b) => ({
          lat: Number(b.lat) || 0,
          lng: Number(b.lng) || 0,
          lguName: b.name,
          type: "barangay",

          // image + desc
          image: b.baranggay_pic || "/images/baranggay/default.jpg",
          description: b.baranggay_desc || "",

          // info
          captain: b.barangay_captain ?? null,
          contact: b.contact_info ?? null,
          totalPopulation: b.total_population ?? b.population ?? null, // both supported
          households: b.household_count ?? null,

          // risk
          commonHazards: Array.isArray(b.common_hazards)
            ? b.common_hazards
            : [],

          // vulnerable groups
          pwd: b.barangay_pwd ?? null,
          senior: b.barangay_senior ?? null,
          children: b.barangay_children ?? null,

          // misc/compat
          resources: "-",
          evacuationCenter: b.evacuation_center_name || "-",
          hazardAreas: [],
          lguId: b.lgu_id,
        }));

        setBarangayMarkers(mapped);
      } catch (e: any) {
        console.error("Barangay fetch error:", e);
        setError(
          (prev) => prev ?? (e?.message || "Failed to load Barangay points.")
        );
      } finally {
        // FIX: remove stray 'setPending' and keep the counter decrement
        setPendingLoads((n) => Math.max(0, n - 1));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- Fetch Evacuation Centers ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const url = `${API_BASE}/evacuation-centers`;
      try {
        const res = await fetch(url, { mode: "cors" });
        if (!res.ok)
          throw new Error(`GET /evacuation-centers failed: HTTP ${res.status}`);
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
            description: `Status: ${e.status ?? "Unknown"}`,
            resources: `Capacity: ${
              Number.isFinite(cap) ? cap : "Unknown"
            } | Occupied: ${Number.isFinite(occ) ? occ : "Unknown"}`,
            hazardAreas: [],
          };
        });

        setEvacMarkers(mapped);
      } catch (e: any) {
        console.error("Evacuation fetch error:", e);
        setError(
          (prev) => prev ?? (e?.message || "Failed to load Evacuation Centers.")
        );
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
  setSearchVisible(false)
    setPathCoordinates(null);
    setEvacuationCenter(null);

    if (marker.type === "lgu" && typeof marker.lguId === "number") {
      loadHazardsForLGU(marker.lguId);
    }
  };

  useEffect(() => {
    if (
      selectedMarker?.type === "lgu" &&
      typeof selectedMarker.lguId === "number"
    ) {
      loadHazardsForLGU(selectedMarker.lguId);
    }
  }, [selectedMarker?.lguId]);

 const handleCloseSidebar = () => {
  setSidebarOpen(false);
  setSelectedMarker(null);
  setSelectedType(null);
  setPathCoordinates(null);
  setEvacuationCenter(null);
  setSearchVisible(true); // 👈 already here to show the bar again
  setQuery(""); // 👈 clear the search bar text when closing
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

  /* ---------- Combine markers ---------- */
  const combinedMarkers = useMemo(() => {
    let base: MarkerWithPhotos[] = [
      ...lguMarkers,
      ...raffiMarkers,
      ...barangayMarkers,
      ...evacMarkers,
    ];
    if (selectedType) base = base.filter((m) => m.type === selectedType);
    return evacuationCenter ? [...base, evacuationCenter] : base;
  }, [
    lguMarkers,
    raffiMarkers,
    barangayMarkers,
    evacMarkers,
    selectedType,
    evacuationCenter,
  ]);

  /* ---------- Styles ---------- */
  const card: React.CSSProperties = {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 16,
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  };
  const label: React.CSSProperties = { color: "#6b7280", fontSize: 13 };
  const value: React.CSSProperties = { fontWeight: 700, fontSize: 16 };
  const row: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 0",
    borderBottom: "1px solid #f3f4f6",
  };
  const progressWrap: React.CSSProperties = {
    height: 8,
    width: "100%",
    background: "#f3f4f6",
    borderRadius: 9999,
    overflow: "hidden",
  };
  const small: React.CSSProperties = {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
  };
  const statusPill = (s?: string | null): React.CSSProperties => ({
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
    const cap = Number.isFinite(m.capacity as number)
      ? (m.capacity as number)
      : 0;
    const occ = Number.isFinite(m.occupied as number)
      ? (m.occupied as number)
      : 0;
    const available = Math.max(0, cap - occ);
    const utilPct = cap > 0 ? clamp((occ / cap) * 100, 0, 100) : 0;

    return (
      <div style={card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 6,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            {m.lguName}
          </h3>
          <span style={statusPill(m.evacStatus)}>
            {m.evacStatus ?? "Unknown"}
          </span>
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
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <span style={label}>Utilization:</span>
            <span style={{ ...value, color: "#16a34a" }}>
              {utilPct.toFixed(1)}%
            </span>
          </div>
          <div style={{ ...progressWrap, marginTop: 8 }}>
            <div style={{ width: `${utilPct}%`, height: "100%" }} />
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Render ---------- */
  if (loading) return <div style={{ padding: 16 }}>Loading markers…</div>;

  return (
    <div
      className={`map-of-cebu-container ${sidebarOpen ? "sidebar-open" : ""}`}
    >
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
  <button
    className={`map-button ${selectedType === null ? "active" : ""}`}
    onClick={() => setSelectedType(null)}
  >
    Show All
  </button>
  <button
    className={`map-button ${selectedType === "lgu" ? "active" : ""}`}
    onClick={() => setSelectedType("lgu")}
  >
    LGU
  </button>
  <button
    className={`map-button ${selectedType === "barangay" ? "active" : ""}`}
    onClick={() => setSelectedType("barangay")}
  >
    Barangay
  </button>
  <button
    className={`map-button ${selectedType === "raffi" ? "active" : ""}`}
    onClick={() => setSelectedType("raffi")}
  >
    RAFI Infrastructure
  </button>
  <button
    className={`map-button ${selectedType === "evacuation" ? "active" : ""}`}
    onClick={() => setSelectedType("evacuation")}
  >
    Evacuation Centers
  </button>
</div>

      <div className="legend-box">
        <h4>Legend</h4>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "blue" }} />{" "}
          LGU
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "red" }} />{" "}
          Barangay
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "yellow" }}
          />{" "}
          RAFI Infrastructure
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "green" }} />{" "}
          Evacuation Center
        </div>
      </div>
      {/* 🔎 Search bar */}
      {searchVisible && (
  <div className="map-search">
    <input
      type="text"
      placeholder="Search LGU, Barangay, RAFFI, Evacuation"
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        setIsSearchOpen(true);
        setActiveIndex(0);
      }}
      onFocus={() => setIsSearchOpen(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          submitSearch();
          setIsSearchOpen(false);
        }
      }}
    />
    {!!(isSearchOpen && suggestions.length) && (
      <div className="map-search__dropdown">
        {suggestions.map((s, idx) => {
          if (s.__kind === "coords") {
            return (
              <div
                key={`coords-${s.label}`}
                className={`map-search__item ${idx === activeIndex ? "is-active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setCenter(s.coords);
                  setIsSearchOpen(false);
                  setSearchVisible(false); // 👈 hide when selecting
                }}
              >
                <span className="type-pill">Coords</span>
                <span>{s.label}</span>
              </div>
            );
          }

          const m = s.marker;
          return (
            <div
              key={`${m.type}-${m.lguName}-${m.lat}-${m.lng}`}
              className={`map-search__item ${idx === activeIndex ? "is-active" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                goToMarker(m);
                setIsSearchOpen(false);
                setSearchVisible(false); // 👈 hide when selecting
              }}
              title={`${m.type} • ${m.lguName}`}
            >
              <span className="type-pill">{m.type}</span>
              <span className="truncate">{m.lguName}</span>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}


      <div className="map-container">
        <MapView
          center={center}
          markers={combinedMarkers as MarkerType[]}
          onMarkerClick={
            handleMarkerClick as unknown as (m: MarkerType) => void
          }
          pathCoordinates={pathCoordinates}
          fitBounds={false}
        />
      </div>

      {sidebarOpen && selectedMarker && (
        <div className="sidebar">
          <button className="close-sidebar" onClick={handleCloseSidebar}>
            x
          </button>

          {/* Barangay sidebar */}
          {selectedMarker.type === "barangay" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {selectedMarker.image && (
                <img
                  src={selectedMarker.image}
                  alt={selectedMarker.lguName}
                  className="lgu-header-img"
                />
              )}

              <h2 style={{ margin: "4px 0 0 0", textAlign: "center" }}>
                <b>{selectedMarker.lguName}</b>
              </h2>

              {/* Barangay Information Details */}
              <div style={card}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Barangay Information Details
                </h3>
                <div style={row}>
                  <span style={label}>Captain</span>
                  <span style={value}>{selectedMarker.captain || "-"}</span>
                </div>
                <div style={row}>
                  <span style={label}>Contact</span>
                  <span style={value}>{selectedMarker.contact || "-"}</span>
                </div>
                <div style={row}>
                  <span style={label}>Total Population</span>
                  <span style={value}>
                    {(() => {
                      const n = Number(selectedMarker.totalPopulation);
                      return Number.isFinite(n)
                        ? n.toLocaleString()
                        : selectedMarker.totalPopulation ?? "-";
                    })()}
                  </span>
                </div>
                <div style={{ ...row, borderBottom: "none" }}>
                  <span style={label}>Number of Household</span>
                  <span style={value}>
                    {(() => {
                      const n = Number(selectedMarker.households);
                      return Number.isFinite(n)
                        ? n.toLocaleString()
                        : selectedMarker.households ?? "-";
                    })()}
                  </span>
                </div>
              </div>

              {/* Disaster Risk Profile */}
              <div style={card}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Disaster Risk Profile
                </h3>
                <div style={row}>
                  <span style={label}>Common Hazard</span>
                  <span style={{ ...value, fontWeight: 600 }}>
                    {selectedMarker.commonHazards?.length
                      ? selectedMarker.commonHazards.join(", ")
                      : "-"}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="map-button"
                    onClick={handleNearestEvacuation}
                    title="Compute nearest evacuation center (no database write)"
                  >
                    Nearest Evacuation
                  </button>
                </div>
              </div>

              {/* Vulnerable Groups */}
              <div style={card}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  Vulnerable Groups
                </h3>
                <div style={row}>
                  <span style={label}>PWD</span>
                  <span style={value}>
                    {Number.isFinite(selectedMarker.pwd as number)
                      ? (selectedMarker.pwd as number).toLocaleString()
                      : selectedMarker.pwd ?? "-"}
                  </span>
                </div>
                <div style={row}>
                  <span style={label}>Seniors</span>
                  <span style={value}>
                    {Number.isFinite(selectedMarker.senior as number)
                      ? (selectedMarker.senior as number).toLocaleString()
                      : selectedMarker.senior ?? "-"}
                  </span>
                </div>
                <div style={{ ...row, borderBottom: "none" }}>
                  <span style={label}>Children</span>
                  <span style={value}>
                    {Number.isFinite(selectedMarker.children as number)
                      ? (selectedMarker.children as number).toLocaleString()
                      : selectedMarker.children ?? "-"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Barangay sidebar */}
          {/* RAFI sidebar */}
          {selectedMarker.type === "raffi" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Header image */}
              {selectedMarker.image && (
                <img
                  src={selectedMarker.image}
                  alt={selectedMarker.lguName}
                  className="lgu-header-img"
                />
              )}

              {/* Name */}
              <h2 style={{ margin: "4px 0 0 0", textAlign: "center" }}>
                <b>{selectedMarker.lguName}</b>
              </h2>

              {/* Description card */}
              <div style={card}>
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>Description</h3>
                <div
                  style={{ fontSize: 14, color: "#111827", lineHeight: 1.45 }}
                >
                  {selectedMarker.description || "-"}
                </div>
              </div>
            </div>
          )}

          {/* Evacuation card */}
          {selectedMarker.type === "evacuation" &&
            renderEvacCard(selectedMarker)}

          {/* LGU sidebar */}
          {selectedMarker.type === "lgu" && (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    {/* LGU Seal (header) */}
    {selectedMarker.image && (
      <img
        src={selectedMarker.image}
        alt={`${selectedMarker.lguName} Seal`}
        className="lgu-header-img"
      />
    )}

    {/* LGU name */}
    <h2 style={{ textAlign: "center", marginTop: 8 }}>
      <b>{selectedMarker.lguName}</b>
    </h2>

    {/* LGU Information Details */}
    <div style={{ ...card, padding: 12 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>LGU Information Details</h3>
      <div style={{ ...row, borderTop: "1px solid #f3f4f6" }}>
        <span style={label}>Classification</span>
        <span style={value}>{selectedMarker.classification || "-"}</span>
      </div>
      <div style={row}>
        <span style={label}>Total Population</span>
        <span style={value}>
          {(() => {
            const n = Number(selectedMarker.population);
            return Number.isFinite(n) ? n.toLocaleString() : (selectedMarker.population || "-");
          })()}
        </span>
      </div>
      <div style={row}>
        <span style={label}>No. of Barangay</span>
        <span style={value}>
          {Number.isFinite(selectedMarker.baranggayCount as number)
            ? (selectedMarker.baranggayCount as number).toLocaleString()
            : selectedMarker.baranggayCount ?? "-"}
        </span>
      </div>
      <div style={{ ...row, borderBottom: "none" }}>
        <span style={label}>Mayor</span>
        <span style={value}>{selectedMarker.mayor || "-"}</span>
      </div>
    </div>

    {/* DRRM Office */}
    <div style={{ ...card, padding: 12 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>
        Disaster Risk Reduction &amp; Management Office
      </h3>
      <div style={{ ...row, borderTop: "1px solid #f3f4f6" }}>
        <span style={label}>DRMM local personnel</span>
        <span style={value}>{selectedMarker.drmmPersonnel || "-"}</span>
      </div>
      <div style={row}>
        <span style={label}>DRMM contact</span>
        <span style={value}>{selectedMarker.drmmContact || "-"}</span>
      </div>
      <div style={row}>
        <span style={label}>Major Hazard</span>
        <span style={{ ...value, fontWeight: 600 }}>
          {selectedMarker.majorHazards?.length
            ? selectedMarker.majorHazards.join(", ")
            : "-"}
        </span>
      </div>
      <div style={{ ...row, borderBottom: "none" }}>
        <span style={label}>Critical Facilities</span>
        <span style={{ ...value, fontWeight: 600 }}>
          {selectedMarker.criticalFacilities?.length
            ? selectedMarker.criticalFacilities.join(", ")
            : "-"}
        </span>
      </div>
    </div>

    {/* Vulnerable Population */}
    <div style={{ ...card, padding: 12 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Vulnerable Population</h3>
      <div style={{ ...row, borderTop: "1px solid #f3f4f6" }}>
        <span style={label}>PWD</span>
        <span style={value}>
          {Number.isFinite(selectedMarker.pwdCount as number)
            ? (selectedMarker.pwdCount as number).toLocaleString()
            : selectedMarker.pwdCount ?? "-"}
        </span>
      </div>
      <div style={row}>
        <span style={label}>Senior Citizen</span>
        <span style={value}>
          {Number.isFinite(selectedMarker.seniorCount as number)
            ? (selectedMarker.seniorCount as number).toLocaleString()
            : selectedMarker.seniorCount ?? "-"}
        </span>
      </div>
      <div style={{ ...row, borderBottom: "none" }}>
        <span style={label}>Children</span>
        <span style={value}>
          {Number.isFinite(selectedMarker.childrenCount as number)
            ? (selectedMarker.childrenCount as number).toLocaleString()
            : selectedMarker.childrenCount ?? "-"}
        </span>
      </div>
    </div>

    {/* Images section: LGU Seal + Hazard Picture */}
    <div style={{ ...card, padding: 12 }}>
      <h3 style={{ margin: 0, marginBottom: 8 }}>Hazard Picture</h3>

      {/* Hazard Picture (prefer loaded gallery; fallback to single hazardPic) */}
      <div>
        {hazardLoading[selectedMarker.lguId!] && (
          <div style={{ fontSize: 13, color: "#6b7280" }}>Loading photos…</div>
        )}
        {!hazardLoading[selectedMarker.lguId!] && (() => {
          const photos = hazardsByLGU[selectedMarker.lguId!] || [];
          if (photos.length) {
            return (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                  gap: 8,
                }}
              >
                {photos.map((p, i) => (
                  <figure key={`${p.src}-${i}`} style={{ margin: 0 }}>
                    <img
                      src={p.src}
                      alt={p.label || `Hazard ${i + 1}`}
                      style={{
                        width: "100%",
                        height: 120,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #eee",
                      }}
                    />
                    {p.label && (
                      <figcaption
                        style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}
                        title={p.label}
                      >
                        {p.label}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            );
          }
          if (selectedMarker.hazardPic) {
            return (
              <img
                src={selectedMarker.hazardPic}
                alt="Hazard"
                style={{
                  width: "100%",
                  maxHeight: 240,
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #eee",
                }}
              />
            );
          }
          return <div style={{ fontSize: 13, color: "#6b7280" }}>No photos found.</div>;
        })()}
      </div>
    </div>
  </div>
)}

        </div>
      )}
    </div>
  );
};

export default MapOfCebu;

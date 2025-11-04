import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  ZoomControl,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React, { useEffect, useRef } from "react";

export interface MarkerType {
  lat: number;
  lng: number;
  name?: string;
  capacity?: number;
  lguName?: string;
  type?: string;
  description?: string;
  population?: string;
  resources?: string;
  evacuationCenter?: string;
  image?: string;
  hazardAreas?: MarkerType[];
}

export function ViewEvents({ onViewChange }: { onViewChange?: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onViewChange) return;
    const handler = () => {
      const c = map.getCenter();
      onViewChange(c.lat, c.lng); // 👈 keep React in sync with Leaflet view
    };
    map.on("moveend", handler);return () => {
  map.off("moveend", handler);  // return type is now void
};
  }, [map, onViewChange]);
  return null;
}
interface MapViewProps {
  center?: [number, number];
  shouldFlyToCenter?: boolean;                 // 👈 new
  onViewChange?: (lat: number, lng: number) => void; 
  markers: MarkerType[];
  onMarkerClick?: (marker: MarkerType) => void;
  fitBounds?: boolean;
  pathCoordinates?: [number, number][] | null;
  customIcon?: L.Icon;
  focusZoom?: number;       // zoom to use when recentering (search/click)
  flyDurationSec?: number;  // animation duration
}

/* ---------- ICONS BY TYPE ---------- */
const getIconByType = (type?: string) => {
  let iconUrl = "/images/default.png";
  if (type === "lgu") iconUrl = "/images/icons/lgu.png";
  else if (type === "barangay") iconUrl = "/images/icons/baranggay.png";
  else if (type === "raffi") iconUrl = "/images/icons/raffi.png";
  else if (type === "hazard") iconUrl = "/images/icons/hazard.png";
  else if (type === "evacuation") iconUrl = "/images/icons/evac.png";

  return L.icon({
    iconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

/* ---------- FIT TO BOUNDS WHEN ENABLED ---------- */
const FitBounds: React.FC<{ markers: MarkerType[] }> = ({ markers }) => {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [markers, map]);
  return null;
};

/* ---------- FLY TO NEW CENTER ON CHANGE (skip initial) ---------- */
const CenterOnChange: React.FC<{
  center: [number, number];
  zoom?: number;
  duration?: number;
  skipFirst?: boolean;
}> = ({ center, zoom, duration, skipFirst = true }) => {
  const map = useMap();
  const didInit = useRef(false);
  const prev = useRef<[number, number] | null>(null);

  useEffect(() => {
    // Skip the very first render to keep initial overview
    if (skipFirst && !didInit.current) {
      didInit.current = true;
      prev.current = center;
      return;
    }

    // No-op if center didn't change
    if (prev.current && prev.current[0] === center[0] && prev.current[1] === center[1]) {
      return;
    }
    prev.current = center;

    const requested = typeof zoom === "number" ? zoom : 18; // default close zoom
    const maxTileZoom = (map as any)._layersMaxZoom ?? map.getMaxZoom() ?? 19;
    const targetZoom = Math.min(requested, maxTileZoom);

    map.flyTo(center, targetZoom, { duration: duration ?? 1.6 });
  }, [center, zoom, duration, map, skipFirst]);

  return null;
};

/* ---------- MAIN MAP COMPONENT ---------- */
const MapView: React.FC<MapViewProps> = ({
  center = [0, 0],
  markers,
  onMarkerClick,
  fitBounds = false,
  pathCoordinates,
  customIcon,
  focusZoom = 18,      // close-up when recentering
  flyDurationSec = 1.6 // smooth but not too slow
}) => {
  return (
    <MapContainer
      center={center}
      zoom={9}
      maxZoom={20}        // allow building-level zoom
      minZoom={9}         // keep Cebu overview, avoid zooming too far out
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
    >
      <ZoomControl position="bottomright" />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={20}
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />

      {fitBounds && <FitBounds markers={markers} />}
      <CenterOnChange
        center={center}
        zoom={focusZoom}
        duration={flyDurationSec}
        skipFirst   // keep initial view as-is
      />

      {markers.map((point, index) => (
        <Marker
          key={index}
          position={[point.lat, point.lng]}
          icon={customIcon || getIconByType(point.type)}
          eventHandlers={{ click: () => onMarkerClick && onMarkerClick(point) }}
        >
          <Popup>
            <div>
              <strong>{point.lguName || point.name || "Unnamed Location"}</strong>
              {point.type === "evacuation" && (
                <>
                  <br />
                  Capacity: {point.capacity ?? "Unknown"}
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {pathCoordinates && <Polyline positions={pathCoordinates} color="red" />}
    </MapContainer>
  );
};

export default MapView;

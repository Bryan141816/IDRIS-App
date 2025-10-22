import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

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

interface MapViewProps {
  center?: [number, number];
  markers: MarkerType[];
  onMarkerClick?: (marker: MarkerType) => void;
  fitBounds?: boolean;
  pathCoordinates?: [number, number][] | null;
  customIcon?: L.Icon;
}

/* ---------- ICONS BY TYPE ---------- */
const getIconByType = (type?: string) => {
  let iconUrl = "/images/default.png";

  if (type === "lgu") iconUrl = "/images/icons/lgu.png";
  else if (type === "barangay") iconUrl = "/images/icons/baranggay.png";
  else if (type === "raffi") iconUrl = "/images/icons/raffi.png";
  else if (type === "hazard") iconUrl = "/images/icons/hazard.png";
  // ✅ Use your green evac pin here
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

/* ---------- MAIN MAP COMPONENT ---------- */
const MapView: React.FC<MapViewProps> = ({
  center = [0, 0],
  markers,
  onMarkerClick,
  fitBounds = false,
  pathCoordinates,
  customIcon,
}) => {
  return (
    <MapContainer
      center={center}
      zoom={9}
      zoomControl={false} // disable default top-left zoom control
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
    >
      {/* ✅ Add Zoom Buttons to bottom-right */}
      <ZoomControl position="bottomright" />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />

      {/* Auto-fit map if enabled */}
      {fitBounds && <FitBounds markers={markers} />}

      {/* Render markers */}
      {markers.map((point, index) => (
        <Marker
          key={index}
          position={[point.lat, point.lng]}
          icon={customIcon || getIconByType(point.type)}
          eventHandlers={{
            click: () => onMarkerClick && onMarkerClick(point),
          }}
        >
          <Popup>
            <div>
              <strong>{point.lguName || point.name || "Unnamed Location"}</strong>
              {/* ✅ Show capacity only for evacuation centers */}
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

      {/* ✅ Draw connecting line from barangay to nearest evacuation center */}
      {pathCoordinates && <Polyline positions={pathCoordinates} color="red" />}
    </MapContainer>
  );
};

export default MapView;

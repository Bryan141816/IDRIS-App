import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
  ZoomControl,
  CircleMarker,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import React, { useEffect, useState } from "react";

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

/* ---------- FLY TO NEW CENTER ON CHANGE ---------- */
const CenterOnChange: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.flyTo(center, map.getZoom(), { duration: 0.75 });
  }, [center, map]);
  return null;
};

/* ---------- SUBTLE HALO TO EMPHASIZE FOCUS ---------- */
const FocusHalo: React.FC<{ center: [number, number] }> = ({ center }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(true);
    const t = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(t);
  }, [center[0], center[1]]);

  if (!show) return null;

  return (
    <>
      {/* inner dot */}
      <CircleMarker
        center={center}
        radius={6}
        pathOptions={{ color: "#3b82f6", weight: 2, fillOpacity: 0.9 }}
      />
      {/* soft outer ring */}
      <CircleMarker
        center={center}
        radius={18}
        pathOptions={{ color: "#3b82f6", weight: 2, opacity: 0.6, fillOpacity: 0.15 }}
      />
    </>
  );
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
      zoomControl={false}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
    >
      <ZoomControl position="bottomright" />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />

      {fitBounds && <FitBounds markers={markers} />}

      {/* animate + emphasize when parent updates center */}
      <CenterOnChange center={center} />
      <FocusHalo center={center} />

      {/* Markers */}
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

      {/* route line from barangay to nearest evac center */}
      {pathCoordinates && <Polyline positions={pathCoordinates} color="red" />}
    </MapContainer>
  );
};

export default MapView;

import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

export interface MarkerType {
  lat: number;
  lng: number;
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
  pathCoordinates?: [number, number][] | null; // new prop for path line
}

const getIconByType = (type?: string) => {
  let iconUrl = "/images/default.png";

  if (type === "lgu") iconUrl = "/images/icons/lgu.png";
  else if (type === "barangay") iconUrl = "/images/icons/baranggay.png";
  else if (type === "raffi") iconUrl = "/images/icons/raffi.png";
  else if (type === "hazard") iconUrl = "/images/icons/hazard.png";
  else if (type === "evacuation") iconUrl = "/images/icons/evacuation.png"; 

  return L.icon({
    iconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const FitBounds: React.FC<{ markers: MarkerType[] }> = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;

    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [markers, map]);

  return null;
};

const MapView: React.FC<MapViewProps> = ({
  center = [0, 0],
  markers,
  onMarkerClick,
  fitBounds = false,
  pathCoordinates,
}) => {
  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} attributionControl={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />

      {fitBounds && <FitBounds markers={markers} />}

      {markers.map((point, index) => (
        <Marker
          key={index}
          position={[point.lat, point.lng]}
          icon={getIconByType(point.type)}
          eventHandlers={{
            click: () => onMarkerClick && onMarkerClick(point),
          }}
        >
          <Popup>{point.lguName || `Marker #${index + 1}`}</Popup>
        </Marker>
      ))}

      {/* Draw polyline from barangay to nearest evacuation center */}
      {pathCoordinates && <Polyline positions={pathCoordinates} color="red" />}
    </MapContainer>
  );
};

export default MapView;

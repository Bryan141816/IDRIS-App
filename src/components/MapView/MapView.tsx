import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Reuse MarkerType from props
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
  center: [number, number];
  markers: MarkerType[];
  onMarkerClick?: (marker: MarkerType) => void;
}

const MapView: React.FC<MapViewProps> = ({ center, markers, onMarkerClick }) => {
  const getIconByType = (type?: string) => {
    let iconUrl = "/images/default.png";
    if (type === "lgu") iconUrl = "/images/icons/lgu.png";
    else if (type === "barangay") iconUrl = "/images/icons/baranggay.png";
    else if (type === "raffi") iconUrl = "/images/icons/raffi.png";

    return L.icon({
      iconUrl,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
  };

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}  attributionControl={false}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />
      {markers.map((point, index) => (
        <Marker
          key={index}
          position={[point.lat, point.lng]}
          icon={getIconByType(point.type)}
          eventHandlers={{
            click: () => {
              onMarkerClick && onMarkerClick(point);
            },
          }}
        >
          <Popup>{point.lguName || `Marker #${index + 1}`}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface LatLng {
  lat: number;
  lng: number;
  lguName?: string;
}

interface MapViewProps {
  center: [number, number];
  markers: LatLng[];
  onMarkerClick?: (marker: LatLng) => void;
}

const MapView: React.FC<MapViewProps> = ({ center, markers, onMarkerClick }) => {
  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />
      {markers.map((point, index) => (
        <Marker
          key={index}
          position={[point.lat, point.lng]}
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

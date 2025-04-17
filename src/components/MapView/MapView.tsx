import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface LatLng {
  lat: number;
  lng: number;
}

interface MapViewProps{
    center: [number, number];
    markers: LatLng[];
}


const MapView: React.FC<MapViewProps> = ({center, markers}) => {
  return (
    <MapContainer center={center} zoom={13} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />
      {markers.map((point, index) => (
        <Marker key={index} position={[point.lat, point.lng]}>
          <Popup>
            Marker #{index + 1}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;

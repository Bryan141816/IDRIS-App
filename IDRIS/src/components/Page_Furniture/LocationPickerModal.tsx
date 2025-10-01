import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Modal } from "./Modals.tsx";

type MarkerData = {
  lat: number;
  lng: number;
};

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

// Handle map click and pass coordinates up
const MapClickHandler: React.FC<{ onAdd: (pos: [number, number]) => void }> = ({
  onAdd,
}) => {
  useMapEvents({
    click(e) {
      onAdd([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};
const ChangeMapView: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);

  return null;
};
interface PickerProps {
  isOpenProp: boolean;
  onCloseProp: () => void;
  onSubmit: (mapData: MarkerData) => void;
  lat?: number | null;
  lng?: number | null;
}

const LocationPickerModal: React.FC<PickerProps> = ({
  isOpenProp,
  onCloseProp,
  onSubmit,
  lat,
  lng,
}) => {
  const [marker, setMarker] = useState<MarkerData | null>(null);

  const [center, setCenter] = useState<[number, number]>([
    10.313924, 123.887082,
  ]);

  const handleMapClick = (pos: [number, number]) => {
    setMarker({ lat: pos[0], lng: pos[1] });
  };
  useEffect(() => {
    if (lat && lng) {
      setMarker({ lat: lat, lng: lng });
      setCenter([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <Modal
      isOpen={isOpenProp}
      onClose={onCloseProp}
      width="60%"
      height="90%"
      zIndex={999}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
          padding: "20px",
          paddingTop: "40px",
        }}
      >
        <span>Select a location</span>
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ChangeMapView center={center} />
          <MapClickHandler onAdd={handleMapClick} />

          {marker && (
            <Marker position={[marker.lat, marker.lng]} icon={defaultIcon} />
          )}
        </MapContainer>
        <div className="action-button">
          <button
            style={{ backgroundColor: "#749AB6", color:"#ffff" }}
            disabled={!marker}
            onClick={() => {
              if (marker) {
                onSubmit(marker);
                onCloseProp();
              }
            }}
          >
            Submit
          </button>
          <button style={{ backgroundColor: "#F84B4D", color:"#ffff"  }} onClick={onCloseProp}>
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default LocationPickerModal;

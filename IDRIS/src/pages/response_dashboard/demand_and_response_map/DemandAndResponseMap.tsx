import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./DemandAndResponseMap.scss";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useNavigate } from "react-router-dom";
import { fetchData } from "../../../API_Handler/response_dashboard";
dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);

interface MapPinBase {
  id: string;
  type: "demand";
  label: string;
  lat: number;
  lng: number;
  address: string;
  last_updated: string;
}

interface DemandPin extends MapPinBase {
  contact: {
    name: string;
    phone: string;
  };
  status: "no response" | "responded" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  submitted_at: string;
  needs: {
    id: number;
    need: string;
    amount: number | "critical";
  }[];
}

type MapPin = DemandPin;

const getIconByStatus = (status: DemandPin["status"]) => {
  let iconUrl = "/images/icons/gray.png";
  if (status === "no response") iconUrl = "/images/icons/baranggay.png";
  else if (status === "responded") iconUrl = "/images/icons/raffi.png";
  else if (status === "completed") iconUrl = "/images/icons/lgu.png";

  return L.icon({
    iconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const FitBounds: React.FC<{ markers: MapPin[] }> = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [markers, map]);

  return null;
};

const MapView: React.FC<{
  center?: [number, number];
  markers: MapPin[];
  onMarkerClick?: (marker: MapPin) => void;
  fitBounds?: boolean;
  pathCoordinates?: [number, number][] | null;
}> = ({
  center = [0, 0],
  markers,
  onMarkerClick,
  fitBounds = false,
  pathCoordinates,
}) => (
  <MapContainer
    center={center}
    zoom={13}
    style={{ height: "100%", width: "100%" }}
    attributionControl={false}
  >
    <TileLayer
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    />
    {fitBounds && <FitBounds markers={markers} />}
    {markers.map((point, index) => (
      <Marker
        key={index}
        position={[point.lat, point.lng]}
        icon={getIconByStatus(point.status)}
        eventHandlers={{
          click: () => onMarkerClick && onMarkerClick(point),
        }}
      />
    ))}
    {pathCoordinates && <Polyline positions={pathCoordinates} color="red" />}
  </MapContainer>
);

const DemandAndResponse = () => {
  const navigate = useNavigate();
  const [selectedMarker, setSelectedMarker] = useState<MapPin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pathCoordinates, setPathCoordinates] = useState<
    [number, number][] | null
  >(null);
  const [markers, setMarkers] = useState<MapPin[] | null>(null);

  const handleMarkerClick = (marker: MapPin) => {
    setSelectedMarker(marker);
    setSidebarOpen(true);
    setPathCoordinates(null);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setSelectedMarker(null);
    setPathCoordinates(null);
  };
  useEffect(() => {
    fetchData<MapPin[]>(
      "/response_dashboard/demand_and_response/get_map_pin",
      setMarkers,
    );
  }, []);

  return (
    <div className={`main-container ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="map-buttons">
        <button className="map-button" onClick={() => navigate("list_view")}>
          Manage
        </button>
      </div>

      <div className="legend-box">
        <h4>Legend</h4>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "red" }}
          ></span>{" "}
          No Response
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "orange" }}
          ></span>{" "}
          Responded
        </div>
        <div className="legend-item">
          <span
            className="legend-color"
            style={{ backgroundColor: "blue" }}
          ></span>{" "}
          Completed
        </div>
      </div>

      <div className="map-container">
        <MapView
          center={[10.313924, 123.887082]}
          markers={markers ?? []}
          onMarkerClick={handleMarkerClick}
          pathCoordinates={pathCoordinates}
          fitBounds={true}
        />
      </div>

      {sidebarOpen && selectedMarker && (
        <div className="sidebar" id="demand-sidebar">
          <button className="close-sidebar" onClick={handleCloseSidebar}>
            x
          </button>
          <h3>{selectedMarker.label}</h3>
          <p>Address: {selectedMarker.address}</p>
          <p>
            Status:{" "}
            <strong
              style={{
                color:
                  selectedMarker.status === "no response"
                    ? "red"
                    : selectedMarker.status === "responded"
                      ? "orange"
                      : "green",
              }}
            >
              {selectedMarker.status.replace("_", " ")}
            </strong>
          </p>
          <p>Priority: {selectedMarker.priority}</p>
          <h4>Needs:</h4>
          <ul>
            {selectedMarker.needs.map((need, i) => (
              <li key={i}>
                {need.need} - {need.amount}
              </li>
            ))}
          </ul>

          <p>
            Last Updated:{" "}
            {dayjs(selectedMarker.last_updated).format("MM/DD/YYYY hh:mm A")}
          </p>
          <p>
            Submitted At:{" "}
            {dayjs(selectedMarker.submitted_at).format("MM/DD/YYYY hh:mm A")}
          </p>
          {selectedMarker.status === "no_response" && (
            <button id="demand_and_response_action_button">
              Send Response
            </button>
          )}
          {selectedMarker.status === "responded" && (
            <button id="demand_and_response_action_button">
              Mark As Completed
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DemandAndResponse;

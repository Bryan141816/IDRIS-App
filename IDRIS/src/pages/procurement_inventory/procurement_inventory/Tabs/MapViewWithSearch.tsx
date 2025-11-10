import React, { useState, ChangeEvent, useEffect } from "react";
import L, { DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, ZoomControl, Marker } from "react-leaflet";
import { useMapEvent } from "react-leaflet";
import axios from "axios";
import Swal from "sweetalert2";
import { useMap } from "react-leaflet";
interface MapViewWithSearchProp {
  onClose: () => void;
  defaultValue: { address: string; coordinates: [number, number] };
  onSubmit: (address: string, coordinates: [number, number]) => void;
  changeAddressOnclik?: boolean;
  autoSearch?: boolean;
  customCenter?: [number, number] | null;
}

interface Geometry {
  coordinates: [number, number]; // [longitude, latitude]
}

// The properties of each feature
interface FeatureProperties {
  name: string;
  city: string;
  state: string;
}

// Each feature
interface Feature {
  properties: FeatureProperties;
  geometry: Geometry;
}

const getIcon = (): DivIcon => {
  const svgIcon = `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="16" cy="37" rx="4" ry="2" fill="rgba(0,0,0,0.2)"/>
      <path d="M16 1C8.82 1 3 6.82 3 14C3 23 16 38 16 38S29 23 29 14C29 6.82 23.18 1 16 1Z"
        fill="#dc3545" stroke="white" stroke-width="2"/>
      <circle cx="16" cy="14" r="6" fill="white"/>
      <circle cx="16" cy="14" r="3" fill="#dc3545"/>
      <text x="16" y="18" text-anchor="middle" fill="white" font-size="8" font-weight="bold">!</text>
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-pin-marker",
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    popupAnchor: [0, -38],
  });
};
export const MapViewWithSearch: React.FC<MapViewWithSearchProp> = ({
  onClose,
  onSubmit,
  defaultValue,
  changeAddressOnclik = true,
  autoSearch = false,
  customCenter = null,
}) => {
  const [initialized, setInitialized] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    defaultValue.coordinates[0] !== -1000000 ? defaultValue.coordinates : null,
  );
  const [searchValue, setSearchValue] = useState(defaultValue.address);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [center, setCenter] = useState<[number, number]>(
    defaultValue.coordinates[0] !== -1000000
      ? defaultValue.coordinates
      : customCenter
        ? customCenter
        : [10.359353, 123.868891],
  ); // latitude, longitude
  const [zoom, setZoom] = useState(
    defaultValue.coordinates[0] !== -1000000 || customCenter ? 17 : 12,
  );
  const [recommendedLocation, setRecommendedLocation] = useState<Feature[]>([]);
  const [searchFound, setSearchFound] = useState(false);
  const [typing, setTyping] = useState(false);
  const reverseGeo = async (coordinates: [number, number]) => {
    if (!changeAddressOnclik) {
      return;
    }
    try {
      setSearchValue("Locating Point");
      const response = await axios.get(
        `https://photon.komoot.io/reverse?lat=${coordinates[0]}&lon=${coordinates[1]}`,
      );
      const { name, city, state } = response.data.features[0].properties;
      setSearchValue(`${name}${city ? ", " + city : ""}, ${state}`);
    } catch (e: any) {
      setSearchValue("Locating Point");
      console.error("Error search location: " + e.message);
    }
  };
  const ClickHandler: React.FC = () => {
    useMapEvent("click", (e) => {
      const target = e.originalEvent.target as HTMLElement;
      if (target.tagName.toLowerCase() === "button") {
        return;
      }
      setMarkerPosition([e.latlng.lat, e.latlng.lng]);
      reverseGeo([e.latlng.lat, e.latlng.lng]);
      setSearchFound(false);
    });
    return null;
  };
  const [target, setTarget] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      return; // skip first render
    }

    if (!target && typing) {
      const timer = setTimeout(() => {
        setTyping(false);
        setDebouncedSearch(searchValue);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchValue]);

  const RecenterButton: React.FC<{ coordinate: [number, number] }> = ({
    coordinate,
  }) => {
    const map = useMap();

    const handleRecenter = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();

      // ✅ animate to target
      map.flyTo(coordinate, 17, {
        animate: true,
        duration: 1.5,
      });
    };

    return (
      <button
        onClick={handleRecenter}
        style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          zIndex: 1000,
          padding: "6px 10px",
          background: "white",
          border: "1px solid #ccc",
          borderRadius: "6px",
          cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          fontSize: "13px",
        }}
      >
        Recenter
      </button>
    );
  };

  const ReCenter: React.FC<{ coordinates: [number, number]; zoom: number }> = ({
    coordinates,
    zoom,
  }) => {
    const map = useMap();

    useEffect(() => {
      if (map) {
        map.flyTo([coordinates[1], coordinates[0]], zoom, {
          animate: true,
          duration: 1.5,
        });
      }
    }, [coordinates, zoom, map]);

    return null;
  };
  useEffect(() => {
    if (debouncedSearch) {
      setSearchFound(false);
      const search = async () => {
        try {
          let center = [10.359353, 123.868891];
          if (customCenter) {
            center = customCenter;
          }
          const response = await axios.get(
            `https://photon.komoot.io/api/?q=${debouncedSearch}&lat=${10.359353}&lon=${123.868891}`,
          );
          setSearchFound(true);
          setRecommendedLocation(response.data.features);
        } catch (e: any) {
          console.error("Error search location: " + e.message);
        }
      };
      search();
      // Call your API or do something
    }
  }, [debouncedSearch]);
  useEffect(() => {
    if (autoSearch) {
      setSearchFound(false);
      const search = async () => {
        try {
          const response = await axios.get(
            `https://photon.komoot.io/api/?q=${defaultValue.address}&lat=${10.359353}&lon=${123.868891}`,
          );
          const target = response.data.features[0].geometry.coordinates;
          setTarget(target);
        } catch (e: any) {
          console.error("Error search location: " + e.message);
        }
      };
      search();
    }
  }, []);

  useEffect(() => {
    if (target) {
      setSearchFound(false);
      setTarget(null);
    }
  }, [target]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setTyping(true);
    setSearchValue(value);
    if (value.length === 0) {
      setSearchFound(false);
    }
  };
  const handleSubmit = () => {
    if (
      (searchValue.trim() === "" || searchValue.trim() === "Locating Point") &&
      !changeAddressOnclik
    ) {
      Swal.fire({
        icon: "error",
        title: "Opps",
        text: "Please Input an Addres",
      });
      return;
    }
    if (!markerPosition) {
      Swal.fire({
        icon: "error",
        title: "Opps",
        text: "Please mark the location properly",
      });
      return;
    }
    onSubmit(searchValue, markerPosition);
    onClose();
  };
  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal" style={{ minWidth: "fit-content" }}>
        <div className="modal-header">
          <h3>Select Location</h3>
          <button className="close-btn" onClick={onClose}>
            x
          </button>
        </div>
        <div
          className="modal-content"
          style={{
            display: "flex",
            flexDirection: "column",
            height: "65vh",
            width: "65vw",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", width: "100%", position: "relative" }}>
            <input
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={handleSearchChange}
            />
            {searchFound && (
              <div
                style={{
                  maxHeight: "400px",
                  overflowY: "auto",
                  border: "1px solid #ccc",
                  padding: "10px",
                  position: "absolute",
                  zIndex: 999,
                  backgroundColor: "white",
                  width: "100%",
                  top: "100%",
                }}
              >
                {recommendedLocation.length === 0 ? (
                  <p>No items found.</p>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {recommendedLocation.map((feature, index) => {
                      const { coordinates } = feature.geometry;
                      const { name, city, state } = feature.properties;

                      return (
                        <li
                          key={index}
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                            display: "flex",
                            flexDirection: "column",
                          }}
                          onClick={() => {
                            setSearchValue(
                              `${name}${city ? ", " + city : ""}, ${state}`,
                            );
                            setTarget(coordinates);
                          }}
                        >
                          <strong>{name}</strong>
                          <span>
                            {city ? city + ", " : ""}
                            {state}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              height: "100%",
              width: "100%",
              overflow: "hidden",
              borderRadius: "5px",
            }}
          >
            <MapContainer
              center={center}
              zoom={zoom}
              zoomControl={false} // disable default top-left zoom control
              style={{ height: "100%", width: "100%", zIndex: 900 }}
              attributionControl={false}
            >
              {/* ✅ Add Zoom Buttons to bottom-right */}
              <ZoomControl position="bottomright" />

              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              />

              <ClickHandler />
              {markerPosition && (
                <Marker position={markerPosition} icon={getIcon()} />
              )}
              {target && <ReCenter coordinates={target} zoom={17} />}
              {markerPosition && <RecenterButton coordinate={markerPosition} />}
            </MapContainer>
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSubmit}>
            Select Location
          </button>
        </div>
      </div>
    </div>
  );
};

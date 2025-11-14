import React, { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  Marker,
  useMap,
} from "react-leaflet";
import L, { DivIcon } from "leaflet";

interface MiniMapProp {
  coordinate: [number, number];
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

const RecenterMap: React.FC<{ coordinate: [number, number] }> = ({
  coordinate,
}) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      map.setView(coordinate, 17);
    }
  }, [coordinate, map]);

  return null;
};

const RecenterButton: React.FC<{ coordinate: [number, number] }> = ({
  coordinate,
}) => {
  const map = useMap();

  const handleRecenter = () => {
    map.flyTo(coordinate, 17, { animate: true, duration: 1.5 });
  };

  return (
    <button
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        handleRecenter();
      }}
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

export const MiniMap: React.FC<MiniMapProp> = ({ coordinate }) => {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        height: "100%",
        width: "100%",
        overflow: "hidden",
        borderRadius: "10px",
      }}
    >
      <MapContainer
        center={coordinate}
        zoom={17}
        zoomControl={false}
        style={{
          height: "100%",
          width: "100%",
          aspectRatio: "2/1",
        }}
        attributionControl={false}
      >
        <ZoomControl position="bottomright" />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
        />

        <Marker position={coordinate} icon={getIcon()} />

        {/* ✅ These two components run inside MapContainer context */}
        <RecenterMap coordinate={coordinate} />
        <RecenterButton coordinate={coordinate} />
      </MapContainer>
    </div>
  );
};

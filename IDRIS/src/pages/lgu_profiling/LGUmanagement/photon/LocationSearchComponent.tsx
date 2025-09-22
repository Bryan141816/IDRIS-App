import React, { useState } from "react";
import axios from "axios"; // Using axios for API calls
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"; // React-Leaflet for map integration

// Define types for the location and response structure
interface Location {
  lat: number;
  lon: number;
  address: string;
}

const LocationSearchComponent: React.FC = () => {
  const [location, setLocation] = useState<Location | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Function to handle the search and fetch location data from Photon API
  const handleSearch = async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      // Directly querying the Photon API
      const response = await axios.get("https://photon.komoot.io/api/", {
        params: { q: searchTerm, limit: 1 }, // Parameters for the Photon API query
      });

      // Check if there are results and process the response
      if (!response.data.features || response.data.features.length === 0) {
        throw new Error("Location not found.");
      }

      const locationData = response.data.features[0]; // First match
      const lat = locationData.geometry.coordinates[1];
      const lon = locationData.geometry.coordinates[0];
      const address = locationData.properties.label;

      // Set the location data in state
      setLocation({ lat, lon, address });
    } catch (error: any) {
      // Handle any errors (e.g., no results or failed API request)
      setError(error.response ? error.response.data.detail : error.message);
    }
    setLoading(false);
  };

  // Map component to focus on the search result
  const MapWithPin: React.FC<{ location: Location }> = ({ location }) => {
    const map = useMap(); // To control the map behavior directly

    // When location changes, center the map and add a pin
    if (location) {
      map.flyTo([location.lat, location.lon], 13); // Center the map on the new location
    }

    return location ? (
      <Marker position={[location.lat, location.lon]}>
        <Popup>{location.address}</Popup>
      </Marker>
    ) : null;
  };

  return (
    <div>
      <h2>Search Location</h2>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Enter location"
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? "Loading..." : "Search"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {location && (
        <div>
          <h3>Location Found:</h3>
          <p>Address: {location.address}</p>
          <p>Latitude: {location.lat}</p>
          <p>Longitude: {location.lon}</p>
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={[13.0, 122.0]} // Default center if no location is found
        zoom={6}
        style={{ height: "400px", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {location && <MapWithPin location={location} />}
      </MapContainer>
    </div>
  );
};

export default LocationSearchComponent;

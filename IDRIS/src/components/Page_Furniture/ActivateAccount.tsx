import { useState, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import styles from "./styles/ActivateAccount.module.scss";
import DefaultProfile from "../../media/defaultProfile.webp";
import { API } from "../../API_Handler/Axio_API_Handler";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Photon API types
interface PhotonProperties {
  name?: string;
  country?: string;
  state?: string;
  county?: string;
  city?: string;
  osm_value?: string;
}

interface PhotonFeature {
  properties?: PhotonProperties;
  geometry?: {
    coordinates?: [number, number];
  };
}

interface PhotonResp {
  features?: PhotonFeature[];
}

// Cebu coordinates
const CEBU_LAT = 10.3157;
const CEBU_LON = 123.8854;

// ✅ Nominatim reverse geocoding function
// ✅ FIXED: Use Photon reverse geocoding instead of Nominatim (no CORS issues!)
async function fetchAddress(lat: number, lng: number): Promise<string> {
  console.log("🔄 Starting reverse geocoding for:", lat, lng);

  try {
    // Use Photon reverse geocoding (no CORS issues!)
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`;
    console.log("📡 Calling Photon reverse:", url);

    const response = await fetch(url);

    console.log("📊 Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("📮 Photon reverse response:", data);

    // Photon returns features array
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const props = feature.properties || {};

      // Build formatted address from properties
      const addressParts = [];

      // Add street info
      if (props.name) addressParts.push(props.name);
      if (props.street) addressParts.push(props.street);
      if (props.housenumber) addressParts.push(props.housenumber);

      // Add locality info
      if (props.city) addressParts.push(props.city);
      else if (props.county) addressParts.push(props.county);

      // Add region
      if (props.state) addressParts.push(props.state);

      // Add country
      if (props.country) addressParts.push(props.country);

      // Add postcode if available
      if (props.postcode) addressParts.push(props.postcode);

      const formattedAddress = addressParts.join(", ");
      console.log("📍 Formatted address:", formattedAddress);

      return formattedAddress || props.name || "";
    } else {
      console.warn("⚠️ No features in reverse geocoding response");
      return "";
    }
  } catch (error) {
    console.error("❌ Reverse geocoding failed:", error);
    return "";
  }
}


// Helper functions for Photon (moved outside component)
const formatDisplayName = (p: PhotonProperties): string => {
  const parts = [];
  if (p.name) parts.push(p.name);
  if (p.city) parts.push(p.city);
  if (p.county) parts.push(p.county);
  if (p.state) parts.push(p.state);
  return parts.join(", ");
};

const classifyFromPhoton = (osmValue?: string): string => {
  if (!osmValue) return "";
  const lower = osmValue.toLowerCase();
  if (lower.includes("city")) return "City";
  if (lower.includes("municipality")) return "Municipality";
  if (lower.includes("barangay")) return "Barangay";
  return "";
};

// AutocompleteAddress component moved OUTSIDE Activate component
const AutocompleteAddress: React.FC<{
  value: string;
  onPick: (payload: {
    name: string;
    lat: number;
    lng: number;
    classificationGuess: string;
  }) => void;
  onChange: (name: string) => void;
}> = ({ value, onPick, onChange }) => {
  const [q, setQ] = useState(value);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<PhotonFeature[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => setQ(value), [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const doSearch = async (term: string) => {
    if (!term || term.trim().length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }

    console.log("Searching for:", term);
    setLoading(true);
    setOpen(true);

    try {
      const url = new URL("https://photon.komoot.io/api/");
      url.searchParams.set("q", term);
      url.searchParams.set("limit", "8");
      url.searchParams.set("lang", "en");
      url.searchParams.set("lat", String(CEBU_LAT));
      url.searchParams.set("lon", String(CEBU_LON));

      console.log("Fetching:", url.toString());
      const resp = await fetch(url.toString());
      const data: PhotonResp = await resp.json();

      console.log("API Response:", data);

      const filtered = (data.features || []).filter((f) => {
        const p = f.properties || {};
        const isPH = (p.country || "").toLowerCase().includes("philippines");
        const isCebu =
          (p.state || "").toLowerCase().includes("cebu") ||
          (p.county || "").toLowerCase().includes("cebu") ||
          (p.city || "").toLowerCase().includes("cebu");
        return isPH && isCebu;
      });

      console.log("Filtered results:", filtered.length);
      setItems(filtered);
      setActiveIndex(0);
    } catch (error) {
      console.error("Search error:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const onInputChange = (v: string) => {
    setQ(v);
    onChange(v);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => doSearch(v), 250) as any;
  };

  const commitPick = (f: PhotonFeature) => {
    const p = f.properties || {};
    const coords = f.geometry?.coordinates || [0, 0];
    const lng = coords[0] || 0;
    const lat = coords[1] || 0;
    const classificationGuess = classifyFromPhoton(p.osm_value) || "";
    const name = p.name || formatDisplayName(p) || "";
    onPick({ name, lat, lng, classificationGuess });
    setQ(name);
    setOpen(false);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[activeIndex]) {
        commitPick(items[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder="Type your address…"
        value={q}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={() => {
          if (items.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          fontSize: "14px",
          boxSizing: "border-box",
        }}
      />
      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 9999,
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {loading && (
            <div
              style={{
                padding: 12,
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              🔍 Searching in Cebu…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div
              style={{
                padding: 12,
                fontSize: 14,
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              No results found in Cebu, Philippines
            </div>
          )}
          {!loading &&
            items.map((f, idx) => {
              const p = f.properties || {};
              const label = formatDisplayName(p);
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => commitPick(f)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: "10px 12px",
                    background: isActive ? "#f3f4f6" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      marginBottom: 2,
                    }}
                  >
                    {p.name || label}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {label}
                    {p.osm_value ? ` • ${p.osm_value}` : ""}
                  </div>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
};

const Activate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const [profileInfo, setProfileInfo] = useState({
    fname: "",
    lname: "",
    address: "",
    latitude: 0,
    longitude: 0,
    birthday: "",
    gender: "",
    contactInfo: "",
    bio: "",
  });
  const [profileImage, setProfileImage] = useState<string>(DefaultProfile);
  const [croppedFile, setCroppedFile] = useState<File | null>(null);

  const [openCrop, setOpenCrop] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [minZoom, setMinZoom] = useState(1);

  const [isSuccess, setIsSuccess] = useState(false);
  const [fetchingAddress, setFetchingAddress] = useState(false); // ✅ Loading state

  const handleInfoChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProfileInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageSrc(URL.createObjectURL(file));
      setOpenCrop(true);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<File | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scale = Math.min(500 / pixelCrop.width, 500 / pixelCrop.height, 1);
    canvas.width = pixelCrop.width * scale;
    canvas.height = pixelCrop.height * scale;

    ctx?.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    if (ctx) {
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        2 * Math.PI
      );
      ctx.closePath();
      ctx.fill();
    }

    return new Promise<File | null>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "profile.webp", { type: "image/webp" });
          resolve(file);
        } else resolve(null);
      }, "image/webp");
    });
  };

  const handleCropSave = async () => {
    if (imageSrc && croppedAreaPixels) {
      const file = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (file) {
        setCroppedFile(file);
        setProfileImage(URL.createObjectURL(file));
        setOpenCrop(false);
      }
    }
  };

  const submitProfile = async () => {
    if (!token) return console.error("No token found in URL");

    Swal.fire({
      title: "Submitting...",
      didOpen: () => {
        Swal.showLoading();
      },
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    const formData = new FormData();

    if (croppedFile) {
      formData.append("profile_file", croppedFile);
    }

    formData.append("profile_info", JSON.stringify(profileInfo));
    formData.append("token", token);

    try {
      const response = await API.post("/activate_account", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Response:", response.data);

      Swal.close();
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "An error occurred while submitting your profile.",
      });
    }
  };

  useEffect(() => {
    if (isSuccess) {
      Swal.fire({
        icon: "success",
        title: "Account Activated!",
        text: "Your profile has been saved successfully.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        navigate("/login");
      });
    }
  }, [isSuccess, navigate]);

  return (
    <div className={styles.activateFormContainer}>
      <div className={styles.profileForm}>
        {!isSuccess ? (
          <>
            <h2>Verify Email and Set Profile</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitProfile();
              }}
            >
              <div className={styles.profileImage}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ pointerEvents: openCrop ? "none" : "auto" }}
                />
                <span className={styles.selectProfile}>Select Profile</span>
                <img src={profileImage} alt="Profile Preview" />
              </div>

              {openCrop && (
                <div className={styles.modalOverlay}>
                  <div className={styles.modalContent}>
                    <div
                      style={{ position: "relative", width: 300, height: 300 }}
                    >
                      <Cropper
                        image={imageSrc!}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        cropSize={{ width: 300, height: 300 }}
                        minZoom={minZoom}
                        maxZoom={5}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_, area) => setCroppedAreaPixels(area)}
                        onMediaLoaded={({ width, height }) => {
                          const requiredZoom = Math.max(300 / width, 300 / height);
                          setMinZoom(requiredZoom);
                          setZoom(requiredZoom);
                        }}
                      />
                    </div>
                    <div className={styles.modalActions}>
                      <button type="button" onClick={() => setOpenCrop(false)}>
                        Cancel
                      </button>
                      <button type="button" onClick={handleCropSave}>
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.columnContainer}>
                <div className={styles.inputContainers}>
                  <label>First Name:</label>
                  <input
                    name="fname"
                    value={profileInfo.fname}
                    onChange={handleInfoChange}
                    required
                  />
                </div>
                <div className={styles.inputContainers}>
                  <label>Last Name:</label>
                  <input
                    name="lname"
                    value={profileInfo.lname}
                    onChange={handleInfoChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.columnContainer}>
                <div className={styles.inputContainers}>
                  <label>Address:</label>
                  <AutocompleteAddress
                    value={profileInfo.address}
                    onChange={(name) =>
                      setProfileInfo((prev) => ({ ...prev, address: name }))
                    }
                    onPick={async ({ name, lat, lng, classificationGuess }) => {
                      console.log("✅ Selected from dropdown:", name);
                      console.log("📍 Coordinates:", lat, lng);

                      // ✅ Fetch formal address from Nominatim
                      setFetchingAddress(true);
                      const formalAddress = await fetchAddress(lat, lng);
                      setFetchingAddress(false);

                      console.log("📮 Formal address:", formalAddress);

                      setProfileInfo((prev) => ({
                        ...prev,
                        address: formalAddress || name, // Use formal address or fallback to name
                        latitude: lat,
                        longitude: lng,
                      }));
                    }}
                  />

                </div>
              </div>

              <div className={styles.columnContainer}>
                <div className={styles.inputContainers}>
                  <label>Birthdate:</label>
                  <input
                    type="date"
                    name="birthday"
                    value={profileInfo.birthday}
                    onChange={handleInfoChange}
                    required
                  />
                </div>
                <div className={styles.inputContainers}>
                  <label>Gender:</label>
                  <select
                    name="gender"
                    value={profileInfo.gender}
                    onChange={handleInfoChange}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className={styles.columnContainer}>
                <div className={styles.inputContainers}>
                  <label>Contact No.:</label>
                  <input
                    name="contactInfo"
                    value={profileInfo.contactInfo}
                    onChange={handleInfoChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.columnContainer}>
                <div className={styles.inputContainers}>
                  <label>Bio:</label>
                  <textarea
                    name="bio"
                    value={profileInfo.bio}
                    onChange={handleInfoChange}
                  ></textarea>
                </div>
              </div>

              <button type="submit">Submit</button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Activate;

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
    street?: string;
    housenumber?: string;
    postcode?: string;
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

// Photon reverse geocoding function
async function fetchAddress(lat: number, lng: number): Promise<string> {
    console.log("🔄 Starting reverse geocoding for:", lat, lng);

    try {
        const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=en`;
        console.log("📡 Calling Photon reverse:", url);

        const response = await fetch(url);
        console.log("📊 Response status:", response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("📮 Photon reverse response:", data);

        if (data.features && data.features.length > 0) {
            const feature = data.features[0];
            const props = feature.properties || {};

            const addressParts = [];
            if (props.name) addressParts.push(props.name);
            if (props.street) addressParts.push(props.street);
            if (props.housenumber) addressParts.push(props.housenumber);
            if (props.city) addressParts.push(props.city);
            else if (props.county) addressParts.push(props.county);
            if (props.state) addressParts.push(props.state);
            if (props.country) addressParts.push(props.country);
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

// Helper functions
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

// AutocompleteAddress component
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

        setLoading(true);
        setOpen(true);

        try {
            const url = new URL("https://photon.komoot.io/api/");
            url.searchParams.set("q", term);
            url.searchParams.set("limit", "8");
            url.searchParams.set("lang", "en");
            url.searchParams.set("lat", String(CEBU_LAT));
            url.searchParams.set("lon", String(CEBU_LON));

            const resp = await fetch(url.toString());
            const data: PhotonResp = await resp.json();

            const filtered = (data.features || []).filter((f) => {
                const p = f.properties || {};
                const isPH = (p.country || "").toLowerCase().includes("philippines");
                const isCebu =
                    (p.state || "").toLowerCase().includes("cebu") ||
                    (p.county || "").toLowerCase().includes("cebu") ||
                    (p.city || "").toLowerCase().includes("cebu");
                return isPH && isCebu;
            });

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

const AdminActivate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    const [profileInfo, setProfileInfo] = useState({
        firstName: "",
        lastName: "",
        employeeIdNumber: "",
        department: "",
        position: "",
        contactNumber: "",
        lguLocation: "",
        latitude: 0,
        longitude: 0,
    });

    const [idFile, setIdFile] = useState<File | null>(null);
    const [idPreview, setIdPreview] = useState<string>("");
    const [fetchingAddress, setFetchingAddress] = useState(false);
    const [userRole, setUserRole] = useState<string>("");
    const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

    const idFileInputRef = useRef<HTMLInputElement>(null);

    const isLguOfficer = userRole.toLowerCase().includes("lgu officer");

    const handleInfoChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setProfileInfo((prev) => ({ ...prev, [name]: value }));
    };

    const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIdFile(file);
            setIdPreview(URL.createObjectURL(file));
        }
    };

    // ✅ FIXED: Input validations - checking idFile state variable, not profileInfo.idFile
    const validateForm = () => {
        const { firstName, lastName, employeeIdNumber, contactNumber, lguLocation } = profileInfo;

        // ✅ Check idFile state variable instead of profileInfo.idFile
        if (!firstName || !lastName || !employeeIdNumber || !contactNumber || !idFile) {
            Swal.fire({
                icon: "error",
                title: "Form Error",
                text: "Please fill in all required fields and upload your ID.",
            });
            return false;
        }

        // ✅ Improved phone validation - accepts 10 or 11 digits
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phoneRegex.test(contactNumber)) {
            Swal.fire({
                icon: "error",
                title: "Invalid Contact Number",
                text: "Please enter a valid 10 or 11-digit phone number.",
            });
            return false;
        }

        if (isLguOfficer && !lguLocation) {
            Swal.fire({
                icon: "error",
                title: "LGU Location Required",
                text: "Please select your LGU location.",
            });
            return false;
        }

        return true;
    };

    const submitProfile = async () => {
        if (!token) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No activation token found",
            });
            return;
        }

        // Validate the form before submitting
        if (!validateForm()) return;

        Swal.fire({
            title: "Submitting Profile...",
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false,
        });

        const formData = new FormData();
        if (idFile) formData.append("profile_file", idFile);
        formData.append("profile_info", JSON.stringify(profileInfo));
        formData.append("token", token);

        try {
            await API.post("/admin/complete_profile", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            Swal.close();
            Swal.fire({
                icon: "success",
                title: "Profile Submitted!",
                html: `
                    <p>Your admin profile has been submitted successfully.</p>
                    <p>A superadmin will review and approve your account.</p>
                    <p>You will receive an email notification once approved.</p>
                `,
                confirmButtonText: "Okay",
            }).then(() => {
                navigate("/login");
            });
        } catch (err: any) {
            Swal.fire({
                icon: "error",
                title: "Submission Failed",
                text: err.response?.data?.detail || "An error occurred.",
            });
        }
    };

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (!token) {
                Swal.fire({
                    icon: "error",
                    title: "Invalid Link",
                    text: "No activation token found",
                });
                navigate("/login");
                return;
            }

            try {
                const formData = new FormData();
                formData.append("token", token);

                const response = await API.post("/get_user_from_token", formData);
                const userData = response.data;

                setProfileInfo((prev) => ({
                    ...prev,
                    department: userData.department,
                    lguLocation: userData.roles[0].toLowerCase().includes("lgu officer") ? "" : "N/A",
                }));

                setUserRole(userData.roles[0] || "");
                setIsLoadingUserInfo(false);
            } catch (error: any) {
                console.error("Failed to fetch user info:", error);
                Swal.fire({
                    icon: "error",
                    title: "Invalid Token",
                    text: error.response?.data?.detail || "Failed to load user information",
                });
                navigate("/login");
            }
        };

        fetchUserInfo();
    }, [token, navigate]);

    if (isLoadingUserInfo) {
        return (
            <div className={styles.activateFormContainer}>
                <div className={styles.profileForm}>
                    <div style={{ textAlign: "center", padding: "2rem" }}>
                        <p>Loading profile information...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.activateFormContainer}>
            <div className={styles.profileForm}>
                <h2>Complete Your Admin Profile</h2>
                <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "1rem" }}>
                    Please fill in your admin details below. Your account will be reviewed by a superadmin.
                </p>
                <form onSubmit={(e) => { e.preventDefault(); submitProfile(); }}>
                    <div className={styles.columnContainer}>
                        <div className={styles.inputContainers}>
                            <label htmlFor="firstName">First Name:</label>
                            <input
                                id="firstName"
                                name="firstName"
                                value={profileInfo.firstName}
                                onChange={handleInfoChange}
                                required
                            />
                        </div>
                        <div className={styles.inputContainers}>
                            <label htmlFor="lastName">Last Name:</label>
                            <input
                                id="lastName"
                                name="lastName"
                                value={profileInfo.lastName}
                                onChange={handleInfoChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.columnContainer}>
                        <div className={styles.inputContainers}>
                            <label htmlFor="employeeIdNumber">Employee ID Number:</label>
                            <input
                                id="employeeIdNumber"
                                name="employeeIdNumber"
                                value={profileInfo.employeeIdNumber}
                                onChange={handleInfoChange}
                                required
                            />
                        </div>
                    </div>

                    {isLguOfficer && (
                        <div className={styles.columnContainer}>
                            <div className={styles.inputContainers}>
                                <label>LGU (Local Government Unit):</label>
                                <AutocompleteAddress
                                    value={profileInfo.lguLocation}
                                    onChange={(name) =>
                                        setProfileInfo((prev) => ({ ...prev, lguLocation: name }))
                                    }
                                    onPick={async ({ name, lat, lng }) => {
                                        setFetchingAddress(true);
                                        try {
                                            const formalAddress = await fetchAddress(lat, lng);
                                            setProfileInfo((prev) => ({
                                                ...prev,
                                                lguLocation: formalAddress || name,
                                                latitude: lat,
                                                longitude: lng,
                                            }));
                                        } catch (error) {
                                            setProfileInfo((prev) => ({
                                                ...prev,
                                                lguLocation: name,
                                                latitude: lat,
                                                longitude: lng,
                                            }));
                                        } finally {
                                            setFetchingAddress(false);
                                        }
                                    }}
                                />
                                {fetchingAddress && (
                                    <small style={{ color: "#3b82f6", fontSize: "12px", marginTop: "4px", display: "block" }}>
                                        🔄 Fetching LGU details...
                                    </small>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={styles.columnContainer}>
                        <div className={styles.inputContainers}>
                            <label htmlFor="department">Department:</label>
                            <input
                                id="department"
                                name="department"
                                value={profileInfo.department}
                                readOnly
                                style={{
                                    backgroundColor: "#f3f4f6",
                                    cursor: "not-allowed",
                                    color: "#374151"
                                }}
                                title="Department is automatically assigned based on your role"
                            />
                        </div>
                        <div className={styles.inputContainers}>
                            <label htmlFor="position">Position:</label>
                            <input
                                id="position"
                                name="position"
                                value={profileInfo.position}
                                onChange={handleInfoChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.columnContainer}>
                        <div className={styles.inputContainers}>
                            <label htmlFor="contactNumber">Contact Number:</label>
                            <input
                                id="contactNumber"
                                name="contactNumber"
                                value={profileInfo.contactNumber}
                                onChange={handleInfoChange}
                                placeholder="e.g., 09123456789"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.columnContainer}>
                        <div className={styles.inputContainers}>
                            <label>Upload Government ID: <span style={{ color: "red" }}>*</span></label>
                            <input
                                ref={idFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleIdFileChange}
                                style={{ display: "none" }}
                                id="idFileInput"
                            />
                            <button
                                type="button"
                                onClick={() => idFileInputRef.current?.click()}
                                className={styles.uploadButton}
                            >
                                {idFile ? "Change Government ID" : "Upload Government ID"}
                            </button>
                            {idPreview && (
                                <div style={{ marginTop: "10px", marginLeft: "100px" }}>
                                    <img
                                        src={idPreview}
                                        alt="ID Preview"
                                        style={{
                                            width: "100%",
                                            maxWidth: "300px",
                                            border: "1px solid #d1d5db",
                                            borderRadius: "6px",
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <button type="submit" style={{ marginTop: "1rem" }}>
                        Submit Profile for Review
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminActivate;

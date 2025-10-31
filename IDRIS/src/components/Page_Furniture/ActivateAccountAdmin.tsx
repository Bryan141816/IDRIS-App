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

type LguList = {
    lgu_id: number;
    lgu_name: string;
};

// AutocompleteAddress component omitted (unchanged) for brevity...

const AdminActivate = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    const [lguList, setLguList] = useState<LguList[]>([]);
    const [profileInfo, setProfileInfo] = useState({
        firstName: "",
        lastName: "",
        employeeIdNumber: "",
        department: "",
        position: "",
        contactNumber: "",
        lgu_id: 0 as number | null,
        latitude: 0,
        longitude: 0,
    });

    // NEW: Error state
    const [errors, setErrors] = useState({
        firstName: "",
        lastName: "",
        employeeIdNumber: "",
        contactNumber: "",
        lgu_id: "",
        idFile: "",
        position: "",
    });

    const [idFile, setIdFile] = useState<File | null>(null);
    const [idPreview, setIdPreview] = useState<string>("");
    const [fetchingAddress, setFetchingAddress] = useState(false);
    const [userRole, setUserRole] = useState<string>("");
    const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);

    const idFileInputRef = useRef<HTMLInputElement>(null);

    const isLguOfficer = userRole.toLowerCase().includes("lgu officer");
    console.log("🔍 userRole:", userRole);
    console.log("🔍 isLguOfficer:", isLguOfficer);
    console.log("🔍 lguList:", lguList);
    console.log("🔍 lguList length:", lguList.length);
    const handleInfoChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        if (name === "contactNumber") {
            const filtered = value.replace(/\D+/g, "");
            setProfileInfo((prev) => ({ ...prev, [name]: filtered }));
        } else if (name === "lgu_id") {
            // If select, make sure lgu_id is a number
            setProfileInfo((prev) => ({ ...prev, lgu_id: Number(value) }));
        } else {
            setProfileInfo((prev) => ({ ...prev, [name]: value }));
        }
        // Clear error on change
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIdFile(file);
            setIdPreview(URL.createObjectURL(file));
            setErrors((prev) => ({ ...prev, idFile: "" }));
        }
    };

    // Error validation function
    const validateForm = () => {
        const newErrors: typeof errors = {
            firstName: "",
            lastName: "",
            employeeIdNumber: "",
            contactNumber: "",
            lgu_id: "",
            idFile: "",
            position: "",
        };

        let isValid = true;

        if (!profileInfo.firstName) {
            newErrors.firstName = "First name is required.";
            isValid = false;
        }
        if (!profileInfo.lastName) {
            newErrors.lastName = "Last name is required.";
            isValid = false;
        }
        if (!profileInfo.employeeIdNumber) {
            newErrors.employeeIdNumber = "Employee ID is required.";
            isValid = false;
        }
        if (!profileInfo.position) {
            newErrors.position = "Position is required.";
            isValid = false;
        }
        if (!profileInfo.contactNumber) {
            newErrors.contactNumber = "Contact number is required.";
            isValid = false;
        } else if (!/^[0-9]{10,11}$/.test(profileInfo.contactNumber)) {
            newErrors.contactNumber = "Contact number must be 10 or 11 digits.";
            isValid = false;
        }
        if (!idFile) {
            newErrors.idFile = "Government ID upload is required.";
            isValid = false;
        }
        if (isLguOfficer && !profileInfo.lgu_id) {
            newErrors.lgu_id = "LGU location is required for LGU officer role.";
            isValid = false;
        }

        setErrors(newErrors);

        if (!isValid) {
            Swal.fire({
                icon: "error",
                title: "Form Error",
                text: "Please correct the errors in the fields highlighted below.",
            });
        }

        return isValid;
    };
    useEffect(() => {
    const fetchLguList = async () => {
        try {
            console.log("📡 Fetching LGU list...");
            const response = await API.get("/activate/get_lgu_list");
            console.log("✅ LGU list response:", response.data);
            setLguList(response.data);
        } catch (e: any) {
            console.error("❌ Error fetching lgu list:", e.message);

            // TEMPORARY: Add mock data for testing
            console.warn("⚠️ Using mock LGU data for testing");
            setLguList([
                { lgu_id: 1, lgu_name: "Test LGU 1" },
                { lgu_id: 2, lgu_name: "Test LGU 2" },
            ]);
        }
    };
    fetchLguList();
}, []);


    const submitProfile = async () => {
        if (!token) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No activation token found",
            });
            return;
        }

        if (!validateForm()) return;

        Swal.fire({
            title: "Submitting Profile...",
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false,
        });

        // Create a copy of the profileInfo
        const payload = { ...profileInfo };

        // Set lgu_id to null if not selected (0 or "")
        if (!payload.lgu_id || payload.lgu_id === 0) {
            payload.lgu_id = null;
        }

        const formData = new FormData();
        if (idFile) formData.append("profile_file", idFile);
        formData.append("profile_info", JSON.stringify(payload));
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
                    lguLocation: userData.roles[0].toLowerCase().includes("lgu officer")
                        ? ""
                        : "N/A",
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
                <p
                    style={{
                        textAlign: "center",
                        color: "#6b7280",
                        marginBottom: "1rem",
                    }}
                >
                    Please fill in your admin details below. Your account will be reviewed by a superadmin.
                </p>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        submitProfile();
                    }}
                >
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
                            {errors.firstName && (
                                <div className={styles.fieldError}>{errors.firstName}</div>
                            )}
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
                            {errors.lastName && (
                                <div className={styles.fieldError}>{errors.lastName}</div>
                            )}
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
                            {errors.employeeIdNumber && (
                                <div className={styles.fieldError}>{errors.employeeIdNumber}</div>
                            )}
                        </div>
                    </div>

                    {isLguOfficer && (
                        <div className={styles.columnContainer}>
                            <div className={styles.inputContainers}>
                                <label htmlFor="employeeIdNumber">
                                    LGU (Local Government Unit):
                                </label>
                                <select
                                    id="lguID"
                                    name="lgu_id"
                                    value={profileInfo.lgu_id ?? ""
                                    }
                                    onChange={handleInfoChange}
                                    required
                                >
                                    {lguList.length === 0 ? (
                                        <option disabled>Fetching Data...</option>
                                    ) : (
                                        <>
                                            <option value="" disabled>
                                                Select LGU
                                            </option>
                                            {lguList.map((item) => (
                                                <option key={item.lgu_id} value={item.lgu_id}>
                                                    {item.lgu_name}
                                                </option>
                                            ))}
                                        </>
                                    )}
                                </select>
                                {errors.lgu_id && (
                                    <div className={styles.fieldError}>{errors.lgu_id}</div>
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
                                    color: "#374151",
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
                            {errors.position && (
                                <div className={styles.fieldError}>{errors.position}</div>
                            )}
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
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                            {errors.contactNumber && (
                                <div className={styles.fieldError}>{errors.contactNumber}</div>
                            )}
                        </div>
                    </div>

                    <div className={styles.columnContainer}>
                        <div className={styles.inputContainers}>
                            <label>
                                Upload Government ID: <span style={{ color: "red" }}>*</span>
                            </label>
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
                            {errors.idFile && (
                                <div className={styles.fieldError}>{errors.idFile}</div>
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

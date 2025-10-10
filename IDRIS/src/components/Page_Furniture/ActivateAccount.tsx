import { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import styles from "./styles/ActivateAccount.module.scss";
import DefaultProfile from "../../media/defaultProfile.webp";
import { API } from "../../API_Handler/Axio_API_Handler";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2"; // Import Swal

const Activate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const [profileInfo, setProfileInfo] = useState({
    fname: "",
    lname: "",
    address: "",
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

  const handleInfoChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
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
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
  ): Promise<File | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Limit resolution to max 500x500
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
      canvas.height,
    );

    if (ctx) {
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        2 * Math.PI,
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

    const formData = new FormData();

    // Only append if the user uploaded an image
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

      // ✅ Success state
      setIsSuccess(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Show Swal alert when activation succeeds
  useEffect(() => {
    if (isSuccess) {
      Swal.fire({
        icon: "success",
        title: "Account Activated!",
        text: "Your profile has been saved successfully.",
        confirmButtonText: "Proceed to Login",
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
                          const requiredZoom = Math.max(
                            300 / width,
                            300 / height,
                          );
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

              {/* Profile form fields */}
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
                  <input
                    name="address"
                    value={profileInfo.address}
                    onChange={handleInfoChange}
                    required
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

              <button type="submit" onClick={submitProfile}>Submit</button>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Activate;

// HazardModals.tsx
import { BaseModalProps } from "../ModalProps";
import { useEffect, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEllipsisVertical,
  faTrash,
  faPen,
  faUpRightFromSquare,
  faImage,
} from "@fortawesome/free-solid-svg-icons";

/* =========================================================
   Types
========================================================= */
type AddProps = BaseModalProps & {
  handleAddRecord: (payload: any) => Promise<any>;
};

type ViewProps = BaseModalProps & {
  selectedData: any;
  handleDeleteRecord: (id: string) => void;
  openEditModal: () => void;
};

type EditProps = BaseModalProps & {
  selectedData: any;
  handleEditRecord: (id: string, payload: any) => void | Promise<void>;
};

/* =========================================================
   Upload Helper (matches FastAPI: POST /api/files/hazards)
========================================================= */
const UPLOAD_URL = "http://localhost:8000/api/files/hazards";

async function uploadHazardImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);

  const res = await fetch(UPLOAD_URL, { method: "POST", body: fd });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${txt || res.statusText}`);
  }
  const data = await res.json().catch(() => ({}));
  if (!data?.url) throw new Error("Upload succeeded but no URL returned by server.");
  return data.url as string;
}

/* =========================================================
   ADD Hazard
========================================================= */
export const AddHazardModal: React.FC<AddProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddRecord,
}) => {
  const [form, setForm] = useState({
    hazard_area: "",
    hazard_type: "",
    image_url: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "image_file" && files && files[0]) {
      const f = files[0];
      if (f.size > 5 * 1024 * 1024) {
        setMessageBox((p: any) => ({
          ...p,
          isOpen: true,
          type: "alert",
          message: "Image too large. Please upload a file up to 5MB.",
        }));
        return;
      }
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  if (!isModalOpen) return null;

  const actuallySubmit = async () => {
    try {
      setIsSubmitting(true);
      let finalImageUrl = form.image_url?.trim() || "";

      if (file) {
        try {
          finalImageUrl = await uploadHazardImage(file);
        } catch (err: any) {
          const proceed = confirm(
            `Image upload failed.\n\n${err?.message || err}\n\nDo you want to save the record without the image?`
          );
          if (!proceed) {
            setIsSubmitting(false);
            return;
          }
          finalImageUrl = "";
        }
      }

      await handleAddRecord({
        hazard_area: form.hazard_area,
        hazard_type: form.hazard_type,
        image_url: finalImageUrl || null,
      });

      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "alert",
        message: "Hazard added successfully.",
      }));

      setForm({ hazard_area: "", hazard_type: "", image_url: "" });
      setFile(null);
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview("");
      }
      closeModal();
    } catch (err: any) {
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "alert",
        message: `Failed to add hazard: ${err?.message || err}`,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = () => {
    setMessageBox((prev: any) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: "Are you sure you want to add this hazard?",
      onSubmit: actuallySubmit,
    }));
  };

  return (
    <Modal isOpen={isModalOpen} onClose={isSubmitting ? () => {} : closeModal} zIndex={998}>
      <div className="modal-container" aria-busy={isSubmitting}>
        <div className="horizontal-container">
          <span className="details-title">Add Hazard</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Area:</span>
          <input
            type="text"
            name="hazard_area"
            value={form.hazard_area}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Type:</span>
          <input
            type="text"
            name="hazard_type"
            value={form.hazard_type}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Image (optional):</span>
          <input
            type="file"
            name="image_file"
            accept="image/*"
            onChange={onChange}
            style={{ width: "100%" }}
            disabled={isSubmitting}
          />
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "40vh",
            borderRadius: "10px",
            overflow: "hidden",
            marginTop: "10px",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <div style={{ color: "#888" }}>
              <FontAwesomeIcon icon={faImage} /> No image selected
            </div>
          )}
        </div>

        <div className="action-button">
          <button
            style={{ backgroundColor: "#749AB6", opacity: isSubmitting ? 0.6 : 1 , color: "#ffff" }}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Add"}
          </button>
          <button
            style={{ backgroundColor: "#F84B4D", color: "#ffff"  }}
            onClick={closeModal}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================================================
   VIEW Hazard
========================================================= */
export const ViewHazardModal: React.FC<ViewProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  selectedData,
  handleDeleteRecord,
  openEditModal,
}) => {
  const [isMore, setIsMore] = useState(false);

  useEffect(() => {
    if (!isModalOpen) setIsMore(false);
  }, [isModalOpen]);

  // Corrected order: [id, lastUpdated, hazard_area, image_url, hazard_type]
  const id = selectedData?.data?.[0]?.text ?? "";
  const lastUpdated = selectedData?.data?.[1]?.text ?? "-";
  const hazardArea = selectedData?.data?.[2]?.text ?? "-";
  const imageUrl = selectedData?.data?.[3]?.text ?? "";
  const hazardType = selectedData?.data?.[4]?.text ?? "-";

  if (!isModalOpen) return null;

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container" style={{ paddingTop: "30px" }}>
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">View Hazard</span>
          <div className="horizontal-container" style={{ width: "auto", gap: "5px" }}>
            <div className="more-options-container">
              <button onClick={() => setIsMore((v) => !v)}>
                <FontAwesomeIcon icon={faEllipsisVertical} style={{ height: "20px" }} />
              </button>
              {isMore && (
                <div className="more-options-viewer">
                  <button onClick={openEditModal}>
                    <FontAwesomeIcon icon={faPen} /> Edit Record
                  </button>
                  <button
                    style={{ color: "red" }}
                    onClick={() =>
                      setMessageBox((prev: any) => ({
                        ...prev,
                        isOpen: true,
                        type: "confirm",
                        message: "Are you sure you want to delete this record?",
                        onSubmit: () => handleDeleteRecord(id),
                      }))
                    }
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete Record
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="horizontal-container">
          <span className="details-title">Details</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Last Updated:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{lastUpdated}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Area:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{hazardArea}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Type:</span>
          <span style={{ width: "100%", textAlign: "center" }}>{hazardType}</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Image:</span>
          <div style={{ width: "100%", textAlign: "center" }}>
            {imageUrl ? (
              <a href={imageUrl} target="_blank" rel="noreferrer" title="Open image">
                <FontAwesomeIcon icon={faUpRightFromSquare} /> Open
              </a>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "40vh",
            borderRadius: "10px",
            overflow: "hidden",
            marginTop: "10px",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="hazard"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
            />
          ) : (
            <div style={{ color: "#888" }}>
              <FontAwesomeIcon icon={faImage} /> No image
            </div>
          )}
        </div>

        <div className="action-button">
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* =========================================================
   EDIT Hazard
========================================================= */
export const EditHazardModal: React.FC<EditProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  const id = selectedData?.data?.[0]?.text ?? "";

  const [form, setForm] = useState({
    hazard_area: "",
    hazard_type: "",
    image_url: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedData) return;
    // Corrected mapping
    const area = selectedData?.data?.[2]?.text ?? "";
    const img = selectedData?.data?.[3]?.text ?? "";
    const type = selectedData?.data?.[4]?.text ?? "";
    setForm({ hazard_area: area, hazard_type: type, image_url: img });
    setPreview(img || "");
  }, [selectedData]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "image_file" && files && files[0]) {
      const f = files[0];
      if (f.size > 5 * 1024 * 1024) {
        setMessageBox((p: any) => ({
          ...p,
          isOpen: true,
          type: "alert",
          message: "Image too large. Please upload a file up to 5MB.",
        }));
        return;
      }
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview((old) => {
        if (old && old.startsWith("blob:")) URL.revokeObjectURL(old);
        return url;
      });
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  if (!isModalOpen) return null;

  const actuallySubmit = async () => {
    try {
      setIsSubmitting(true);

      let finalImageUrl = form.image_url?.trim() || "";
      if (file) {
        try {
          finalImageUrl = await uploadHazardImage(file);
        } catch (err: any) {
          const proceed = confirm(
            `Image upload failed.\n\n${err?.message || err}\n\nDo you want to save the changes without updating the image?`
          );
          if (!proceed) {
            setIsSubmitting(false);
            return;
          }
          finalImageUrl = form.image_url || "";
        }
      }

      await handleEditRecord(id, {
        hazard_area: form.hazard_area,
        hazard_type: form.hazard_type,
        image_url: finalImageUrl || null,
      });

      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "alert",
        message: "Hazard updated successfully.",
      }));

      closeModal();
    } catch (err: any) {
      setMessageBox((p: any) => ({
        ...p,
        isOpen: true,
        type: "alert",
        message: `Failed to update hazard: ${err?.message || err}`,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = () => {
    setMessageBox((prev: any) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: "Are you sure you want to update this hazard?",
      onSubmit: actuallySubmit,
    }));
  };

  return (
    <Modal isOpen={isModalOpen} onClose={isSubmitting ? () => {} : closeModal} zIndex={998}>
      <div className="modal-container" aria-busy={isSubmitting}>
        <div className="horizontal-container">
          <span className="details-title">Update Hazard</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Area:</span>
          <input
            type="text"
            name="hazard_area"
            value={form.hazard_area}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Type:</span>
          <input
            type="text"
            name="hazard_type"
            value={form.hazard_type}
            onChange={onChange}
            disabled={isSubmitting}
          />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Image (optional):</span>
          <input
            type="file"
            name="image_file"
            accept="image/*"
            onChange={onChange}
            style={{ width: "100%" }}
            disabled={isSubmitting}
          />
        </div>

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "40vh",
            borderRadius: "10px",
            overflow: "hidden",
            marginTop: "10px",
            alignItems: "center",
            justifyContent: "center",
            background: "#f5f5f5",
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <div style={{ color: "#888" }}>
              <FontAwesomeIcon icon={faImage} /> No image
            </div>
          )}
        </div>

        <div className="action-button">
          <button
            style={{ backgroundColor: "#749AB6", opacity: isSubmitting ? 0.6 : 1 }}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
          <button
            style={{ backgroundColor: "#F84B4D" }}
            onClick={closeModal}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

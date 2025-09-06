import { BaseModalProps } from "../ModalProps";
import { useEffect, useState } from "react";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical, faTrash, faPen, faUpRightFromSquare, faImage } from "@fortawesome/free-solid-svg-icons";
import { uploadHazardImage } from "../../LGUmanagement"; // path where you added it

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

/* ========================= Add Hazard ========================= */
export const AddHazardModal: React.FC<AddProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddRecord,
}) => {
  const [form, setForm] = useState({
    hazard_area: "",
    hazard_type: "",
    image_url: "", // will be filled after upload
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "image_file" && files && files[0]) {
      setFile(files[0]);
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  if (!isModalOpen) return null;

  const onSubmit = async () => {
    setMessageBox((prev: any) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: "Are you sure you want to add this hazard?",
      onSubmit: async () => {
        let image_url = form.image_url;
        if (file) {
          image_url = await uploadHazardImage(file);
        }
        await handleAddRecord({
          hazard_area: form.hazard_area,
          hazard_type: form.hazard_type,
          image_url,
        });
      },
    }));
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container">
        <div className="horizontal-container">
          <span className="details-title">Add Hazard</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Area:</span>
          <input type="text" name="hazard_area" value={form.hazard_area} onChange={onChange} />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Type:</span>
          <input type="text" name="hazard_type" value={form.hazard_type} onChange={onChange} />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Image:</span>
          <input
            type="file"
            name="image_file"
            accept="image/*"
            onChange={onChange}
            style={{ width: "100%" }}
          />
        </div>

        {/* preview */}
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
            <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          ) : (
            <div style={{ color: "#888" }}>
              <FontAwesomeIcon icon={faImage} /> No image selected
            </div>
          )}
        </div>

        <div className="action-button">
          <button style={{ backgroundColor: "#749AB6" }} onClick={onSubmit}>Add</button>
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

/* ========================= View Hazard (unchanged except no notes) ========================= */
export const ViewHazardModal: React.FC<ViewProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  selectedData,
  handleDeleteRecord,
  openEditModal,
}) => {
  const [isMore, setIsMore] = useState(false);

  useEffect(() => { if (!isModalOpen) setIsMore(false); }, [isModalOpen]);

  const id          = selectedData?.data?.[0]?.text ?? "";
  const lastUpdated = selectedData?.data?.[1]?.text ?? "-";
  const hazardArea  = selectedData?.data?.[2]?.text ?? "-";
  const imageUrl    = selectedData?.data?.[3]?.text ?? "";
  const hazardType  = selectedData?.data?.[4]?.text ?? "-";

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
                  <button onClick={openEditModal}><FontAwesomeIcon icon={faPen} /> Edit Record</button>
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

        <div className="horizontal-container"><span className="details-title">Details</span></div>

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
            ) : (<span>-</span>)}
          </div>
        </div>

        <div style={{
          display: "flex", width: "100%", height: "40vh", borderRadius: "10px",
          overflow: "hidden", marginTop: "10px", alignItems: "center",
          justifyContent: "center", background: "#f5f5f5",
        }}>
          {imageUrl ? (
            <img src={imageUrl} alt="hazard" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                 onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
          ) : (
            <div style={{ color: "#888" }}>
              <FontAwesomeIcon icon={faImage} /> No image
            </div>
          )}
        </div>

        <div className="action-button">
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>Close</button>
        </div>
      </div>
    </Modal>
  );
};

/* ========================= Edit Hazard ========================= */
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
    image_url: "", // keep existing URL until replaced
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    if (!selectedData) return;
    const area = selectedData?.data?.[2]?.text ?? "";
    const img  = selectedData?.data?.[3]?.text ?? "";
    const type = selectedData?.data?.[4]?.text ?? "";
    setForm({ hazard_area: area, hazard_type: type, image_url: img });
    setPreview(img || "");
  }, [selectedData]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target as HTMLInputElement;
    if (name === "image_file" && files && files[0]) {
      setFile(files[0]);
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  if (!isModalOpen) return null;

  const onSubmit = async () => {
    setMessageBox((prev: any) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message: "Are you sure you want to update this hazard?",
      onSubmit: async () => {
        let image_url = form.image_url;
        if (file) {
          image_url = await uploadHazardImage(file);
        }
        await handleEditRecord(id, {
          hazard_area: form.hazard_area,
          hazard_type: form.hazard_type,
          image_url,
        });
      },
    }));
  };

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container">
        <div className="horizontal-container">
          <span className="details-title">Update Hazard</span>
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Area:</span>
          <input type="text" name="hazard_area" value={form.hazard_area} onChange={onChange} />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Hazard Type:</span>
          <input type="text" name="hazard_type" value={form.hazard_type} onChange={onChange} />
        </div>

        <div className="horizontal-container">
          <span className="item-details-identifier">Image:</span>
          <input
            type="file"
            name="image_file"
            accept="image/*"
            onChange={onChange}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{
          display: "flex", width: "100%", height: "40vh", borderRadius: "10px",
          overflow: "hidden", marginTop: "10px", alignItems: "center",
          justifyContent: "center", background: "#f5f5f5",
        }}>
          {preview ? (
            <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
          ) : (
            <div style={{ color: "#888" }}>
              <FontAwesomeIcon icon={faImage} /> No image
            </div>
          )}
        </div>

        <div className="action-button">
          <button style={{ backgroundColor: "#749AB6" }} onClick={onSubmit}>Save</button>
          <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

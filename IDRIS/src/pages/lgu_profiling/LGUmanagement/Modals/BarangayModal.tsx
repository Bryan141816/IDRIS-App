import { BaseModalProps } from "../ModalProps";
import { useState, useEffect, useRef } from "react";
import LocationPickerModal from "../../../../components/Page_Furniture/LocationPickerModal";
import { Modal } from "../../../../components/Page_Furniture/Modals";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMapMarkerAlt,
  faEllipsisVertical,
  faTrash,
  faPen,
} from "@fortawesome/free-solid-svg-icons";
import { MapWithPin } from "../ModalProps";
import { API } from "../../../../API_Handler/Axio_API_Handler";

type FuzzySeachElementProps = {
  value: string | null;                     // controlled by parent
  setLGUID: (id: string, name: string) => void;
  name: string;                             // parent field name
  searchURL: string;
};

const FuzzySeachElement: React.FC<FuzzySeachElementProps> = ({
  value,
  name,
  searchURL,
}) => {
  type LGURecord = {
    id: number | string;
    name: string;
    lat?: number;
    lng?: number;
    contact_info?: string;
  };

  const [results, setResults] = useState<LGURecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click / esc / tab
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.key === "Escape") setIsSearching(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function searchLGU(
    q: string,
    sim_threshold: number = 0.2,
  ): Promise<LGURecord[] | false> {
    try {
      const response = await API.get(
        `${searchURL}?q=${encodeURIComponent(q)}&sim_threshold=${sim_threshold}`
      );
      const data = response.data;
      return Array.isArray(data) ? data : (data ? [data] : []);
    } catch (error) {
      console.error("Search failed:", error);
      return false;
    }
  }

  // When parent clears value (e.g., Detach), close dropdown & clear results
  useEffect(() => {
    if (!value || value.trim() === "") {
      setIsSearching(false);
      setResults([]);
    }
  }, [value]);

  // On input change: update parent directly; debounce the search for dropdown
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setLGUID(q, name); // single source of truth in parent

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const trimmed = q.trim();
      if (!trimmed) {
        setResults([]);
        setIsSearching(false);
        return;
      }
      const res = await searchLGU(trimmed);
      setResults(Array.isArray(res) ? res : []);
      setIsSearching(true);
    }, 500);
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        display: "flex",
        width: "100%",
        flexDirection: "row",
        gap: "5px",
        position: "relative",
      }}
    >
      <input
        value={value ?? ""}                     // controlled by parent
        onChange={handleChange}                 // notify parent directly
        onFocus={() => {
          if ((value ?? "").length > 0 && results.length > 0) setIsSearching(true);
        }}
        placeholder="Type to search…"
      />

      {isSearching && (
        <div
          style={{
            display: "flex",
            border: "1px solid black",
            justifyContent: "start",
            alignItems: "start",
            width: "100%",
            height: "fit-content",
            maxHeight: "200px",
            position: "absolute",
            top: "100%",
            left: 0,
            borderRadius: "5px",
            backgroundColor: "white",
            overflowY: "auto",
            zIndex: 10000,
          }}
        >
          {results.length > 0 ? (
            <div style={{ width: "100%" }}>
              {results.map((val, i) => (
                <button
                  key={`${val.id ?? val.name}-${i}`}
                  style={{
                    padding: "5px",
                    width: "100%",
                    textAlign: "start",
                    background: "white",
                    border: "none",
                    borderBottom: "1px solid #eee",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    // choose -> set in parent, close dropdown
                    setLGUID(String(val.name), name);
                    setIsSearching(false);
                  }}
                >
                  {val.name}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ padding: "8px" }}>No results found…</div>
          )}
        </div>
      )}
    </div>
  );
};

type addLGUModalProps = BaseModalProps & {
  handleAddRecord: (payload: any) => void;
};
type viewEvecuationModalProp = BaseModalProps & {
  selectedData: any;
  handleDeleteRecord: (id: string) => void;
  openEditModal: () => void;
};
type editEvacuationModalProp = BaseModalProps & {
  selectedData: any;
  handleEditRecord: (id: string, payload: any) => void;
};
export const AddBarangayModal: React.FC<addLGUModalProps> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleAddRecord,
}) => {
  type evacuationProp = {
    name: string;
    lat: number;
    lng: number;
    LGU: string;
    evacuation: string;
    population: number;
    contact_info: string;
    risk_level: string;
  };
  const [addEvacuationForm, setAddEvacuationForm] = useState<evacuationProp>({
    name: "",
    lat: 0,
    lng: 0,
    LGU: "",
    evacuation: "",
    population: 0,
    contact_info: "",
    risk_level: "",
  });
  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);
  const handleLocationPickerSubmit = (mapData: {
    lat: number;
    lng: number;
  }) => {
    setAddEvacuationForm((prev) => ({
      ...prev,
      lat: mapData.lat,
      lng: mapData.lng,
    }));
  };
  const handleAddModalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleSearchChange = (id: string, name: string) => {
    console.log(id);
    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: id.toString(),
    }));
  };
  return (
    <>
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={closeLocationPicker}
          onSubmit={handleLocationPickerSubmit}
          lat={addEvacuationForm.lat}
          lng={addEvacuationForm.lng}
        />
      )}
      <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Add Evacuation</span>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <input
              type="text"
              name="name"
              value={addEvacuationForm.name}
              onChange={handleAddModalChange}
            />
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "row",
                gap: "5px",
              }}
            >
              <input
                type="text"
                readOnly
                placeholder="Select a location"
                value={
                  addEvacuationForm.lat
                    ? `${addEvacuationForm.lat} , ${addEvacuationForm.lng}`
                    : ""
                }
              />
              <button
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #ddd",
                  outline: "none",
                  color: "#3b82f6",
                  width: "35px",
                  borderRadius: "5px",
                }}
                onClick={openLocationPicker}
              >
                {" "}
                <FontAwesomeIcon
                  icon={faMapMarkerAlt}
                  style={{ height: "20px" }}
                />
              </button>
            </div>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">LGU:</span>
            <FuzzySeachElement
              value={addEvacuationForm.LGU}
              name="LGU"
              setLGUID={handleSearchChange}
              searchURL="/lgu_profiling/manage_lgu/search_lgu"
            ></FuzzySeachElement>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Evacuation Center:</span>
            <FuzzySeachElement
              value={addEvacuationForm.evacuation}
              name="evacuation"
              setLGUID={handleSearchChange}
              searchURL="/lgu_profiling/manage_lgu/search_evacuation"
            ></FuzzySeachElement>
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Population:</span>
            <input
              type="number"
              name="population"
              value={addEvacuationForm.population}
              onChange={handleAddModalChange}
            />
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Contact Info:</span>
            <input
              type="number"
              name="contact_info"
              value={addEvacuationForm.contact_info}
              onChange={handleAddModalChange}
            />
          </div>
          <div className="horizontal-container">
            <span className="item-details-identifier">Risk Level:</span>
            <select
              id="risk_level"
              name="risk_level"
              required
              value={addEvacuationForm.risk_level}
              onChange={handleAddModalChange}
            >
              <option value="" selected disabled>
                Select LGU Level
              </option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="High">Long</option>
            </select>
          </div>
          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6" }}
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev, // preserves onClose and anything else
                  isOpen: true, // your new values
                  type: "confirm",
                  message: "Are you sure you want to add this record?",
                  onSubmit: () => {
                    handleAddRecord(addEvacuationForm);
                  },
                }));
              }}
            >
              Add
            </button>
            <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export const ViewBarangayModal: React.FC<viewEvecuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  selectedData,
  handleDeleteRecord,
  openEditModal,
}) => {
  const [isMoreOptionVisible, setIsMoreOptionVisible] = useState(false);
  const toggleMoreOptionVisible = () => {
    setIsMoreOptionVisible(!isMoreOptionVisible);
  };
  useEffect(() => {
    if (!isModalOpen) {
      setIsMoreOptionVisible(false);
    }
  }, [isModalOpen]);

  return (
    <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
      <div className="modal-container" style={{ paddingTop: "30px" }}>
        <div className="horizontal-container space-between-container">
          <span className="title-modal-text">View Details</span>
          <div
            className="horizontal-container"
            style={{ width: "auto", gap: "5px" }}
          >
            <div className="more-options-container">
              <button onClick={toggleMoreOptionVisible}>
                <FontAwesomeIcon
                  icon={faEllipsisVertical}
                  style={{ height: "20px" }}
                />
              </button>
              {isMoreOptionVisible && (
                <div className="more-options-viewer">
                  <button onClick={openEditModal}>
                    <FontAwesomeIcon icon={faPen} />
                    Edit Record
                  </button>
                  <button
                    style={{ color: "red" }}
                    onClick={() => {
                      setMessageBox((prev) => ({
                        ...prev, // preserves onClose and anything else
                        isOpen: true, // your new values
                        type: "confirm",
                        message: "Are you sure you want to delete this record?",
                        onSubmit: () => {
                          handleDeleteRecord(selectedData.data[0].text);
                        },
                      }));
                    }}
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
          <span className="item-details-identifier">Name:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[1].text}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">
            Location: (Latitude, Longitude)
          </span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[2].text}, {selectedData.data[3].text}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "50vh",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <MapWithPin
            lat={parseFloat(selectedData.data[2].text)}
            lng={parseFloat(selectedData.data[3].text)}
          ></MapWithPin>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">LGU:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[4].text}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Evacuation Center:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[5].text}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Population:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[6].text}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Contact Info:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[7].text}
          </span>
        </div>
        <div className="horizontal-container">
          <span className="item-details-identifier">Risk Level:</span>
          <span style={{ width: "100%", textAlign: "center" }}>
            {selectedData.data[8].text}
          </span>
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
export const EditBarangayModal: React.FC<editEvacuationModalProp> = ({
  isModalOpen,
  closeModal,
  setMessageBox,
  handleEditRecord,
  selectedData,
}) => {
  type EvacuationProp = {
    name: string;
    lat: number;
    lng: number;
    LGU: string | null;
    evacuation: string | null; // "" (empty) will mean DETACH
    population: number;
    contact_info: string;
    risk_level: string;
  };

  const [addEvacuationForm, setAddEvacuationForm] = useState<EvacuationProp>({
    name: selectedData.data[1].text,
    lat: parseFloat(selectedData.data[2].text),
    lng: parseFloat(selectedData.data[3].text),
    LGU: selectedData.data[4].text,
    evacuation: selectedData.data[5].text,
    population: parseInt(selectedData.data[6].text),
    contact_info: selectedData.data[7].text,
    risk_level: selectedData.data[8].text,
  });

  const [locationPickerIsOpen, setLocationPickerIsOpen] = useState(false);

  const openLocationPicker = () => setLocationPickerIsOpen(true);
  const closeLocationPicker = () => setLocationPickerIsOpen(false);

  const handleLocationPickerSubmit = (mapData: { lat: number; lng: number }) => {
    setAddEvacuationForm((prev) => ({
      ...prev,
      lat: mapData.lat,
      lng: mapData.lng,
    }));
  };

  const handleAddModalChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const nextVal =
      type === "number" && value !== "" ? Number(value) : (value as any);

    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: nextVal,
    }));
  };

  const handleSearchChange = (id: string, name: string) => {
    setAddEvacuationForm((prevData) => ({
      ...prevData,
      [name]: id.toString(),
    }));
  };

  const confirmDetachEvacuation = () => {
    const current = (addEvacuationForm.evacuation || "").trim();

    // If already empty, just inform the user.
    if (current === "") {
      setMessageBox((prev) => ({
        ...prev,
        isOpen: true,
        type: "message",
        message: "No evacuation center is currently set.",
      }));
      return;
    }

    // Ask for confirmation before detaching
    setMessageBox((prev) => ({
      ...prev,
      isOpen: true,
      type: "confirm",
      message:
        `Are you sure you want to detach the evacuation center ` +
        (current ? `“${current}” ` : "") +
        `from “${addEvacuationForm.name}”?`,
      onSubmit: () => {
        // User confirmed -> clear the field (backend will interpret "" as DETACH)
        setAddEvacuationForm((p) => ({ ...p, evacuation: "" }));
      },
    }));
  };

  return (
    <>
      {locationPickerIsOpen && (
        <LocationPickerModal
          isOpenProp={locationPickerIsOpen}
          onCloseProp={closeLocationPicker}
          onSubmit={handleLocationPickerSubmit}
          lat={addEvacuationForm.lat}
          lng={addEvacuationForm.lng}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} zIndex={998}>
        <div className="modal-container">
          <div className="horizontal-container">
            <span className="details-title">Edit Barangay</span>
          </div>

          {/* Name */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Name:</span>
            <input
              type="text"
              name="name"
              value={addEvacuationForm.name}
              onChange={handleAddModalChange}
            />
          </div>

          {/* Location */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Location:</span>
            <div
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "row",
                gap: "5px",
              }}
            >
              <input
                type="text"
                readOnly
                placeholder="Select a location"
                value={
                  addEvacuationForm.lat
                    ? `${addEvacuationForm.lat} , ${addEvacuationForm.lng}`
                    : ""
                }
              />
              <button
                style={{
                  backgroundColor: "transparent",
                  border: "1px solid #ddd",
                  outline: "none",
                  color: "#3b82f6",
                  width: "35px",
                  borderRadius: "5px",
                }}
                onClick={openLocationPicker}
              >
                <FontAwesomeIcon icon={faMapMarkerAlt} style={{ height: "20px" }} />
              </button>
            </div>
          </div>

          {/* LGU */}
          <div className="horizontal-container">
            <span className="item-details-identifier">LGU:</span>
            <FuzzySeachElement
              value={addEvacuationForm.LGU ?? ""}
              name="LGU"
              setLGUID={handleSearchChange}
              searchURL="/lgu_profiling/manage_lgu/search_lgu"
            />
          </div>

          {/* Evacuation Center + Detach (with confirm) */}
          <div className="horizontal-container" style={{ alignItems: "center" }}>
            <span className="item-details-identifier">Evacuation Center:</span>
            <div style={{ display: "flex", width: "100%", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <FuzzySeachElement
                  value={addEvacuationForm.evacuation ?? ""}
                  name="evacuation"
                  setLGUID={handleSearchChange}
                  searchURL="/lgu_profiling/manage_lgu/search_evacuation"
                />
              </div>
              <button
                type="button"
                title="Detach evacuation center"
                style={{
                  padding: "6px 10px",
                  backgroundColor: "#f87171",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  height: "32px",
                  alignSelf: "center",
                }}
                onClick={confirmDetachEvacuation}
              >
                Detach
              </button>
            </div>
          </div>

          {/* Population */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Population:</span>
            <input
              type="number"
              name="population"
              value={addEvacuationForm.population}
              onChange={handleAddModalChange}
              min={0}
            />
          </div>

          {/* Contact Info */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Contact Info:</span>
            <input
              type="text"
              name="contact_info"
              value={addEvacuationForm.contact_info}
              onChange={handleAddModalChange}
            />
          </div>

          {/* Risk Level */}
          <div className="horizontal-container">
            <span className="item-details-identifier">Risk Level:</span>
            <select
              id="risk_level"
              name="risk_level"
              required
              value={addEvacuationForm.risk_level}
              onChange={handleAddModalChange}
            >
              <option value="" disabled>
                Select Risk Level
              </option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Actions */}
          <div className="action-button">
            <button
              style={{ backgroundColor: "#749AB6" }}
              onClick={() => {
                setMessageBox((prev) => ({
                  ...prev,
                  isOpen: true,
                  type: "confirm",
                  message: "Are you sure you want to update this record?",
                  onSubmit: () => {
                    handleEditRecord(selectedData.data[0].text, addEvacuationForm);
                  },
                }));
              }}
            >
              Confirm
            </button>
            <button style={{ backgroundColor: "#F84B4D" }} onClick={closeModal}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

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
  value: string | null;
  setLGUID: (id: string, name: string) => void;
  name: string;
  searchURL: string;
};

const FuzzySeachElement: React.FC<FuzzySeachElementProps> = ({
  value,
  setLGUID,
  name,
  searchURL,
}) => {
  type LGURecord = {
    id: number | string;
    name: string;
    lat?: number;
    lng?: number;
    contact_info?: string;
    // ...more fields if you have them
  };
  const [inputVal, setInputVal] = useState(value);
  const [results, setResults] = useState<LGURecord[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log(wrapperRef.current);
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsSearching(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab" || event.key === "Escape") {
        setIsSearching(false);
      }
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
  ): Promise<any | false> {
    try {
      const response = await API.get(
        `${searchURL}?q=${q}&sim_threshold=${sim_threshold}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to add record:", error);
      return false;
    }
  }
  function normalizeToArray<T>(data: T | T[] | null | undefined | false): T[] {
    if (!data) return [];
    return Array.isArray(data) ? data : [data];
  }
  useEffect(() => {
    if (inputVal.length <= 0) {
      setIsSearching(false);
    }
    setLGUID(inputVal, name);
  }, [inputVal]);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setInputVal(q);

    // Clear any existing timeout if the user keeps typing
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce: wait 500ms (you can adjust) before running search
    debounceRef.current = setTimeout(async () => {
      if (!q.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);

      const data = await searchLGU(q); // your async call
      setResults(normalizeToArray<LGURecord>(data));
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
        value={inputVal}
        onChange={(e) => {
          handleSearch(e);
        }}
        onFocus={() => {
          if (inputVal.length > 0) {
            setIsSearching(true);
          }
        }}
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
            borderRadius: "5px",
            backgroundColor: "white",
          }}
        >
          {results.length > 0 ? (
            results.map((val, i) => (
              <button
                style={{
                  padding: "5px",
                  width: "100%",
                  zIndex: "10000",
                  textAlign: "start",
                }}
                onClick={() => {
                  setLGUID(String(val.name), name);
                  setInputVal(String(val.name));
                  setIsSearching(false);
                }}
              >
                {val.name}
              </button>
            ))
          ) : (
            <div>No results found...</div>
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
  type evacuationProp = {
    name: string;
    lat: number;
    lng: number;
    LGU: string | null;
    evacuation: string | null;
    population: number;
    contact_info: string;
    risk_level: string;
  };
  console.log(selectedData);
  const [addEvacuationForm, setAddEvacuationForm] = useState<evacuationProp>({
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
                    handleEditRecord(
                      selectedData.data[0].text,
                      addEvacuationForm,
                    );
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

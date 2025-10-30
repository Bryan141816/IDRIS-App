import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { useState } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { ModalOverlay } from "../ProcurementModalsDefault";
import { RequestItem } from "../ProcurementDefaults";
import { RequestItemManager } from "./RequestItemManager";
import { v4 as uuidv4 } from "uuid";
import { SelectBarangayEvacuation } from "./SelectBarangayEvacuation";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
export const SubmitProcurementRequest: React.FC<
  ProcurementDefaultModalProps
> = ({ onClose, refreshData, apiUrl }) => {
  const [selectedDifferent, setSelectedDifferent] = useState("");
  type RequestProcurement = {
    request_type: string;
    use_different_end: boolean;
  };
  type RequestItem = {
    name: string;
    category?: string;
    quantity: number;
    unit?: string;
  };
  const [requestItem, setRequestItem] = useState<RequestItem[]>([]);
  const [itemForm, setItemForm] = useState<RequestItem>({
    name: "",
    category: "",
    quantity: -1,
    unit: "pcs",
  });
  const [formData, setFormData] = useState<RequestProcurement>({
    request_type: "relief",
    use_different_end: false,
  });
  const [isUseBarangayPicker, SetIsUseBarangayPicker] = useState(false);
  const changeRequestType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      request_type: type,
    }));
  };
  const changeDeliveryType = (type: boolean) => {
    setFormData((prev) => ({
      ...prev,
      use_different_end: type,
    }));
  };
  const handleBarangayPicker = (id: number, name: string, type: string) => {};
  return (
    <>
      {isUseBarangayPicker && (
        <SelectBarangayEvacuation
          onClose={() => SetIsUseBarangayPicker(false)}
          refreshData={() => {}}
          setSelectedLocation={handleBarangayPicker}
        ></SelectBarangayEvacuation>
      )}
      <ModalOverlay onClose={onClose} modalType="submit">
        <div className="modal-content">
          <h3>Submit Procurement Request</h3>
          <div className="form-group">
            <label>Request Type</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="secondary-btn"
                style={{
                  width: "50%",
                  backgroundColor:
                    formData.request_type === "relief" ? "#749ab6" : "#ffffff",
                  color:
                    formData.request_type === "relief" ? "#ffffff" : "#749ab6",
                }}
                onClick={() => changeRequestType("relief")}
              >
                Relief
              </button>
              <button
                className="secondary-btn"
                style={{
                  width: "50%",
                  backgroundColor:
                    formData.request_type === "procurement"
                      ? "#749ab6"
                      : "#ffffff",
                  color:
                    formData.request_type === "procurement"
                      ? "#ffffff"
                      : "#749ab6",
                }}
                onClick={() => changeRequestType("procurement")}
              >
                Procurement
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Request Title:</label>
            <input type="text" />
          </div>
          <div className="form-group">
            <label>Request Description:</label>
            <textarea></textarea>
          </div>
          <div className="form-group">
            <label>Disaster Type:</label>
            <select>
              <option value="" disabled>
                Select type
              </option>
              <option value="typhoon">Typhoon/Cyclone</option>
              <option value="flood">Flood</option>
              <option value="earthquake">Earthquake</option>
              <option value="fire">Fire</option>
              <option value="landslide">Landslide</option>
            </select>
          </div>
          <div className="form-group">
            <label>Priority Level:</label>
            <select>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div
            className="form-group"
            style={{ display: "flex", gap: "5px", flexDirection: "column" }}
          >
            <label>Delivery Location:</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="secondary-btn"
                style={{
                  width: "50%",
                  backgroundColor: !formData.use_different_end
                    ? "#749ab6"
                    : "#ffffff",
                  color: !formData.use_different_end ? "#ffffff" : "#749ab6",
                }}
                onClick={() => changeDeliveryType(false)}
              >
                Use this LGU's address
              </button>
              <button
                className="secondary-btn"
                style={{
                  width: "50%",
                  backgroundColor: formData.use_different_end
                    ? "#749ab6"
                    : "#ffffff",
                  color: formData.use_different_end ? "#ffffff" : "#749ab6",
                }}
                onClick={() => {
                  changeDeliveryType(true);
                }}
              >
                Use barangay/evacuation location
              </button>
            </div>
            {formData.use_different_end && (
              <>
                <input
                  type="text"
                  placeholder="No Address have been selected yet"
                />
                <button
                  className="secondary-btn"
                  style={{ width: "100%" }}
                  onClick={() => SetIsUseBarangayPicker(true)}
                >
                  Select Address
                </button>
              </>
            )}
          </div>

          <div className="form-group">
            <label>
              {formData.request_type === "relief"
                ? "Relief Needed"
                : "Items/Services Needed"}
            </label>
            <div>
              <div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gridTemplateRows: "repeat(2, auto)",
                    gap: "10px",
                  }}
                >
                  <label>
                    {formData.request_type === "relief"
                      ? "Item"
                      : "Item/Service"}{" "}
                    Name
                  </label>
                  {formData.request_type === "relief" && (
                    <label>Category</label>
                  )}
                  <label>Quantity</label>
                  {formData.request_type !== "relief" && <label>Unit</label>}
                  <label>Action</label>

                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => {
                      const { value } = e.target;
                      setItemForm((prev) => ({
                        ...prev,
                        name: value,
                      }));
                    }}
                  />

                  {formData.request_type === "relief" && (
                    <select
                      value={itemForm.category}
                      onChange={(e) => {
                        const { value } = e.target;
                        setItemForm((prev) => ({
                          ...prev,
                          category: value,
                        }));
                      }}
                    >
                      <option value="" disabled>
                        Select category
                      </option>
                      <option value="food item">Food Item</option>
                      <option value="hygiene & sanitation">
                        Hygiene & Sanitation
                      </option>
                      <option value="shelter materials">
                        Shelter Materials
                      </option>
                      <option value="medical supplies">Medical Supplies</option>
                      <option value="personal care items">
                        Personal Care Items
                      </option>
                    </select>
                  )}
                  <input
                    type="number"
                    value={itemForm.quantity === -1 ? "" : itemForm.quantity}
                    onChange={(e) => {
                      const { value } = e.target;
                      const val = value.trim() === "" ? -1 : Number(value);
                      setItemForm((prev) => ({
                        ...prev,
                        quantity: val,
                      }));
                    }}
                  />
                  {formData.request_type !== "relief" && (
                    <select
                      value={itemForm.unit}
                      onChange={(e) => {
                        const { value } = e.target;
                        setItemForm((prev) => ({
                          ...prev,
                          unit: value,
                        }));
                      }}
                    >
                      <option value="pcs">pcs</option>
                      <option value="set">set</option>
                      <option value="units">units</option>
                      <option value="boxes">boxes</option>
                      <option value="packs">packs</option>
                    </select>
                  )}

                  <button
                    className="secondary-btn"
                    onClick={() => {
                      // (optional) basic validation
                      if (!itemForm.name || itemForm.quantity < 0) return;

                      setRequestItem((prev) => [
                        ...prev,
                        {
                          name: itemForm.name,
                          category:
                            formData.request_type === "relief"
                              ? itemForm.category
                              : undefined,
                          quantity: itemForm.quantity,
                          unit:
                            formData.request_type !== "relief"
                              ? itemForm.unit
                              : undefined,
                        },
                      ]);

                      // reset the input form
                      setItemForm({
                        name: "",
                        category: "",
                        quantity: -1,
                        unit: "pcs",
                      });
                    }}
                  >
                    Add +
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    border: "2px solid #c5d7e5",
                    minHeight: "50px",
                    maxHeight: "150px",
                    marginTop: "5px",
                    borderRadius: "0.5rem",
                    overflowY: "auto",
                    padding: "5px",
                    gap: "5px",
                  }}
                >
                  {requestItem.map((item, index) => (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4,1fr)",
                        gap: "10px",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      key={index}
                    >
                      <span>{item.name}</span>

                      {formData.request_type === "relief" && (
                        <span>{item.category}</span>
                      )}

                      <span>{item.quantity}</span>

                      {formData.request_type !== "relief" && (
                        <span>{item.unit}</span>
                      )}
                      <div
                        style={{
                          display: "flex",
                          width: "100%",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <button
                          className="action-btn"
                          onClick={() => {
                            setRequestItem((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                          }}
                          style={{
                            border: "1px solid red",
                            background: "red",
                            width: "fit-content",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faTrashCan}
                            style={{ color: "white" }}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Date Needed:</label>
            <input type="date" />
          </div>
        </div>
      </ModalOverlay>
    </>
  );
};

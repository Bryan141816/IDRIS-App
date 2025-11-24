import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import React, { useState, ChangeEvent } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { ModalOverlay } from "../ProcurementModalsDefault";
import { SelectBarangayEvacuation } from "./SelectBarangayEvacuation";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import "../../../procurement_request.scss";
export const SubmitProcurementRequest: React.FC<
  ProcurementDefaultModalProps
> = ({ onClose, refreshData, apiUrl }) => {
  const [selectedDifferent, setSelectedDifferent] = useState("");
  type RequestProcurement = {
    request_type: string;
    use_different_end: boolean;
    request_title: string;
    request_description: string;
    disaster_type: string;
    priority: string;
    date_needed: string;
    end_barangay: number;
    end_evacuation: number;
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
    request_title: "",
    request_description: "",
    disaster_type: "",
    priority: "low",
    date_needed: "",
    end_barangay: -1,
    end_evacuation: -1,
  });
  const [isUseBarangayPicker, SetIsUseBarangayPicker] = useState(false);
  const changeRequestType = (
    e: React.MouseEvent<HTMLButtonElement>,
    type: string,
  ) => {
    e.preventDefault();
    setFormData((prev) => ({
      ...prev,
      request_type: type,
    }));
  };
  const changeDeliveryType = (
    e: React.MouseEvent<HTMLButtonElement>,
    type: boolean,
  ) => {
    e.preventDefault();
    if (type) {
      setFormData((prev) => ({
        ...prev,
        use_different_end: type,
        end_evacuation: -1,
        end_barangay: -1,
      }));
      setSelectedDifferent("");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      use_different_end: type,
    }));
  };
  const handleBarangayPicker = (id: number, name: string, type: string) => {
    setSelectedDifferent(name);
    if (type === "barangay") {
      setFormData((prev) => ({
        ...prev,
        end_barangay: id,
        end_evacuation: -1,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        end_barangay: -1,
        end_evacuation: id,
      }));
    }
  };
  const checkValidation = () => {
    if (
      formData.request_title.trim() !== "" &&
      formData.request_description.trim() !== "" &&
      formData.disaster_type.trim() !== "" &&
      formData.date_needed.trim() !== "" &&
      requestItem.length > 0
    ) {
      return true;
    }
    return false;
  };
  const handleSubmit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      const form = e.currentTarget.closest("form") as HTMLFormElement;
      if (!form.checkValidity()) {
        form.reportValidity(); // shows native browser validation
        return;
      } else {
        e.preventDefault();
      }
    }
    const payload = { ...formData, request_items: requestItem };
    const submit = async () => {
      try {
        const response = await API.post(
          "/request_procurement/add_request",
          payload,
        );
        Swal.fire({
          title: "Add Request",
          text: "Your request has been added successfully",
          icon: "success",
        });
        refreshData();
        onClose();
      } catch (e: any) {
        console.error("Error adding procurement request: " + e.message);
      }
    };
    submit();
  };
  return (
    <>
      {isUseBarangayPicker && (
        <SelectBarangayEvacuation
          onClose={() => SetIsUseBarangayPicker(false)}
          refreshData={() => {}}
          setSelectedLocation={handleBarangayPicker}
        ></SelectBarangayEvacuation>
      )}
      <ModalOverlay
        onClose={onClose}
        modalType="submit"
        onSubmit={handleSubmit}
      >
        <div className="modal-content">
          <h3>Submit Procurement Request</h3>
          <div className="form-group">
            <label>Request Type</label>
            <div className="request-selector">
              <button
                className="secondary-btn"
                style={{
                  width: "50%",
                  backgroundColor:
                    formData.request_type === "relief" ? "#749ab6" : "#ffffff",
                  color:
                    formData.request_type === "relief" ? "#ffffff" : "#749ab6",
                }}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                  changeRequestType(e, "relief")
                }
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
                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                  changeRequestType(e, "procurement")
                }
              >
                Procurement
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Request Title:</label>
            <input
              type="text"
              required
              value={formData.request_title}
              onChange={(e) => {
                const { value } = e.target;
                setFormData((prev) => ({
                  ...prev,
                  request_title: value,
                }));
              }}
            />
          </div>
          <div className="form-group">
            <label>Request Description:</label>
            <textarea
              required
              value={formData.request_description}
              onChange={(e) => {
                const { value } = e.target;
                setFormData((prev) => ({
                  ...prev,
                  request_description: value,
                }));
              }}
            ></textarea>
          </div>
          <div className="form-group">
            <label>Disaster Type:</label>
            <select
              value={formData.disaster_type}
              required
              onChange={(e) => {
                const { value } = e.target;
                setFormData((prev) => ({
                  ...prev,
                  disaster_type: value,
                }));
              }}
            >
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
            <select
              required
              value={formData.priority}
              onChange={(e) => {
                const { value } = e.target;
                setFormData((prev) => ({
                  ...prev,
                  priority: value,
                }));
              }}
            >
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
            <div className="request-selector">
              <button
                className="secondary-btn"
                style={{
                  width: "50%",
                  backgroundColor: !formData.use_different_end
                    ? "#749ab6"
                    : "#ffffff",
                  color: !formData.use_different_end ? "#ffffff" : "#749ab6",
                }}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                  changeDeliveryType(e, false)
                }
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
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  changeDeliveryType(e, true);
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
                  value={selectedDifferent}
                  required={formData.use_different_end}
                />
                <button
                  className="secondary-btn"
                  style={{ width: "100%" }}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    SetIsUseBarangayPicker(true);
                  }}
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
                <div className="request-item">
                  <div>
                    <label>
                      {formData.request_type === "relief"
                        ? "Item"
                        : "Item/Service"}{" "}
                      Name
                    </label>

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
                  </div>
                  {formData.request_type === "relief" && (
                    <div>
                      <label>Category</label>
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
                        <option value="medical supplies">
                          Medical Supplies
                        </option>
                        <option value="clothing items">Clothing Items</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label>Quantity</label>
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
                  </div>
                  <div>
                    <label>Unit</label>

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
                  </div>
                  <div>
                    <label>Action</label>
                    <button
                      className="secondary-btn"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.preventDefault();
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
                            unit: itemForm.unit,
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
                    position: "relative",
                  }}
                >
                  {requestItem.length === 0 && (
                    <input
                      type="text"
                      id="name"
                      required={requestItem.length === 0}
                      onInvalid={(e) =>
                        e.currentTarget.setCustomValidity(
                          "Add at least one item!",
                        )
                      }
                      style={{
                        height: "0px",
                        width: "0px",
                        opacity: 0,
                        position: "absolute",
                        left: "50%",
                      }}
                      onInput={(e) => e.currentTarget.setCustomValidity("")}
                    />
                  )}
                  {requestItem.map((item, index) => (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          formData.request_type === "relief"
                            ? "repeat(5,1fr)"
                            : "repeat(4,1fr)",
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

                      <span>{item.unit}</span>
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
            <input
              type="date"
              value={formData.date_needed}
              onChange={(e) => {
                const { value } = e.target;
                setFormData((prev) => ({
                  ...prev,
                  date_needed: value,
                }));
              }}
              required
            />
          </div>
        </div>
      </ModalOverlay>
    </>
  );
};

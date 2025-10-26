import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { useState } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { ModalOverlay } from "../ProcurementModalsDefault";
import { RequestItem } from "../ProcurementDefaults";
import { RequestItemManager } from "./RequestItemManager";
import { v4 as uuidv4 } from "uuid";
export const SubmitProcurementRequest: React.FC<
  ProcurementDefaultModalProps
> = ({ onClose, refreshData, apiUrl }) => {
  type RequestProcurement = {
    request_type: string;
  };
  const [formData, setFormData] = useState<RequestProcurement>({
    request_type: "relief",
  });
  const changeRequestType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      request_type: type,
    }));
  };
  return (
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
                  {formData.request_type === "relief" ? "Item" : "Item/Service"}{" "}
                  Name
                </label>
                {formData.request_type === "relief" && <label>Category</label>}
                <label>Quantity</label>
                {formData.request_type !== "relief" && <label>Unit</label>}
                <label>Action</label>
                <input type="text" />
                {formData.request_type === "relief" && (
                  <select>
                    <option value="" disabled>
                      Select category
                    </option>
                    <option value="food item">Food Item</option>
                    <option value="hygiene & sanitation">
                      Hygiene & Sanitation
                    </option>
                    <option value="shelter materials">Shelter Materials</option>
                    <option value="medical supplies">Medical Supplies</option>
                    <option value="personal care items">
                      Personal Care Items
                    </option>
                  </select>
                )}
                <input type="number" />
                {formData.request_type !== "relief" && (
                  <select>
                    <option value="pcs">pcs</option>
                    <option value="set">set</option>
                    <option value="units">units</option>
                    <option value="boxes">boxes</option>
                    <option value="packs">packs</option>
                  </select>
                )}
                <button className="secondary-btn">Add +</button>
              </div>
              <div
                style={{
                  border: "2px solid #c5d7e5",
                  minHeight: "50px",
                  maxHeight: "150px",
                  marginTop: "5px",
                  borderRadius: "0.5rem",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,1fr)",
                    gridTemplateRows: "repeat(2, auto)",
                    gap: "10px",
                  }}
                ></div>
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
  );
};

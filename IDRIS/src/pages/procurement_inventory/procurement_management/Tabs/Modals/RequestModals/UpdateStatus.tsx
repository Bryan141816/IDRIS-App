import { ModalOverlay } from "../ProcurementModalsDefault";
import React, { useState } from "react";
import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { RequestData } from "../ProcurementDefaults";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
interface UpdateRequestStatusProps extends ProcurementDefaultModalProps {
  selectedItem: RequestData | null;
}

export const UpdateRequestStatus: React.FC<UpdateRequestStatusProps> = ({
  onClose,
  refreshData,
  selectedItem,
  apiUrl,
}) => {
  const statuses = [
    "Pending Approval",
    "Under Review",
    "Approved",
    "In Progress",
    "Completed",
    "On Hold",
    "Cancelled",
  ];
  const [updateValues, setUpdateValues] = useState<{
    request_id: number | null;
    status: string;
    comments: string;
    send_email: boolean;
  }>({
    request_id: selectedItem?.request_id ?? null,
    status: "",
    comments: "",
    send_email: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type, value } = e.target;

    setUpdateValues((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked // ✅ safe cast
          : value,
    }));
  };

  const handleUpdateStatus = async () => {
    console.log("➡️ Sending updateValues:", updateValues);

    try {
      const response = await API.post(`${apiUrl}/update_request`, updateValues);
      console.log("✅ Update success:", response.data);
      refreshData();
      onClose();
    } catch (err: any) {
      console.error("❌ Update failed:", err.response?.data || err.message);
    }
  };
  return (
    <ModalOverlay
      onClose={onClose}
      onSubmit={handleUpdateStatus}
      modalType="update"
    >
      <form className="modal-content">
        <h3>Update Request Status - {selectedItem?.request_id}</h3>

        <div className="form-group">
          <label>Current Status</label>
          <input type="text" value={selectedItem?.status} disabled />
        </div>

        <div className="form-group">
          <label>New Status</label>
          <select
            defaultValue=""
            required
            value={updateValues.status}
            onChange={handleChange}
            name="status"
          >
            <option value="" disabled>
              -- Select New Status --
            </option>
            {statuses.map((status) => (
              <option
                key={status}
                value={status.toLowerCase()}
                disabled={status.toLowerCase() === selectedItem?.status} // disable current
              >
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Status Comments</label>
          <textarea
            placeholder="Add comments about the status change"
            rows={3}
            required
            value={updateValues.comments}
            onChange={handleChange}
            name="comments"
          ></textarea>
        </div>

        <div className="form-group">
          <label>Notify Requester</label>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                defaultChecked
                onChange={handleChange}
                checked={updateValues.send_email}
                name="send_email"
              />
              Send email notificatioN
            </label>
          </div>
        </div>
      </form>
    </ModalOverlay>
  );
};

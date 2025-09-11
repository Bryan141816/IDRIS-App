import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { ModalOverlay } from "../ProcurementModalsDefault";
import { RequestData } from "../ProcurementDefaults";
import React, { useState } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
interface RejectRequestProps extends ProcurementDefaultModalProps {
  selectedItem: RequestData | null;
}

export const RejectRequest: React.FC<RejectRequestProps> = ({
  onClose,
  refreshData,
  selectedItem,
  apiUrl,
}) => {
  const [rejectForm, setRejectForm] = useState<{
    request_id: number | null;
    status: string;
    comments: string;
    send_email: boolean;
    reason_or_code: string;
  }>({
    request_id: selectedItem?.request_id ?? null,
    status: "rejected",
    comments: "",
    send_email: true,
    reason_or_code: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, type, value } = e.target;

    setRejectForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked // ✅ safe cast
          : value,
    }));
  };
  const handleRejectRequest = async () => {
    try {
      const response = await API.post(`${apiUrl}/update_request`, rejectForm);
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
      onSubmit={handleRejectRequest}
      modalType="reject"
    >
      <div className="modal-content">
        <h3>Reject Request - {selectedItem?.request_id}</h3>
        <div className="rejection-summary">
          <div className="detail-row">
            <strong>Title:</strong>
            <span>{selectedItem?.title}</span>
          </div>
          <div className="detail-row">
            <strong>Requested by:</strong>
            <span>{selectedItem?.requester?.username}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Rejection Reason *</label>
          <select
            defaultValue=""
            value={rejectForm.reason_or_code}
            name="reason_or_code"
            onChange={handleChange}
          >
            <option value="">Select rejection reason</option>
            <option value="budget constraints">Budget constraints</option>
            <option value="insuficient justification">
              Insufficient justification
            </option>
            <option value="duplicate request">Duplicate request</option>
            <option value="policy violation">Policy violation</option>
            <option value="alternative solution available">
              Alternative solution available
            </option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="form-group">
          <label>Comments *</label>
          <textarea
            placeholder="Provide detailed rejection reason and recommendations"
            rows={4}
            required
            name="comments"
            value={rejectForm.comments}
            onChange={handleChange}
          ></textarea>
        </div>
      </div>
    </ModalOverlay>
  );
};

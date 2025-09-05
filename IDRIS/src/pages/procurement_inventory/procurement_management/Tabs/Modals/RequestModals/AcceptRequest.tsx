import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { ModalOverlay } from "../ProcurementModalsDefault";
import { ProcurementDefaultModalProps } from "../ProcurementModalsDefault";
import { RequestData } from "../ProcurementDefaults";
import { formatCurrency } from "../ProcurementDefaults";
import { calculateTotal } from "../ProcurementDefaults";
import { useState } from "react";
interface AcceptRequestProps extends ProcurementDefaultModalProps {
  selectedItem: RequestData | null;
}
export const ApproveRequest: React.FC<AcceptRequestProps> = ({
  onClose,
  refreshData,
  selectedItem,
}) => {
  const [approveForm, setApproveForm] = useState<{
    request_id: number | null;
    status: string;
    comments: string;
    send_email: boolean;
    reason_or_code: string;
  }>({
    request_id: selectedItem?.request_id ?? null,
    status: "approved",
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

    setApproveForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked // ✅ safe cast
          : value,
    }));
  };
  const handleApproveRequest = async () => {
    try {
      const response = await API.post(
        "/procurement_management/update_request",
        approveForm,
      );
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
      onSubmit={handleApproveRequest}
      modalType="approve"
    >
      <div className="modal-content">
        <h3>Approve Request - {selectedItem?.request_id}</h3>
        <div className="approval-summary">
          <div className="detail-row">
            <strong>Title:</strong>
            <span>{selectedItem?.title}</span>
          </div>
          <div className="detail-row">
            <strong>Estimated Cost:</strong>
            <span>
              {formatCurrency(calculateTotal(selectedItem?.request_items) || 0)}
            </span>
          </div>
          <div className="detail-row">
            <strong>Priority:</strong>
            <span>{selectedItem?.priority}</span>
          </div>
        </div>
        <div className="form-group">
          <label>Approval Comments</label>
          <textarea
            placeholder="Add approval comments (optional)"
            rows={3}
            name="comments"
            value={approveForm.comments}
            onChange={handleChange}
          ></textarea>
        </div>
        <div className="form-group">
          <label>Budget Code</label>
          <select
            defaultValue=""
            value={approveForm.reason_or_code}
            onChange={handleChange}
            name="reason_or_code"
          >
            <option value="">Select budget allocation</option>
            <option value="emergency response - er2024">
              Emergency Response - ER2024
            </option>
            <option value="medical supplies - ms2024">
              Medical Supplies - MS2024
            </option>
            <option value="equipment - eq2024">Equipment - EQ2024</option>
            <option value="operations - op2024">Operations - OP2024</option>
          </select>
        </div>
      </div>
    </ModalOverlay>
  );
};

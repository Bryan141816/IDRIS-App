import { ModalType } from "./ProcurementDefaults";
import { ReactNode } from "react";
export interface ProcurementDefaultModalProps {
  onClose: () => void;
  refreshData: () => void;
  apiUrl?: string | null;
}

interface ModalProps {
  children: ReactNode;
  modalType: Exclude<ModalType, null>; // ensures no nulls
  onClose: () => void; // or any function signature you need
  onSubmit?: () => void | Promise<void> | null;
  zIndex?: number;
}
export const ModalOverlay: React.FC<ModalProps> = ({
  children,
  modalType,
  onClose,
  onSubmit,
  zIndex = 900,
}) => {
  return (
    <div className="modal-overlay" style={{ zIndex }}>
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            {modalType === "view" ? "Close" : "Cancel"}
          </button>
          {modalType !== "view" && (
            <button className="primary-btn" onClick={onSubmit}>
              {modalType === "approve"
                ? "Approve"
                : modalType === "reject"
                  ? "Reject"
                  : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

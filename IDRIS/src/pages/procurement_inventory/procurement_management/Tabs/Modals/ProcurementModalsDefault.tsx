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
  onReject?: () => void | null;
  onSubmit?: () => void | Promise<void> | null;
  zIndex?: number;
  minWidth?: string;
}
export const ModalOverlay: React.FC<ModalProps> = ({
  children,
  modalType,
  onClose,
  onSubmit,
  onReject,
  zIndex = 900,
  minWidth = "60vw",
}) => {
  return (
    <div className="modal-overlay" style={{ zIndex }}>
      <form className="modal" style={{ minWidth }}>
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
          {modalType === "review" && (
            <button
              className="primary-btn"
              style={{ background: "red", color: "white" }}
              onClick={onReject}
            >
              Reject
            </button>
          )}
          {modalType !== "view" && (
            <button className="primary-btn" onClick={onSubmit}>
              {modalType === "review" ? "Approve" : "Save"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

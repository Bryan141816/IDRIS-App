import React, { ReactNode } from "react";

interface InventoryModalProps {
  onClose: () => void;
  onSubmit?: () => void | null;
  children: ReactNode;
  modalType: string;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  onClose,
  onSubmit,
  children,
  modalType,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            {modalType === "view-item" ? "Close" : "Cancel"}
          </button>
          {modalType !== "view-item" && (
            <button className="primary-btn" onClick={onSubmit}>
              {modalType === "export" ? "Generate Report" : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export interface DefaultInventoryModalProps {
  onClose: () => void;
  refreshData: () => void;
}

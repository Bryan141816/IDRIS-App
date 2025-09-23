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

export interface WarehouseZone {
  warehouse_id: number;
  status: string;
  zone_name: string;
  zone_type: string;
  capacity: number;
  manager: string;
}

export interface InventoryItemsProps {
  inventory_id: number;
  item_name: string;
  quantity: number;
  location: number;
  batch: string;
  expiry: Date | null;
  status: string;
}

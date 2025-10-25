import React, { ReactNode } from "react";

interface InventoryModalProps {
  onClose: () => void;
  onSubmit?: () => void | null;
  children: ReactNode;
  modalType: string;
  zIndex?: number;
  maxWidth?: string;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  onClose,
  onSubmit,
  children,
  modalType,
  zIndex = 900,
  maxWidth = "500px",
}) => {
  return (
    <div className="modal-overlay" style={{ zIndex }}>
      <div className="modal" style={{ maxWidth }}>
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
  address: string;
  lat: number;
  long: number;
  zone_type: string;
  capacity: number;
  manager: string;
  total_occupancy?: number;
}

export interface InventoryItemsProps {
  inventory_id: number;
  item_name: string;
  quantity: number;
  category: string;
  batch: string;
  expiry: string;
  status: string;
}

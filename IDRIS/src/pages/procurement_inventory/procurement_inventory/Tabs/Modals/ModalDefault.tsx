import React, { ReactNode } from "react";
export type ButtonHandler = (
  e?: React.MouseEvent<HTMLButtonElement>,
) => void | Promise<void> | null | undefined;

interface InventoryModalProps {
  onClose: () => void;
  onSubmit?: ButtonHandler;
  children: ReactNode;
  modalType: string;
  zIndex?: number;
  maxWidth?: string | null;
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
      <form
        className="modal"
        style={{ maxWidth: maxWidth ? maxWidth : "500px" }}
        method="POST"
      >
        <div className="modal-header">
          <button
            className="close-btn"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              onClose();
            }}
          >
            ×
          </button>
        </div>
        {children}
        <div className="modal-actions">
          <button
            className="secondary-btn"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              onClose();
            }}
          >
            {modalType === "view-item" ? "Close" : "Cancel"}
          </button>
          {modalType !== "view-item" && (
            <button
              type="submit"
              className="primary-btn"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (onSubmit) {
                  onSubmit(e);
                }
              }}
            >
              {modalType === "export" ? "Generate Report" : "Save"}
            </button>
          )}
        </div>
      </form>
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
  is_assigned?: boolean;
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

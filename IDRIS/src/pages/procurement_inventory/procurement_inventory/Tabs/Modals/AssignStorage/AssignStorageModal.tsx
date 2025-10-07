import { DefaultInventoryModalProps } from "../ModalDefault";

import { useState, useEffect, ReactNode } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
interface WarehouseZone {
  warehouse_id: number;
  status: string;
  zone_name: string;
  zone_type: string;
  capacity: number;
  manager: string;
}

interface InventoryItemsProps {
  inventory_id: number;
  item_name: string;
  quantity: number;
  category: string;
  batch: string;
  expiry: string;
  status: string;
  location: WarehouseZone | null;
}
type AssignStorageProps = DefaultInventoryModalProps & {
  selectedData: WarehouseZone;
};

interface InventoryModalProps {
  onClose: () => void;
  onSubmit?: () => void | null;
  children: ReactNode;
  modalType: string;
  zIndex?: number;
}
const InventoryModal: React.FC<InventoryModalProps> = ({
  onClose,
  onSubmit,
  children,
  modalType,
  zIndex = 900,
}) => {
  return (
    <div className="modal-overlay" style={{ zIndex }}>
      <div className="modal fit-content-spreed">
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

export const AssignStorage: React.FC<AssignStorageProps> = ({
  onClose,
  refreshData,
  selectedData,
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItemsProps[]>(
    [],
  );
  const fetchData = async () => {
    try {
      const response = await API.get(
        "/procurement_inventory/get_inventory_item",
      );
      return response.data;
    } catch (e: any) {
      console.error(`Error in fetching inventory item : ${e}`);
      return false;
    }
  };
  const getStockStatus = (quantity: number = 0) => {
    if (quantity < 50) return "critical";
    if (quantity < 200) return "low";
    return "good";
  };

  useEffect(() => {
    const handleFetch = async () => {
      const response = await fetchData();
      console.log(response);

      setInventoryItems(response);
    };
    handleFetch();
  }, []);

  return (
    <>
      <InventoryModal
        onClose={onClose}
        modalType="add-warehouse"
        onSubmit={() => {}}
      >
        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Category</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => (
                <tr key={item.inventory_id}>
                  <td>{item.item_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.category}</td>

                  <td>{item.batch}</td>
                  <td>
                    {item.expiry
                      ? new Date(item.expiry).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStockStatus(item.quantity)}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </InventoryModal>
    </>
  );
};

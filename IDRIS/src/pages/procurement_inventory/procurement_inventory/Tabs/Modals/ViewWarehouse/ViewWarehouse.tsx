import {
  DefaultInventoryModalProps,
  InventoryModal,
  WarehouseZone,
} from "../ModalDefault";
import { useState, useEffect } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { MiniMap } from "../../MiniMap";

export interface InventoryItem {
  inventory_id: number;
  item_name: string;
  quantity: number;
  category: string;
  batch: string;
  expiry: string | null; // ISO date string, or null if no expiry
  status: string;
}

export interface AssignedStorageWithItem {
  assigned_id: number;
  warehouse_id: number;
  inventory_id: number;
  quantity: number;
  inventory_item: InventoryItem;
}

interface ViewWarehouseProps extends DefaultInventoryModalProps {
  selectedData: WarehouseZone;
}
export const ViewWarehouse: React.FC<
  Omit<ViewWarehouseProps, "refreshData">
> = ({ onClose, selectedData }) => {
  const [assignedStorage, setAssignedStorage] = useState<
    AssignedStorageWithItem[] | null
  >(null);
  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await API.get(
          `/procurement_inventory/get_assigned_storage?warehouse_id=${selectedData.warehouse_id}`,
        );
        setAssignedStorage(response.data);
      } catch (e: any) {
        console.error("Error fetching assigned storage: " + e.message);
      }
    };
    fetch();
  }, []);
  return (
    <>
      <InventoryModal onClose={onClose} modalType="view-item" maxWidth="65vw">
        <div
          className="modal-content"
          style={{ height: "60vh", overflow: "hidden" }}
        >
          <h3>View Warehouse Zone</h3>
          <div
            style={{
              display: "flex",
              height: "100%",
              width: "100%",
              gap: "5px",
            }}
          >
            {/* Left side (scrollable) */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "40%",
                flexShrink: 0, // prevents shrinking
                overflowY: "auto", // allows scroll
                overflowX: "hidden",
                paddingRight: "8px",
                boxSizing: "border-box",
              }}
            >
              <div className="form-group">
                <label>Zone Name</label>
                <input type="text" disabled value={selectedData.zone_name} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <input type="text" disabled value={selectedData.status} />
              </div>
              <div
                className="form-group"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                <label>Address</label>
                <MiniMap coordinate={[selectedData.lat, selectedData.long]} />
                <input type="text" disabled value={selectedData.address} />
              </div>
              <div className="form-group">
                <label>Zone Type</label>
                <input type="text" disabled value={selectedData.zone_type} />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="text" disabled value={selectedData.capacity} />
              </div>
              <div className="form-group">
                <label>Manager</label>
                <input type="text" disabled value={selectedData.manager} />
              </div>
            </div>

            {/* Right side */}
            <div
              style={{
                display: "flex",
                width: "60%",
                borderLeft: "1px solid #999",
                paddingLeft: "5px",
              }}
            >
              {assignedStorage ? (
                <div className="inventory-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Quantity</th>
                        <th>Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!assignedStorage || assignedStorage.length === 0) && (
                        <tr>
                          <td colSpan={3}>No Items have been assigned yet</td>
                        </tr>
                      )}

                      {assignedStorage.map((item) => (
                        <tr key={item.inventory_id}>
                          <td>{item.inventory_item.item_name}</td>
                          <td>{item.quantity}</td>
                          <td>{item.inventory_item.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    height: "100%",
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  Fetching Data
                </div>
              )}
            </div>
          </div>
        </div>
      </InventoryModal>
    </>
  );
};

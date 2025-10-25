import { useEffect, useState } from "react";
import { AddInventoryItemTab } from "./Modals/AddInventoryItem/AddInventoryItem";
import { EditInventoryModal } from "./Modals/EditInventoryItemModal/EditInventoryItemModal";
import { ViewInventory } from "./Modals/ViewInventory/ViewInventory";
import { API } from "../../../../API_Handler/Axio_API_Handler";

type Warehouse = {
  long: number;
  lat: number;
  status: string;
  zone_type: string;
  manager: string;
  address: string;
  warehouse_id: number;
  zone_name: string;
  capacity: number;
};

// Assigned storage type
type AssignedStorage = {
  inventory_id: number;
  quantity: number;
  warehouse_id: number;
  assigned_id: number;
  warehouse: Warehouse;
};

// Inventory item type
type InventoryItem = {
  item_name: string;
  inventory_id: number;
  batch: string;
  expiry: string; // or Date if parsed
  quantity: number;
  category: string;
  status: string;
  assigned_storages: AssignedStorage[];
};

const getStockStatus = (quantity: number = 0) => {
  if (quantity < 50) return "critical";
  if (quantity < 200) return "low";
  return "good";
};

const InventoryItems = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const openModal = (name: string, item: InventoryItem | null = null) => {
    setActiveModal(name);
    setSelectedItem(item);
  };
  const closeModal = () => {
    setActiveModal(null);
    setSelectedItem(null);
  };
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
  useEffect(() => {
    const handleFetch = async () => {
      const response = await fetchData();
      console.log(response);

      setInventoryItems(response);
    };
    handleFetch();
  }, []);

  const updateTable = () => {
    const handleFetch = async () => {
      const response = await fetchData();
      console.log(response);

      setInventoryItems(response);
    };
    handleFetch();
  };

  const getWarehouseNames = (assignedStorages: AssignedStorage[]): string =>
    assignedStorages.map((s) => s.warehouse.zone_name).join(", ");
  return (
    <>
      {activeModal == "view-item" && (
        <ViewInventory
          onClose={closeModal}
          selectedData={selectedItem}
        ></ViewInventory>
      )}
      {activeModal == "add-item" && (
        <AddInventoryItemTab
          onClose={closeModal}
          refreshData={updateTable}
        ></AddInventoryItemTab>
      )}
      {activeModal == "edit-item" && (
        <EditInventoryModal
          onClose={closeModal}
          refreshData={updateTable}
          selectedData={selectedItem}
        ></EditInventoryModal>
      )}
      <div className="inventory-content">
        <div className="section-header">
          <h2>Inventory Dashboard</h2>
          <div className="header-actions">
            <button
              className="secondary-btn"
              onClick={() => openModal("export")}
            >
              📊 Export Report
            </button>
            <button
              className="primary-btn"
              onClick={() => openModal("add-item")}
            >
              + Add Item
            </button>
          </div>
        </div>

        <div className="inventory-table">
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Category</th>
                <th>Location</th>
                <th>Batch</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => (
                <tr key={item.inventory_id}>
                  <td>{item.item_name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.category}</td>
                  <td
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "150px",
                    }}
                  >
                    {item.assigned_storages.length > 0
                      ? getWarehouseNames(item.assigned_storages)
                      : "No locations assigned"}
                  </td>
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
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => openModal("edit-item", item)}
                    >
                      Edit
                    </button>
                    <button
                      className="action-btn"
                      onClick={() => openModal("view-item", item)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
export default InventoryItems;

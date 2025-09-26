import { useEffect, useState } from "react";
import { AddInventoryItemTab } from "./Modals/AddInventoryItem/AddInventoryItem";
import { API } from "../../../../API_Handler/Axio_API_Handler";
interface InventoryItemProps {
  id: number | string;
  name: string;
  quantity: number;
  category: string;
  location: string;
  batch: string;
  expiry?: string | null | undefined | Date;
  status: string;
}

// Sample inventory data
const inventoryItems: InventoryItemProps[] = [
  {
    id: 1,
    name: "Rice Packs",
    quantity: 1250,
    category: "Food",
    location: "Warehouse A - Zone 1",
    expiry: "2024-08-15",
    batch: "RC-2024-001",
    status: "In Stock",
  },
  {
    id: 2,
    name: "Water Bottles",
    quantity: 3500,
    category: "Beverages",
    location: "Warehouse B - Zone 2",
    expiry: "2025-12-30",
    batch: "WB-2024-045",
    status: "In Stock",
  },
  {
    id: 3,
    name: "Medical Supplies",
    quantity: 85,
    category: "Medical",
    location: "Medical Storage - Zone 1",
    expiry: "2024-06-20",
    batch: "MS-2024-012",
    status: "Low Stock",
  },
  {
    id: 4,
    name: "Blankets",
    quantity: 450,
    category: "Clothing",
    location: "Warehouse C - Zone 3",
    expiry: null,
    batch: "BL-2024-008",
    status: "In Stock",
  },
  {
    id: 5,
    name: "First Aid Kits",
    quantity: 12,
    category: "Medical",
    location: "Medical Storage - Zone 2",
    expiry: "2024-07-10",
    batch: "FA-2024-003",
    status: "Critical",
  },
];
const getStockStatus = (quantity: number = 0) => {
  if (quantity < 50) return "critical";
  if (quantity < 200) return "low";
  return "good";
};

const InventoryItems = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (name: string, item: any | null = null) => {
    setActiveModal(name);
  };
  const closeModal = () => {
    setActiveModal(null);
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
    };
    handleFetch();
  }, []);
  return (
    <>
      {activeModal == "add-item" && (
        <AddInventoryItemTab
          onClose={closeModal}
          refreshData={() => {}}
        ></AddInventoryItemTab>
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
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.quantity}</td>
                  <td>{item.category}</td>
                  <td>{item.location}</td>
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

//
//
//
//
//
//
//
//
//
//
//
//
//
// Im going to kill myself if this shit isn't done in the end of the mont

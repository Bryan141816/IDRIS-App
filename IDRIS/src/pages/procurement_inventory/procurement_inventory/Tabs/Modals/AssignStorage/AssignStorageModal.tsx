import { DefaultInventoryModalProps } from "../ModalDefault";

import { useState, useEffect, ReactNode } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import Swal from "sweetalert2";
interface WarehouseZone {
  warehouse_id: number;
  status: string;
  zone_name: string;
  zone_type: string;
  capacity: number;
  manager: string;
  total_occupancy?: number;
}

type AssignedStorage = {
  assigned_id: number;
  inventory_id: number;
  warehouse_id: number;
  quantity: number;
  warehouse: WarehouseZone;
};

type InventoryItem = {
  inventory_id: number;
  item_name: string;
  batch: string;
  expiry: string; // or Date if you parse it
  quantity: number;
  category: string;
  status: string;
  assigned_storages: AssignedStorage[];
  already_recorded?: boolean;
};
type AssignStorageProps = DefaultInventoryModalProps & {
  selectedData: WarehouseZone;
};

interface InventoryModalProps {
  onClose: () => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void | null;
  children: ReactNode;
  modalType: string;
  zIndex?: number;
  isSubmitEnabled?: boolean | null;
}
const InventoryModal: React.FC<InventoryModalProps> = ({
  onClose,
  onSubmit,
  children,
  modalType,
  zIndex = 900,
  isSubmitEnabled,
}) => {
  return (
    <div className="modal-overlay" style={{ zIndex }}>
      <form
        className="modal fit-content-spreed"
        onSubmit={(e) => {
          if (onSubmit) onSubmit(e);
        }}
      >
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
            <button
              className="primary-btn"
              disabled={!(isSubmitEnabled ?? true)}
            >
              {modalType === "export" ? "Generate Report" : "Save"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export const AssignStorage: React.FC<AssignStorageProps> = ({
  onClose,
  refreshData,
  selectedData,
}) => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [enabledInput, setEnabledInput] = useState<Record<number, boolean>>({});
  const [assignQuantities, setAssignQuantities] = useState<
    Record<number, number>
  >({});

  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);

  // 🔹 Fetch data
  const fetchData = async () => {
    try {
      const categoryList: Record<string, string | string[]> = {
        "food storage zone": "food item",
        "shelter materials zone": "shelter materials",
        "health & hygiene supplies zone": [
          "hygiene & sanitation",
          "clothing items",
        ],
      };

      const response = await API.get(
        `/procurement_inventory/get_inventory_item`,
        {
          params: {
            category: categoryList[selectedData.zone_type],
            exclude_fully_assigned: true,
            is_for_assignment: true,
          },
        },
      );

      return response.data;
    } catch (e: any) {
      console.error(`Error fetching inventory items: ${e}`);
      return [];
    }
  };

  useEffect(() => {
    const handleFetch = async () => {
      const response = await fetchData();
      setInventoryItems(response);
    };
    handleFetch();
  }, []);

  useEffect(() => {
    setIsSubmitEnabled(Object.keys(enabledInput).length > 0);
  }, [enabledInput]);

  const getStockStatus = (quantity: number = 0) => {
    if (quantity < 50) return "critical";
    if (quantity < 200) return "low";
    return "good";
  };

  // 🧠 Handle checkbox toggle
  const handleIncludeItem = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: number,
  ) => {
    const checked = e.target.checked;
    setEnabledInput((prev) => ({
      ...prev,
      [id]: checked,
    }));

    if (!checked) {
      setAssignQuantities((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };

  // 🎯 Handle quantity input
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.name;
    const value = parseFloat(e.target.value) || 0;
    const item: InventoryItem | undefined = inventoryItems.find(
      (i) => i.inventory_id === parseInt(input),
    );
    if (item && value > item?.quantity) {
      setAssignQuantities((prev) => ({
        ...prev,
        [input]: item.quantity,
      }));
    } else {
      setAssignQuantities((prev) => ({
        ...prev,
        [input]: value,
      }));
    }
  };

  // 🚀 Submit payload
  const submitData = async () => {
    try {
      const formatted = Object.entries(assignQuantities).map(
        ([key, value]) => ({
          item_id: Number(key),
          quantity: value,
        }),
      );
      const remaining =
        selectedData.capacity - (selectedData.total_occupancy ?? 0);
      const total_occupancy_count = formatted.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );
      if (remaining < total_occupancy_count) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: `Warehouse capacity is full! Available capacity is ${remaining} and your trying to add ${total_occupancy_count} more units`,
        });
        return;
      }
      const response = await API.post(
        `/procurement_inventory/assign_storage?id=${selectedData.warehouse_id}`,
        formatted,
      );
      refreshData();
      onClose();
      return response.data;
    } catch (e: any) {
      console.error("Error assigning storage: " + e);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(inventoryItems);
    submitData();
  };

  return (
    <InventoryModal
      onClose={onClose}
      modalType="add-warehouse"
      onSubmit={handleSubmit}
      isSubmitEnabled={isSubmitEnabled}
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
              <th>Include Item</th>
              <th>Assign Quantity</th>
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
                <td>
                  <input
                    type="checkbox"
                    onChange={(e) => handleIncludeItem(e, item.inventory_id)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    disabled={!enabledInput[item.inventory_id]}
                    required={enabledInput[item.inventory_id]}
                    value={assignQuantities[item.inventory_id] ?? ""}
                    name={item.inventory_id.toString()}
                    onChange={handleQuantityChange}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InventoryModal>
  );
};

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
  const [inventoryItems, setInventoryItems] = useState<InventoryItemsProps[]>(
    [],
  );
  const fetchData = async () => {
    try {
      const categoryList: Record<string, string | string[]> = {
        "food storage zone": "food item",
        "shelter materials zone": "shelter materials",
        "health & hygiene supplies zone": [
          "hygiene & sanitation",
          "personal care items",
        ],
      };

      const response = await API.get(
        `/procurement_inventory/get_inventory_item`,
        {
          params: {
            category: categoryList[selectedData.zone_type],
            is_assigned: "false",
          },
        },
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

  const [enabledInput, setEnabledInput] = useState<Record<number, boolean>>({});
  const [unitsOcupancy, setUnitOcupancy] = useState<
    Record<number, number | string>
  >({});
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  useEffect(() => {
    const handleFetch = async () => {
      const response = await fetchData();
      console.log(response);

      setInventoryItems(response);
    };
    handleFetch();
  }, []);
  useEffect(() => {
    if (Object.keys(enabledInput).length === 0) {
      setIsSubmitEnabled(false);
    } else {
      setIsSubmitEnabled(true);
    }
  }, [enabledInput]);
  const submitData = async () => {
    try {
      const response = await API.post(
        `/procurement_inventory/assign_storage?id=${selectedData.warehouse_id}`,
        {
          storage: unitsOcupancy,
        },
      );
      refreshData();
      onClose();
      return response.data;
    } catch (e: any) {
      console.error("Error assigning storage: " + e);
    }
  };
  const handleIncludeItem = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: number,
  ) => {
    const checked = e.target.checked;

    setEnabledInput((prev) => ({
      ...prev,
      [id]: checked, // true = enabled, false = disabled
    }));
    if (!checked) {
      setUnitOcupancy((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });
    }
  };
  const handleUnitOcupancyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.name;
    const value = parseFloat(e.target.value) ?? 0;

    setUnitOcupancy((prev) => ({
      ...prev,
      [input]: value,
    }));
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submit = async () => {
      const response = await submitData();
    };
    submit();
  };

  return (
    <>
      <InventoryModal
        onClose={onClose}
        modalType="add-warehouse"
        onSubmit={(e) => {
          handleSubmit(e);
        }}
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
                <th>Unit Occupancy</th>
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
                      onChange={(e) => {
                        handleIncludeItem(e, item.inventory_id);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      disabled={!enabledInput[item.inventory_id]}
                      required={enabledInput[item.inventory_id]}
                      value={unitsOcupancy[item.inventory_id] ?? ""}
                      name={item.inventory_id.toString()}
                      onChange={handleUnitOcupancyChange}
                    />
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

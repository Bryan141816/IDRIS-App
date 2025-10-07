import { DefaultInventoryModalProps, InventoryModal } from "../ModalDefault";

import { useState, useEffect } from "react";
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
            </tr>
          </thead>
          <tbody>
            {inventoryItems.map((item) => (
              <tr key={item.inventory_id}>
                <td>{item.item_name}</td>
                <td>{item.quantity}</td>
                <td>{item.category}</td>
                <td>
                  {item.location
                    ? typeof item.location === "string"
                      ? item.location
                      : item.location.zone_name
                    : "No location assigned"}
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
              </tr>
            ))}
          </tbody>
        </table>
      </InventoryModal>
    </>
  );
};

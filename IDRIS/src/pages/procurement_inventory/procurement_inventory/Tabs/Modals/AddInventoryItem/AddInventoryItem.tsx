import {
  DefaultInventoryModalProps,
  InventoryModal,
  InventoryItemsProps,
} from "../ModalDefault";

import { useState, ChangeEvent } from "react";
interface WarehouseZoneProps {
  id: number;
  name: string;
  capacity: number;
  occupied: number;
  type: string;
  manager: string;
  status: string;
}
import { API } from "../../../../../../API_Handler/Axio_API_Handler";

const warehouseZones: WarehouseZoneProps[] = [
  {
    id: 1,
    name: "Warehouse A - Zone 1",
    capacity: 5000,
    occupied: 3200,
    type: "Food Storage",
    manager: "Juan Carlos",
    status: "Active",
  },
  {
    id: 2,
    name: "Warehouse B - Zone 2",
    capacity: 8000,
    occupied: 5600,
    type: "General Storage",
    manager: "Maria Santos",
    status: "Active",
  },
  {
    id: 3,
    name: "Medical Storage - Zone 1",
    capacity: 1500,
    occupied: 890,
    type: "Medical Supplies",
    manager: "Dr. Pedro Gomez",
    status: "Active",
  },
  {
    id: 4,
    name: "Warehouse C - Zone 3",
    capacity: 6000,
    occupied: 2100,
    type: "Clothing & Textiles",
    manager: "Ana Reyes",
    status: "Under Maintenance",
  },
];

export const AddInventoryItemTab: React.FC<DefaultInventoryModalProps> = ({
  onClose,
  refreshData,
}) => {
  type InventoryItemForm = Omit<InventoryItemsProps, "inventory_id">;
  const [addForm, setAddForm] = useState<InventoryItemForm>({
    item_name: "",
    quantity: 0,
    category: "",
    batch: "",
    expiry: "",
    status: "in stock",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAddForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRequest = async () => {
    try {
      const response = await API.post(
        "/procurement_inventory/add_inventory_item",
        addForm,
      );
      return response.data;
    } catch (e: any) {
      console.error(`Error on adding inventory item: ${e}`);
      return false;
    }
  };

  const handleSubmit = () => {
    const _submit = async () => {
      const response = await handleRequest();
      refreshData();
      onClose();
    };
    _submit();
  };

  return (
    <>
      <InventoryModal
        onClose={onClose}
        modalType="add-warehouse"
        onSubmit={handleSubmit}
      >
        <div className="modal-content">
          <div className="form-group">
            <label>Item Name</label>
            <input
              type="text"
              placeholder="Enter item name"
              value={addForm.item_name}
              name="item_name"
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input
              type="number"
              placeholder="Enter quantity"
              value={addForm.quantity}
              name="quantity"
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select
              value={addForm.category}
              name="category"
              onChange={handleChange}
            >
              <option value="">Select category</option>
              <option value="food">Food</option>
              <option value="medical">Medical</option>
              <option value="clothing">Clothing</option>
              <option value="beverages">Beverages</option>
            </select>
          </div>
          <div className="form-group">
            <label>Batch Number</label>
            <input
              type="text"
              placeholder="Enter batch number"
              value={addForm.batch}
              name="batch"
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Expiry Date</label>
            <input
              type="date"
              value={addForm.expiry}
              name="expiry"
              onChange={handleChange}
            />
          </div>
        </div>
      </InventoryModal>
    </>
  );
};

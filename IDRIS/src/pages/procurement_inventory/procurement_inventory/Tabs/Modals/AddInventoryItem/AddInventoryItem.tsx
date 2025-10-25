import {
  DefaultInventoryModalProps,
  InventoryModal,
  InventoryItemsProps,
} from "../ModalDefault";

import { useState, ChangeEvent } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";

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
              <option value="" disabled>
                Select category
              </option>
              <option value="food item">Food Item</option>
              <option value="hygiene & sanitation">Hygiene & Sanitation</option>
              <option value="shelter materials">Shelter Materials</option>
              <option value="medical supplies">Medical Supplies</option>
              <option value="personal care items">Personal Care Items</option>
            </select>
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

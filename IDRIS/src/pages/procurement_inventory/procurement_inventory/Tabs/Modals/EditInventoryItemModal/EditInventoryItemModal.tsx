import {
  DefaultInventoryModalProps,
  InventoryModal,
  InventoryItemsProps,
} from "../ModalDefault";
import { useState, ChangeEvent } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import Swal from "sweetalert2";
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
  unit_occupancy: number;
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

interface EditInventoryModalProp extends DefaultInventoryModalProps {
  selectedData: InventoryItem | null;
}

export const EditInventoryModal: React.FC<EditInventoryModalProp> = ({
  onClose,
  refreshData,
  selectedData,
}) => {
  if (!selectedData) {
    return <></>;
  }
  type InventoryItemForm = Omit<InventoryItemsProps, "inventory_id">;

  const [addForm, setAddForm] = useState<InventoryItemForm>(selectedData);

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
        "/procurement_inventory/update_inventory_item",
        addForm,
      );
      return response.data;
    } catch (e: any) {
      Swal.fire({
        title: "Add Inventory Item",
        text: "An error occured while updating item: " + e.message,
        icon: "error",
      });

      console.error(`Error on adding inventory item: ${e}`);
      return false;
    }
  };

  const handleSubmit = () => {
    const _submit = async () => {
      const confirm = await Swal.fire({
        title: "Are you sure you want to edit this item?",
        showCancelButton: true,
        confirmButtonText: "Yes",
      });
      if (!confirm.isConfirmed) {
        return;
      }
      const response = await handleRequest();
      if (response) {
        Swal.fire({
          title: "Success!",
          text: "Inventory has been updated.",
          icon: "success",
          timer: 1000, // 2 seconds
          showConfirmButton: false, // hides the OK button
          timerProgressBar: true, // optional progress bar
        });

        refreshData();
        onClose();
      }
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
          {selectedData.assigned_storages.length <= 0 && (
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
          )}
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
          {selectedData.assigned_storages.length <= 0 && (
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
                <option value="hygiene & sanitation">
                  Hygiene & Sanitation
                </option>
                <option value="shelter materials">Shelter Materials</option>
                <option value="medical supplies">Medical Supplies</option>
                <option value="clothing items">Clothing Items</option>
              </select>
            </div>
          )}
          {selectedData.assigned_storages.length <= 0 && (
            <div className="form-group">
              <label>Expiry Date</label>
              <input
                type="date"
                value={addForm.expiry}
                name="expiry"
                onChange={handleChange}
              />
            </div>
          )}
        </div>
      </InventoryModal>
    </>
  );
};

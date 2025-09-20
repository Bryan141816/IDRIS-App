import {
  DefaultInventoryModalProps,
  InventoryModal,
  WarehouseZone,
} from "../ModalDefault";
import { useState, ChangeEvent } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";

type EditWarehouseZoneProp = DefaultInventoryModalProps & {
  selectedData: WarehouseZone;
};
export const AddWarehouseZone: React.FC<EditWarehouseZoneProp> = ({
  onClose,
  refreshData,
}) => {
  const [formData, setFormData] = useState<WarehouseZone>({
    warehouse_id: 0,
    status: "active",
    zone_name: "",
    zone_type: "",
    capacity: 0,
    manager: "",
  });
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = () => {
    const callFunction = async () => {
      const response = await AddWareHouse();
      if (response) {
        refreshData();
        onClose();
      }
    };
    callFunction();
  };

  const AddWareHouse = async () => {
    try {
      const response = await API.post(
        "/procurement_inventory/add_warehouse_zone",
        formData,
      );
      return response.data; // ✅ now it's the actual data
    } catch (e: any) {
      console.error(`Error in adding warehouse zone:`, e);
      return false;
    }
  };
  return (
    <InventoryModal
      onClose={onClose}
      modalType="add-warehouse"
      onSubmit={handleSubmit}
    >
      <div className="modal-content">
        <h3>Create Warehouse Zone</h3>
        <div className="form-group">
          <label>Zone Name</label>
          <input
            type="text"
            placeholder="Enter zone name"
            name="zone_name"
            value={formData.zone_name}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Zone Type</label>
          <select
            name="zone_type"
            value={formData.zone_type}
            onChange={handleChange}
          >
            <option value="">Select type</option>
            <option value="food storage">Food Storage</option>
            <option value="medical supplies">Medical Supplies</option>
            <option value="general storage">General Storage</option>
            <option value="clothing & textiles">Clothing & Textiles</option>
          </select>
        </div>
        <div className="form-group">
          <label>Capacity</label>
          <input
            type="number"
            placeholder="Enter capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Manager</label>
          <input
            type="text"
            placeholder="Enter manager name"
            name="manager"
            value={formData.manager}
            onChange={handleChange}
          />
        </div>
      </div>
    </InventoryModal>
  );
};

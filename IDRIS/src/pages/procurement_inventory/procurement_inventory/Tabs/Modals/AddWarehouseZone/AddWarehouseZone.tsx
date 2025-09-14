import { DefaultInventoryModalProps, InventoryModal } from "../ModalDefault";

export const AddWarehouseZone: React.FC<DefaultInventoryModalProps> = ({
  onClose,
}) => {
  return (
    <InventoryModal onClose={onClose} modalType="add-warehouse">
      <div className="modal-content">
        <h3>Create Warehouse Zone</h3>
        <div className="form-group">
          <label>Zone Name</label>
          <input type="text" placeholder="Enter zone name" />
        </div>
        <div className="form-group">
          <label>Zone Type</label>
          <select>
            <option>Select type</option>
            <option>Food Storage</option>
            <option>Medical Supplies</option>
            <option>General Storage</option>
            <option>Clothing & Textiles</option>
          </select>
        </div>
        <div className="form-group">
          <label>Capacity</label>
          <input type="number" placeholder="Enter capacity" />
        </div>
        <div className="form-group">
          <label>Manager</label>
          <input type="text" placeholder="Enter manager name" />
        </div>
      </div>
    </InventoryModal>
  );
};

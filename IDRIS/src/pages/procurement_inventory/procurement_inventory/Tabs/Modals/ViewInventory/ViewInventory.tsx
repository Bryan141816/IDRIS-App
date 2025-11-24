import {
  DefaultInventoryModalProps,
  InventoryModal,
  InventoryItemsProps,
} from "../ModalDefault";

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

interface ViewProp extends DefaultInventoryModalProps {
  selectedData: InventoryItem | null;
}

export const ViewInventory: React.FC<Omit<ViewProp, "refreshData">> = ({
  onClose,
  selectedData,
}) => {
  if (!selectedData) {
    return <></>;
  }
  type InventoryItemForm = Omit<InventoryItemsProps, "inventory_id">;
  const addForm: InventoryItemForm = selectedData;
  const totalAssigned = selectedData.assigned_storages.reduce(
    (sum, storage) => sum + storage.quantity,
    0,
  );
  const remainingQuantity = selectedData.quantity - totalAssigned;
  return (
    <>
      <InventoryModal onClose={onClose} modalType="view-item" maxWidth="90vw">
        <div className="modal-content">
          <div className="form-group">
            <label>Item Name</label>
            <input type="text" value={addForm.item_name} disabled />
          </div>
          <div className="form-group">
            <label>Quantity</label>
            <input type="text" value={addForm.quantity} disabled />
          </div>
          <div className="form-group">
            <label>Category</label>
            <input type="text" value={addForm.category} disabled />
          </div>
          <div className="form-group">
            <label>Assigned Warehouse</label>

            <div className="inventory-table">
              <table>
                <thead>
                  <tr>
                    <th>Warehouse</th>
                    <th>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedData.assigned_storages.map((item) => (
                    <tr key={item.inventory_id}>
                      <td
                        style={{
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          maxWidth: "20px",
                        }}
                      >
                        {item.warehouse.zone_name}
                      </td>
                      <td>{item.quantity}</td>
                    </tr>
                  ))}
                  {remainingQuantity > 0 && (
                    <tr>
                      <td>Not yet assigned</td>
                      <td>{remainingQuantity}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="form-group">
            <label>Expiry Date</label>
            <input type="text" value={addForm.expiry} disabled />
          </div>
        </div>
      </InventoryModal>
    </>
  );
};

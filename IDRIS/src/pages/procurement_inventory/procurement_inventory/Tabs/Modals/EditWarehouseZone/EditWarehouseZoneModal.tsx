import {
  DefaultInventoryModalProps,
  InventoryModal,
  WarehouseZone,
} from "../ModalDefault";
import { useState, ChangeEvent, useRef, useEffect } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { MiniMap } from "../../MiniMap";
type EditWarehouseZoneProp = DefaultInventoryModalProps & {
  selectedData: WarehouseZone;
};
import Swal from "sweetalert2";
import { MapViewWithSearch } from "../../MapViewWithSearch";

export interface InventoryItem {
  inventory_id: number;
  item_name: string;
  quantity: number;
  category: string;
  batch: string;
  expiry: string | null; // ISO date string, or null if no expiry
  status: string;
}

export interface AssignedStorageWithItem {
  assigned_id: number;
  warehouse_id: number;
  inventory_id: number;
  quantity: number;
  inventory_item: InventoryItem;
}

export const EditWarehouseZone: React.FC<EditWarehouseZoneProp> = ({
  onClose,
  refreshData,
  selectedData,
}) => {
  const [formData, setFormData] = useState<WarehouseZone>(selectedData);
  const [addressSelector, setAddressSelector] = useState(false);
  const [assignedStorage, setAssignedStorage] = useState<
    AssignedStorageWithItem[] | null
  >(null);
  const prevAssignedStorage = useRef<AssignedStorageWithItem[] | null>(null);
  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await API.get(
          `/procurement_inventory/get_assigned_storage?warehouse_id=${selectedData.warehouse_id}`,
        );
        setAssignedStorage(response.data);
        prevAssignedStorage.current = response.data;
      } catch (e: any) {
        console.error("Error fetching assigned storage: " + e.message);
      }
    };
    fetch();
  }, []);
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    const total_occupancy = Math.ceil(formData.total_occupancy ?? 0);
    if (name === "capacity" && total_occupancy > 0) {
      const numericValue = parseInt(value); // convert string to number

      if (numericValue < total_occupancy) {
        setFormData((prev) => ({
          ...prev,
          [name]: total_occupancy, // use number instead of string
        }));
        return;
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      const form = e.currentTarget.closest("form") as HTMLFormElement;
      if (!form.checkValidity()) {
        form.reportValidity(); // shows native browser validation
        return;
      } else {
        e.preventDefault();
      }
    }
    const callFunction = async () => {
      const result = await Swal.fire({
        title: "Are you sure you want to edit this item?",
        showCancelButton: true,
        confirmButtonText: "Yes",
      });

      if (!result.isConfirmed) {
        return;
      }

      const response = await EditWarehouse();
      if (response) {
        Swal.fire({
          title: "Add Inventory Item",
          text: "Warehouse has been updated succesfuly",
          icon: "success",
        });

        refreshData();
        onClose();
      }
    };
    callFunction();
  };

  const EditWarehouse = async () => {
    try {
      if (!assignedStorage || !prevAssignedStorage.current) return;

      const originalArr = prevAssignedStorage.current ?? [];
      const originalMap = new Map<number, number>(
        originalArr.map(
          (o: AssignedStorageWithItem) => [o.assigned_id, o.quantity] as const,
        ),
      );

      const updates: { assigned_id: number; quantity: number }[] = (
        assignedStorage ?? []
      ).reduce<{ assigned_id: number; quantity: number }[]>((acc, item) => {
        const origQty = originalMap.get(item.assigned_id);
        if (origQty !== undefined && origQty !== item.quantity) {
          acc.push({ assigned_id: item.assigned_id, quantity: item.quantity });
        }
        return acc;
      }, []);

      const response = await API.post(
        "/procurement_inventory/update_warehouse_zone",
        {
          ...formData,
          assigned_storage: updates,
        },
      );
      return response.data; // ✅ now it's the actual data
    } catch (e: any) {
      Swal.fire({
        title: "Add Inventory Item",
        text: "An error occured while updating warehouse: " + e.message,
        icon: "error",
      });
      console.error(`Error in updating warehouse zone:`, e);
      return false;
    }
  };
  const handleAddressSelection = (
    address: string,
    coordinates: [number, number],
  ) => {
    setFormData((prev) => ({
      ...prev,
      address: address,
      lat: coordinates[0],
      long: coordinates[1],
    }));
  };

  const handleQuantityChange = (index: number, newQuantity: number) => {
    if (!assignedStorage || !prevAssignedStorage.current) return;

    const original = prevAssignedStorage.current[index];
    const maxQuantity = original.quantity; // original assigned quantity

    // Clamp the input to original maximum
    const clamped = Math.min(newQuantity, maxQuantity);
    setAssignedStorage((prev) => {
      if (!prev) return prev;
      // Create a shallow copy so React detects the state change
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: clamped,
      };
      return updated;
    });
  };
  return (
    <>
      {addressSelector && (
        <MapViewWithSearch
          onClose={() => setAddressSelector(false)}
          defaultValue={{
            address: formData.address,
            coordinates: [formData.lat, formData.long],
          }}
          onSubmit={handleAddressSelection}
        ></MapViewWithSearch>
      )}
      <InventoryModal
        onClose={onClose}
        modalType="edit-warehouse"
        onSubmit={handleSubmit}
        maxWidth={
          (selectedData.is_assigned !== undefined || null) &&
          selectedData.is_assigned === false
            ? null
            : "65vw"
        }
      >
        <div className="modal-content">
          <h3>Edit Warehouse Zone</h3>
          {(selectedData.is_assigned !== undefined || null) &&
          selectedData.is_assigned === false ? (
            <>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under maintenance">
                    Under Maintenance
                  </option>{" "}
                </select>
              </div>
              <div className="form-group">
                <label>Zone Name</label>
                <input
                  type="text"
                  placeholder="Enter zone name"
                  name="zone_name"
                  value={formData.zone_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div
                className="form-group"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                }}
              >
                <label>Address</label>
                <MiniMap coordinate={[formData.lat, formData.long]}></MiniMap>
                <input
                  type="text"
                  placeholder="No Address has been selected yet."
                  value={formData.address}
                  required
                />
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    setAddressSelector(true);
                  }}
                  className="secondary-btn"
                  style={{ width: "100%" }}
                >
                  Select Address
                </button>
              </div>
              <div className="form-group">
                <label>Zone Type</label>

                <select
                  name="zone_type"
                  value={formData.zone_type}
                  onChange={handleChange}
                  required
                >
                  <option value="food storage zone">Food Storage Zone</option>
                  <option value="shelter materials zone">
                    Shelter Materials Zone
                  </option>
                  <option value="health & hygiene supplies zone">
                    Health & Hygiene Supplies Zone
                  </option>
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
                  required
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
                  required
                />
              </div>
            </>
          ) : (
            <div
              style={{
                display: "flex",
                height: "100%",
                width: "100%",
                gap: "5px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: "40%",
                  flexShrink: 0, // prevents shrinking
                  overflowY: "auto", // allows scroll
                  overflowX: "hidden",
                  paddingRight: "8px",
                  boxSizing: "border-box",
                }}
              >
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="under maintenance">
                      Under Maintenance
                    </option>{" "}
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
                    required
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
                    required
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  width: "60%",
                  borderLeft: "1px solid #999",
                  paddingLeft: "5px",
                }}
              >
                {assignedStorage ? (
                  <div className="inventory-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Item Name</th>
                          <th> Quantity</th>
                          <th>Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedStorage.map((item, index) => (
                          <tr key={item.inventory_id}>
                            <td>{item.inventory_item.item_name}</td>
                            <td>
                              <input
                                type="number"
                                min={0}
                                value={item.quantity}
                                onChange={(e) => {
                                  // valueAsNumber is NaN when input is empty; guard it
                                  const n = e.currentTarget.valueAsNumber;
                                  handleQuantityChange(
                                    index,
                                    Number.isNaN(n) ? 0 : n,
                                  );
                                }}
                              />
                            </td>
                            <td>{item.inventory_item.category}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      height: "100%",
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    Fetching Data
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </InventoryModal>
    </>
  );
};

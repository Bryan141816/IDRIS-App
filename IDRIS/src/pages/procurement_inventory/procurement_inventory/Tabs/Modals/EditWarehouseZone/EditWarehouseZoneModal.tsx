import {
  DefaultInventoryModalProps,
  InventoryModal,
  WarehouseZone,
} from "../ModalDefault";
import { useState, ChangeEvent } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { MiniMap } from "../../MiniMap";
type EditWarehouseZoneProp = DefaultInventoryModalProps & {
  selectedData: WarehouseZone;
};
import Swal from "sweetalert2";
import { MapViewWithSearch } from "../../MapViewWithSearch";
export const EditWarehouseZone: React.FC<EditWarehouseZoneProp> = ({
  onClose,
  refreshData,
  selectedData,
}) => {
  const [formData, setFormData] = useState<WarehouseZone>(selectedData);
  const [addressSelector, setAddressSelector] = useState(false);
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
  const handleSubmit = () => {
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
      const response = await API.post(
        "/procurement_inventory/update_warehouse_zone",
        formData,
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
      >
        <div className="modal-content">
          <h3>Edit Warehouse Zone</h3>
          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="under maintenance">Under Maintenance</option>{" "}
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
            />
          </div>
          {selectedData.total_occupancy === 0 && (
            <>
              <div
                className="form-group"
                style={{ display: "flex", flexDirection: "column", gap: "5px" }}
              >
                <label>Address</label>
                <MiniMap coordinate={[formData.lat, formData.long]}></MiniMap>
                <input
                  type="text"
                  disabled
                  placeholder="No Address has been selected yet."
                  value={formData.address}
                />
                <button
                  onClick={() => setAddressSelector(true)}
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
            </>
          )}
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
    </>
  );
};

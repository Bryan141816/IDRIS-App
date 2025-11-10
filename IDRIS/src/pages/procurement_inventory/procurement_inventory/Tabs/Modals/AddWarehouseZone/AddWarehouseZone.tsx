import {
  DefaultInventoryModalProps,
  InventoryModal,
  WarehouseZone,
} from "../ModalDefault";
import { useState, ChangeEvent } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { MapViewWithSearch } from "../../MapViewWithSearch";
import Swal from "sweetalert2";
export const AddWarehouseZone: React.FC<DefaultInventoryModalProps> = ({
  onClose,
  refreshData,
}) => {
  type WarehouseZoneForm = Omit<WarehouseZone, "warehouse_id">;

  const [addressSelector, setAddressSelector] = useState(false);

  const [formData, setFormData] = useState<WarehouseZoneForm>({
    status: "active",
    zone_name: "",
    zone_type: "",
    address: "",
    lat: -1000000,
    long: -1000000,
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
        Swal.fire({
          title: "Success!",
          text: "Warehouse has been added.",
          icon: "success",
          timer: 1000, // 2 seconds
          showConfirmButton: false, // hides the OK button
          timerProgressBar: true, // optional progress bar
          willClose: () => {
            console.log("Alert closed automatically");
          },
        });

        refreshData();
        onClose();
      }
    };
    callFunction();
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
            <label>Address</label>
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
              <option value="" disabled>
                Select Type
              </option>
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

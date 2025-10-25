import { useEffect, useState } from "react";
import { AddWarehouseZone } from "./Modals/AddWarehouseZone/AddWarehouseZone";
import { API } from "../../../../API_Handler/Axio_API_Handler";
import { WarehouseZone } from "./Modals/ModalDefault";
import { EditWarehouseZone } from "./Modals/EditWarehouseZone/EditWarehouseZoneModal";
import { AssignStorage } from "./Modals/AssignStorage/AssignStorageModal";
import { ViewWarehouse } from "./Modals/ViewWarehouse/ViewWarehouse";
const WarehouseZoneComponent = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [warehouseZones, setWarehouseZone] = useState<WarehouseZone[]>([]);
  const [selecteZone, setSelectedZone] = useState<WarehouseZone>({
    warehouse_id: -1,
    status: "",
    address: "",
    lat: -100000,
    long: -100000,
    zone_name: "",
    zone_type: "",
    capacity: 0,
    manager: "",
    total_occupancy: -0,
  });
  const openModal = (
    type: string,
    selectedZone: WarehouseZone | null = null,
  ) => {
    setActiveModal(type);
    if (selectedZone) {
      setSelectedZone(selectedZone);
    }
  };
  const closeModal = () => {
    setActiveModal(null);
  };

  const fetchData = async () => {
    try {
      const response = await API.get(
        "procurement_inventory/get_warehouse_zone",
      );
      return response.data;
    } catch (e: any) {
      console.error(`Error in fetch warehouse zones: ${e}`);
      return false;
    }
  };
  const handleFetch = async () => {
    const response = await fetchData();
    setWarehouseZone(response);
  };
  useEffect(() => {
    handleFetch();
  }, []);
  return (
    <>
      {activeModal === "view-storage" && (
        <ViewWarehouse
          onClose={closeModal}
          selectedData={selecteZone}
        ></ViewWarehouse>
      )}
      {activeModal === "add-warehouse" && (
        <AddWarehouseZone
          onClose={closeModal}
          refreshData={handleFetch}
        ></AddWarehouseZone>
      )}
      {activeModal === "edit-zone" && (
        <EditWarehouseZone
          onClose={closeModal}
          refreshData={handleFetch}
          selectedData={selecteZone}
        ></EditWarehouseZone>
      )}
      {activeModal === "assign-storage" && (
        <AssignStorage
          onClose={closeModal}
          refreshData={handleFetch}
          selectedData={selecteZone}
        ></AssignStorage>
      )}
      <div className="section-header">
        <h2>Warehouse Zones</h2>
        <button
          className="primary-btn"
          onClick={() => openModal("add-warehouse")}
        >
          + Create Zone
        </button>
      </div>

      <div className="warehouses-grid">
        {warehouseZones.map((zone) => (
          <div key={zone.warehouse_id} className="warehouse-card">
            <div className="warehouse-header">
              <h3>{zone.zone_name}</h3>
              <span
                className={`status-badge ${zone.status
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {zone.status.toUpperCase()}
              </span>
            </div>

            <div className="warehouse-details">
              <div className="detail-row">
                <span>
                  <strong>Address:</strong>
                </span>
                <span>{zone.address}</span>
              </div>
              <div className="detail-row">
                <span>
                  <strong>Type:</strong>
                </span>
                <span>{zone.zone_type}</span>
              </div>
              <div className="detail-row">
                <span>
                  <strong>Manager:</strong>
                </span>
                <span>{zone.manager}</span>
              </div>
              <div className="detail-row">
                <span>
                  <strong>Capacity:</strong>
                </span>
                <span>
                  {zone.capacity -
                    Math.min(
                      Math.ceil(zone.total_occupancy ?? 0),
                      zone.capacity,
                    )}
                  /{zone.capacity} units
                </span>
              </div>

              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{
                    width: `${Math.min(((zone.total_occupancy ?? 0) / zone.capacity) * 100, 100)}%`,
                  }}
                ></div>
              </div>

              <div className="warehouse-actions">
                <button
                  className="action-btn"
                  onClick={() => openModal("edit-zone", zone)}
                >
                  Edit Zone
                </button>
                {zone.capacity -
                  Math.min(
                    Math.ceil(zone.total_occupancy ?? 0),
                    zone.capacity,
                  ) >
                  0 && (
                  <button
                    className="action-btn"
                    onClick={() => openModal("assign-storage", zone)}
                  >
                    Assign Storage
                  </button>
                )}
                <button
                  className="action-btn"
                  onClick={() => openModal("view-storage", zone)}
                >
                  View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default WarehouseZoneComponent;

import { useEffect, useState } from "react";
import { AddWarehouseZone } from "./Modals/AddWarehouseZone/AddWarehouseZone";
import { API } from "../../../../API_Handler/Axio_API_Handler";
import { WarehouseZone } from "./Modals/ModalDefault";
import { EditWarehouseZone } from "./Modals/EditWarehouseZone/EditWarehouseZoneModal";
interface WarehouseZoneProps {
  warehouse_id: number;
  status: string;
  zone_name: string;
  zone_type: string;
  capacity: number;
  manager: string;
}

const donations = [
  {
    id: 1,
    donor: "Red Cross Philippines",
    items: "Medical Supplies",
    quantity: 200,
    date: "2024-05-28",
    status: "Received",
  },
  {
    id: 2,
    donor: "Local Food Bank",
    items: "Rice Packs",
    quantity: 500,
    date: "2024-05-29",
    status: "Processing",
  },
  {
    id: 3,
    donor: "Community Center",
    items: "Blankets",
    quantity: 150,
    date: "2024-05-30",
    status: "Pending",
  },
];

const WarehouseZoneComponent = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [warehouseZones, setWarehouseZone] = useState<WarehouseZoneProps[]>([]);
  const [selecteZone, setSelectedZone] = useState<WarehouseZone>({
    warehouse_id: -1,
    status: "",
    zone_name: "",
    zone_type: "",
    capacity: 0,
    manager: "",
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
                <span>Type:</span>
                <span>{zone.zone_type}</span>
              </div>
              <div className="detail-row">
                <span>Manager:</span>
                <span>{zone.manager}</span>
              </div>
              <div className="detail-row">
                <span>Capacity:</span>
                <span>{zone.capacity} units</span>
              </div>

              {/* <div className="capacity-bar"> */}
              {/*   <div */}
              {/*     className="capacity-fill" */}
              {/*     style={{ */}
              {/*       width: `${(zone.occupied / zone.capacity) * 100}%`, */}
              {/*     }} */}
              {/*   ></div> */}
              {/* </div> */}

              <div className="warehouse-actions">
                <button
                  className="action-btn"
                  onClick={() => openModal("edit-zone", zone)}
                >
                  Edit Zone
                </button>
                <button className="action-btn">Assign Storage</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default WarehouseZoneComponent;

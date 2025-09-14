import { useState } from "react";
import { AddWarehouseZone } from "./Modals/AddWarehouseZone/AddWarehouseZone";
interface WarehouseZoneProps {
  id: number;
  name: string;
  capacity: number;
  occupied: number;
  type: string;
  manager: string;
  status: string;
}

const warehouseZones: WarehouseZoneProps[] = [
  {
    id: 1,
    name: "Warehouse A - Zone 1",
    capacity: 5000,
    occupied: 3200,
    type: "Food Storage",
    manager: "Juan Carlos",
    status: "Active",
  },
  {
    id: 2,
    name: "Warehouse B - Zone 2",
    capacity: 8000,
    occupied: 5600,
    type: "General Storage",
    manager: "Maria Santos",
    status: "Active",
  },
  {
    id: 3,
    name: "Medical Storage - Zone 1",
    capacity: 1500,
    occupied: 890,
    type: "Medical Supplies",
    manager: "Dr. Pedro Gomez",
    status: "Active",
  },
  {
    id: 4,
    name: "Warehouse C - Zone 3",
    capacity: 6000,
    occupied: 2100,
    type: "Clothing & Textiles",
    manager: "Ana Reyes",
    status: "Under Maintenance",
  },
];

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

const WarehouseZone = () => {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const openModal = (type: string) => {
    setActiveModal(type);
  };
  const closeModal = () => {
    setActiveModal(null);
  };
  return (
    <>
      {activeModal === "add-warehouse" && (
        <AddWarehouseZone
          onClose={closeModal}
          refreshData={() => {}}
        ></AddWarehouseZone>
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
          <div key={zone.id} className="warehouse-card">
            <div className="warehouse-header">
              <h3>{zone.name}</h3>
              <span
                className={`status-badge ${zone.status
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {zone.status}
              </span>
            </div>

            <div className="warehouse-details">
              <div className="detail-row">
                <span>Type:</span>
                <span>{zone.type}</span>
              </div>
              <div className="detail-row">
                <span>Manager:</span>
                <span>{zone.manager}</span>
              </div>
              <div className="detail-row">
                <span>Capacity:</span>
                <span>
                  {zone.occupied} / {zone.capacity} units
                </span>
              </div>

              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{
                    width: `${(zone.occupied / zone.capacity) * 100}%`,
                  }}
                ></div>
              </div>

              <div className="warehouse-actions">
                <button className="action-btn">Edit Zone</button>
                <button className="action-btn">Assign Storage</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default WarehouseZone;

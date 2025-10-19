import { defaults } from "chart.js";
import React, { useState, ChangeEvent } from "react";
import { WarehouseZone } from "../../../../procurement_inventory/Tabs/Modals/ModalDefault";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
type items = {
  item_id: number;
  item_name: string;
  quantity: number;
};
type route = {
  id: number;
  name: string;
  starting: WarehouseZone;
  items: items[];
  destination: string;

  schedule: string;
};

type DistributedItem = {
  item_id: number;
  inventory_id: number;
  item_name: string;
  quantity: number;
};

type AssignedTeam = {
  team_id: number | null;
  team_name: string | null;
};
type DistributionRoute = {
  route_id: number;
  route_name: string;
  status: string;
  schedule: string | null;
  start_location: string | null;
  assigned_team: AssignedTeam;
  end_location: string;
  distributed_items: DistributedItem[];
};
interface EditRouteProp {
  onClose: () => void;
  refreshData: () => void;
  selectedRoute: DistributionRoute;
}

export const EditRoute: React.FC<EditRouteProp> = ({
  onClose,
  refreshData,
  selectedRoute,
}) => {
  const [route, setRoute] = useState<DistributionRoute>(selectedRoute);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    // Update state dynamically by key
    setRoute((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = () => {
    const post = async () => {
      try {
        const response = await API.post("/distribution_planning/update_route", {
          route_id: route.route_id,
          status: route.status,
          schedule: route.schedule,
        });
        if (response.data) {
          refreshData();
          onClose();
        }
      } catch (e: any) {
        console.error("Error updating route: " + e);
      }
    };
    post();
  };
  const getCurrentDateTime = (): string => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:MM"
  };
  return (
    <div className="modal-overlay" style={{ zIndex: 900 }}>
      <div className="modal">
        <div className="modal-header">
          <h3>Create New Route</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">
          {selectedRoute.status !== "Pending" && (
            <div className="form-group">
              <label>Edit Status</label>
              <select
                value={route.status}
                name="status"
                onChange={handleChange}
              >
                <option value={selectedRoute.status}>
                  {selectedRoute.status}
                </option>
                {selectedRoute.status === "Assigned" && (
                  <option value="In Transit">In Transit</option>
                )}
                {selectedRoute.status === "In Transit" && (
                  <>
                    <option value="Completed">Completed</option>
                    <option value="Canceled">Canceled</option>
                  </>
                )}
              </select>
            </div>
          )}
          {selectedRoute.status !== "In Transit" && (
            <div className="form-group">
              <label>Edit Schedule</label>
              <input
                type="datetime-local"
                value={route.schedule ?? ""}
                name="schedule"
                onChange={handleChange}
                min={getCurrentDateTime()}
              />
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleSubmit}>
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

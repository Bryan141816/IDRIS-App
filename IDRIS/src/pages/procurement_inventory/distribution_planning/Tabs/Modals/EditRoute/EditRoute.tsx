import React, { useState, ChangeEvent } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";
import { DistributionRouteDTO } from "../../RoutesAndPlanning";
import Swal from "sweetalert2";
interface EditRouteProp {
  onClose: () => void;
  refreshData: () => void;
  selectedRoute: DistributionRouteDTO;
}

export const EditRoute: React.FC<EditRouteProp> = ({
  onClose,
  refreshData,
  selectedRoute,
}) => {
  const [route, setRoute] = useState<DistributionRouteDTO>(selectedRoute);

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
      const confirm = await Swal.fire({
        title: "Are you sure you want to edit this route?",
        showCancelButton: true,
        confirmButtonText: "Yes",
      });
      if (!confirm.isConfirmed) {
        return;
      }
      try {
        const response = await API.post("/distribution_planning/update_route", {
          route_id: route.route_id,
          status: route.status,
        });
        if (response.data) {
          Swal.fire({
            title: "Route has been updated",
            icon: "success",
          });

          refreshData();
          onClose();
        }
      } catch (e: any) {
        console.error("Error updating route: " + e);
      }
    };
    post();
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
                {selectedRoute.status === "Active" && (
                  <option value="In Transit">In Transit</option>
                )}
                {selectedRoute.status === "In Transit" && (
                  <>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </>
                )}
              </select>
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

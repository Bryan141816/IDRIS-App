import React, { useState, ChangeEvent } from "react";
import { DistributionRouteDTO } from "../../RoutesAndPlanning";
interface ViewRouteProp {
  onClose: () => void;
  selectedRoute: DistributionRouteDTO;
}
function formatDateTime(dateString: string): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  return date.toLocaleString("en-US", {
    month: "long", // "October"
    day: "numeric", // "16"
    year: "numeric", // "2025"
  });
}

export const ViewRoute: React.FC<ViewRouteProp> = ({
  onClose,
  selectedRoute,
}) => {
  return (
    <div className="modal-overlay" style={{ zIndex: 900 }}>
      <div className="modal" style={{ minWidth: "65vw" }}>
        <div className="modal-header">
          <h3>Create New Route</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label>Route Name:</label>
            <input value={selectedRoute.route_name} disabled />
          </div>
          <div className="form-group">
            <label>Gathering Area:</label>
            <input
              value={selectedRoute.gathering_area ?? "Not yet assigned"}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Delivery Location:</label>
            <input
              value={(function () {
                const req = selectedRoute.request;
                if (!req) return "";

                let locationName = "";

                if (req.use_different_end) {
                  if (
                    req.different_end_type === "barangay" &&
                    req.barangay?.name
                  ) {
                    locationName = `${req.barangay.name}, `;
                  } else if (
                    req.different_end_type === "evacuation" &&
                    req.evacuation_center?.name
                  ) {
                    locationName = `${req.evacuation_center.name}, `;
                  }
                } else if (req.evacuation_center?.name) {
                  locationName = `${req.evacuation_center.name}, `;
                }

                const lguName = req.lgu?.name ? `${req.lgu.name}, ` : "";

                return `${locationName}${lguName}Cebu`;
              })()}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Schedule Date:</label>
            <input
              value={`${formatDateTime(selectedRoute.start_schedule ?? "")} - ${formatDateTime(selectedRoute.end_schedule ?? "")}`}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Team:</label>
            <input
              value={
                selectedRoute.assigned_team?.team_name ?? "No team assigned yet"
              }
              disabled
            />
          </div>
          {selectedRoute.assigned_team && (
            <div className="form-group">
              <label>Team Members:</label>
              <table style={{ width: "100%" }}>
                <thead
                  style={{
                    background:
                      "linear-gradient(135deg, #749ab6 0%, #5a8aa8 100%)",
                    color: "white",
                  }}
                >
                  <tr>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Name
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Role
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedRoute.assigned_team &&
                    selectedRoute.assigned_team.team_members.length > 0 &&
                    selectedRoute.assigned_team.team_members.map((item) => (
                      <tr key={item.members_id}>
                        <td style={{ padding: "10px" }}>
                          {item.volunteer
                            ? item.volunteer.full_name
                            : "Unassigned"}
                        </td>
                        <td style={{ padding: "10px" }}>{item.role}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-group">
            <label>Distribution Items</label>
            {selectedRoute.request?.request_type === "relief" ? (
              <table style={{ width: "100%" }}>
                <thead
                  style={{
                    background:
                      "linear-gradient(135deg, #749ab6 0%, #5a8aa8 100%)",
                    color: "white",
                  }}
                >
                  <tr>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Name
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Category
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Quantity
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedRoute.distributed_items.map((item) => (
                    <tr key={item.item_id}>
                      <td style={{ padding: "10px" }}>
                        {item.relief_item?.item_name}
                      </td>
                      <td style={{ padding: "10px" }}>
                        {item.relief_item?.category}
                      </td>
                      <td style={{ padding: "10px" }}>{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: "100%" }}>
                <thead
                  style={{
                    background:
                      "linear-gradient(135deg, #749ab6 0%, #5a8aa8 100%)",
                    color: "white",
                  }}
                >
                  <tr>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Name
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Quantity
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Unit
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {selectedRoute.request?.procurement_items.map((item) => (
                    <tr key={item.item_id}>
                      <td style={{ padding: "10px" }}>{item.item_name}</td>
                      <td style={{ padding: "10px" }}>{item.quantity}</td>
                      <td style={{ padding: "10px" }}>{item.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

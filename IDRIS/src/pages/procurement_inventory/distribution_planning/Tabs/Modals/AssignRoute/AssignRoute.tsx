import { useState, useEffect } from "react";
import { API } from "../../../../../../API_Handler/Axio_API_Handler";

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
  schedule: string | null; // ISO datetime string
  start_location: string | null;
  assigned_team: AssignedTeam;
  end_location: string;
  distributed_items: DistributedItem[];
};
type Volunteer = {
  last_name: string;
  first_name: string;
};
type VolunteerRecord = {
  role: string;
  volunteer: Volunteer;
};
type TeamData = {
  team_id: number;
  team_name: string;
  team_members: VolunteerRecord[];
  deployment_area: string;
  assignment_duration: number;
  starting_date: string;
};

interface AssignRouteProp {
  onClose: () => void;
  selectedTeam: TeamData;
  refreshTable: () => void;
}

const AssignRoute: React.FC<AssignRouteProp> = ({
  onClose,
  selectedTeam,
  refreshTable,
}) => {
  const [routes, setRoutes] = useState<DistributionRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<DistributionRoute | null>(
    null,
  );

  const fetchData = async () => {
    try {
      const response = await API.get(
        "/distribution_planning/get_routes?exclude=status:Assigned",
      );
      setRoutes(response.data);
    } catch (e: any) {
      console.error("error fetching routes: " + e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRoute = (route: DistributionRoute) => {
    if (selectedRoute?.route_id === route.route_id) {
      setSelectedRoute(null);
    } else {
      setSelectedRoute(route);
    }
  };
  const handleSubmit = () => {
    const submit = async () => {
      try {
        const response = await API.post("/distribution_planning/assign_team", {
          route_id: selectedRoute?.route_id,
          team_id: selectedTeam.team_id,
        });
        refreshTable();
        onClose();
      } catch (e: any) {
        console.error("Error assigning team: " + e);
      }
    };
    submit();
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div
        className="modal"
        style={{
          zIndex: 990,
          width: "60%",
          maxWidth: "1000px",
        }}
      >
        <div className="modal-header">
          <h3>Select Route</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-content">
          {routes.length > 0 && (
            <div style={{ width: "100%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead
                  style={{
                    textAlign: "start",
                    padding: "10px",
                    backgroundColor: "#749ab6",
                    color: "white",
                  }}
                >
                  <tr>
                    <th>{"  "}</th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Name
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      From
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>To</th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Schedule
                    </th>
                    <th style={{ textAlign: "start", padding: "10px" }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {routes.map((route) => {
                    const isSelected =
                      selectedRoute?.route_id === route.route_id;
                    return (
                      <tr
                        key={route.route_id}
                        onClick={() => handleSelectRoute(route)}
                        style={{
                          backgroundColor: isSelected
                            ? "#e0f3ff" // Light blue when selected
                            : "transparent",
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRoute(route)}
                          />
                        </td>
                        <td style={{ padding: "10px" }}>{route.route_name}</td>
                        <td style={{ padding: "10px" }}>
                          {route.start_location}
                        </td>
                        <td style={{ padding: "10px" }}>
                          {route.end_location}
                        </td>
                        <td style={{ padding: "10px" }}>{route.schedule}</td>
                        <td style={{ padding: "10px" }}>{route.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-btn"
            disabled={!selectedRoute}
            onClick={handleSubmit}
          >
            Select
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignRoute;

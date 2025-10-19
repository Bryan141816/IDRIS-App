import { useEffect, useState } from "react";
import { API } from "../../../../API_Handler/Axio_API_Handler";
interface RouteLog {
  log_id: number;
  log_message: string;
  date: string; // ISO timestamp (e.g., "2025-10-16T06:03:33.182538")
}

interface Route {
  route_id: number;
  route_name: string;
  status: string; // e.g., "Assigned"
  start_location: number | string; // can be number if ID or string if name
  end_location: string;
  schedule: string; // ISO timestamp
  team: number;
  latest_log?: RouteLog; // optional in case no log exists
}

export const MovementLogsTab = () => {
  const [logs, setLogs] = useState<Route[]>([]);
  const fetchData = () => {
    const fetch = async () => {
      try {
        const response = await API.get("/distribution_planning/get_movement");
        setLogs(response.data);
      } catch (e: any) {
        console.error("Error in fetcthing logs: " + e);
      }
    };
    fetch();
  };
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <>
      <div className="movements-content">
        <div className="section-header">
          <h2>Movement Logs</h2>
          <button className="primary-btn">Export Logs</button>
        </div>

        <div className="movements-table">
          <table>
            <thead>
              <tr>
                <th>Route Name</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Schedule</th>
                <th>Team</th>
                <th>Latest Log</th>
                <th>Log Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((route) => (
                  <tr key={route.route_id}>
                    <td>{route.route_name}</td>
                    <td>
                      <span
                        className={`status-badge ${route.status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {route.status}
                      </span>
                    </td>
                    <td>{route.start_location}</td>
                    <td>{route.end_location}</td>
                    <td>
                      {route.schedule
                        ? new Date(route.schedule).toLocaleString()
                        : "—"}
                    </td>
                    <td>{route.team ?? "Unassigned"}</td>
                    <td>{route.latest_log?.log_message ?? "No logs"}</td>
                    <td>
                      {route.latest_log?.date
                        ? new Date(route.latest_log.date).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="no-data">
                    No routes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>{" "}
        </div>
        {/**/}
        {/* <div className="status-update-section"> */}
        {/*   <h3>Update Delivery Status</h3> */}
        {/*   <div className="update-form"> */}
        {/*     <select> */}
        {/*       <option>Select movement to update...</option> */}
        {/*       {movements.map((m) => ( */}
        {/*         <option key={m.id} value={m.id}> */}
        {/*           {m.item} - {m.to} */}
        {/*         </option> */}
        {/*       ))} */}
        {/*     </select> */}
        {/*     <select> */}
        {/*       <option>New Status</option> */}
        {/*       <option>Preparing</option> */}
        {/*       <option>In Transit</option> */}
        {/*       <option>Delivered</option> */}
        {/*       <option>Delayed</option> */}
        {/*     </select> */}
        {/*     <button className="primary-btn">Update Status</button> */}
        {/*   </div> */}
        {/* </div> */}
      </div>
    </>
  );
};

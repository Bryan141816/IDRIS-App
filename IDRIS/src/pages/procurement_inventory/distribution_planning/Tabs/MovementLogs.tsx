const movements = [
  {
    id: 1,
    item: "Rice Packs",
    quantity: 500,
    from: "Warehouse A",
    to: "Cebu City",
    status: "In Transit",
    time: "2 hours ago",
  },
  {
    id: 2,
    item: "Water Bottles",
    quantity: 1000,
    from: "Storage B",
    to: "Mandaue",
    status: "Delivered",
    time: "4 hours ago",
  },
  {
    id: 3,
    item: "Medical Supplies",
    quantity: 200,
    from: "Medical Center",
    to: "Lapu-Lapu",
    status: "Preparing",
    time: "1 hour ago",
  },
  {
    id: 4,
    item: "Blankets",
    quantity: 300,
    from: "Warehouse C",
    to: "Talisay",
    status: "In Transit",
    time: "30 minutes ago",
  },
];

export const MovementLogsTab = () => {
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
                <th>Item</th>
                <th>Quantity</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{movement.item}</td>
                  <td>{movement.quantity}</td>
                  <td>{movement.from}</td>
                  <td>{movement.to}</td>
                  <td>
                    <span
                      className={`status-badge ${movement.status.toLowerCase().replace(" ", "-")}`}
                    >
                      {movement.status}
                    </span>
                  </td>
                  <td>{movement.time}</td>
                  <td>
                    <button className="action-btn">Track</button>
                    <button className="action-btn">Update</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="status-update-section">
          <h3>Update Delivery Status</h3>
          <div className="update-form">
            <select>
              <option>Select movement to update...</option>
              {movements.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.item} - {m.to}
                </option>
              ))}
            </select>
            <select>
              <option>New Status</option>
              <option>Preparing</option>
              <option>In Transit</option>
              <option>Delivered</option>
              <option>Delayed</option>
            </select>
            <button className="primary-btn">Update Status</button>
          </div>
        </div>
      </div>
    </>
  );
};

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

import './distribution_palling.scss';
import { useState } from 'react';


const FinanceAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);


  // Sample data for charts
  const performanceData = [
    { name: 'Jan', delivered: 85, planned: 100 },
    { name: 'Feb', delivered: 92, planned: 100 },
    { name: 'Mar', delivered: 78, planned: 100 },
    { name: 'Apr', delivered: 95, planned: 100 },
    { name: 'May', delivered: 88, planned: 100 },
    { name: 'Jun', delivered: 97, planned: 100 }
  ];


  const deliveryStatusData = [
    { name: 'Completed', value: 68, color: '#10b981' },
    { name: 'In Progress', value: 25, color: '#fcb814' },
    { name: 'Delayed', value: 7, color: '#ef4444' }
  ];


  const routes = [
    { id: 1, name: 'Route A - Cebu City North', status: 'Active', assigned: 'Team Alpha' },
    { id: 2, name: 'Route B - Mandaue Central', status: 'Active', assigned: 'Team Beta' },
    { id: 3, name: 'Route C - Lapu-Lapu East', status: 'Pending', assigned: 'Unassigned' },
    { id: 4, name: 'Route D - Talisay West', status: 'Completed', assigned: 'Team Gamma' }
  ];


  const volunteers = [
    { id: 1, name: 'Juan Dela Cruz', role: 'Team Leader', status: 'Available', area: 'Cebu City' },
    { id: 2, name: 'Maria Santos', role: 'Volunteer', status: 'Deployed', area: 'Mandaue' },
    { id: 3, name: 'Pedro Garcia', role: 'Driver', status: 'Available', area: 'Lapu-Lapu' },
    { id: 4, name: 'Ana Reyes', role: 'Coordinator', status: 'Available', area: 'Talisay' }
  ];


  const movements = [
    { id: 1, item: 'Rice Packs', quantity: 500, from: 'Warehouse A', to: 'Cebu City', status: 'In Transit', time: '2 hours ago' },
    { id: 2, item: 'Water Bottles', quantity: 1000, from: 'Storage B', to: 'Mandaue', status: 'Delivered', time: '4 hours ago' },
    { id: 3, item: 'Medical Supplies', quantity: 200, from: 'Medical Center', to: 'Lapu-Lapu', status: 'Preparing', time: '1 hour ago' },
    { id: 4, item: 'Blankets', quantity: 300, from: 'Warehouse C', to: 'Talisay', status: 'In Transit', time: '30 minutes ago' }
  ];

  return (
    <div className="distribution-planning">
      <h3 className="public-feed-title">Distribution Planning and Monitoring</h3>


      <div className="navigation">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => setActiveTab('routes')}
        >
          🗺️ Routes & Schedules
        </button>
        <button
          className={`nav-btn ${activeTab === 'assignment' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignment')}
        >
          👥 Volunteer Assignment
        </button>
        <button
          className={`nav-btn ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          📦 Movement Logs
        </button>
      </div>

      <div className="distribution-planning-active-section">
        {activeTab === "dashboard" && <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>95%</h3>
                <p>Distribution Efficiency</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🚛</div>
              <div className="stat-info">
                <h3>12</h3>
                <p>Active Routes</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>48</h3>
                <p>Deployed Volunteers</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>2,850</h3>
                <p>Items Distributed</p>
              </div>
            </div>
          </div>


          <div className="charts-grid">
            <div className="chart-container">
              <h3>Distribution Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="planned" fill="#749ab6" name="Planned" />
                  <Bar dataKey="delivered" fill="#fcb814" name="Delivered" />
                </BarChart>
              </ResponsiveContainer>
            </div>


            <div className="chart-container">
              <h3>Delivery Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={deliveryStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {deliveryStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>}

        {activeTab == 'routes' && <div className="routes-content">
          <div className="section-header">
            <h2>Distribution Routes & Schedules</h2>
            <button className="primary-btn" onClick={() => setSelectedRoute('new')}>
              + Create New Route
            </button>
          </div>


          <div className="routes-grid">
            {routes.map(route => (
              <div key={route.id} className="route-card">
                <div className="route-header">
                  <h3>{route.name}</h3>
                  <span className={`status-badge ${route.status.toLowerCase()}`}>
                    {route.status}
                  </span>
                </div>
                <div className="route-details">
                  <p><strong>Assigned to:</strong> {route.assigned}</p>
                  <div className="route-actions">
                    <button className="secondary-btn">Edit Schedule</button>
                    <button className="primary-btn">View Details</button>
                  </div>
                </div>
              </div>
            ))}
          </div>


          {selectedRoute === 'new' && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>Create New Route</h3>
                  <button className="close-btn" onClick={() => setSelectedRoute('')}>×</button>
                </div>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Route Name</label>
                    <input type="text" placeholder="Enter route name" />
                  </div>
                  <div className="form-group">
                    <label>Start Location</label>
                    <input type="text" placeholder="Starting point" />
                  </div>
                  <div className="form-group">
                    <label>End Location</label>
                    <input type="text" placeholder="Destination" />
                  </div>
                  <div className="form-group">
                    <label>Schedule</label>
                    <input type="datetime-local" />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="secondary-btn" onClick={() => setSelectedRoute('')}>Cancel</button>
                  <button className="primary-btn">Create Route</button>
                </div>
              </div>
            </div>
          )}
        </div>}

        {activeTab == "assignment" && <div className="assignment-content">
          <div className="section-header">
            <h2>Volunteer Assignment</h2>
            <button className="primary-btn" onClick={() => setAssignmentModalOpen(true)}>
              + Assign Volunteer
            </button>
          </div>


          <div className="volunteers-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Area</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {volunteers.map(volunteer => (
                  <tr key={volunteer.id}>
                    <td>{volunteer.name}</td>
                    <td>{volunteer.role}</td>
                    <td>
                      <span className={`status-badge ${volunteer.status.toLowerCase()}`}>
                        {volunteer.status}
                      </span>
                    </td>
                    <td>{volunteer.area}</td>
                    <td>
                      <button className="action-btn">Reassign</button>
                      <button className="action-btn">Contact</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>


          {assignmentModalOpen && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>Assign Volunteer to Deployment Area</h3>
                  <button className="close-btn" onClick={() => setAssignmentModalOpen(false)}>×</button>
                </div>
                <div className="modal-content">
                  <div className="form-group">
                    <label>Select Volunteer</label>
                    <select>
                      <option>Choose volunteer...</option>
                      {volunteers.filter(v => v.status === 'Available').map(v => (
                        <option key={v.id} value={v.id}>{v.name} - {v.role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Deployment Area</label>
                    <select>
                      <option>Select area...</option>
                      <option>Cebu City North</option>
                      <option>Mandaue Central</option>
                      <option>Lapu-Lapu East</option>
                      <option>Talisay West</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Assignment Duration</label>
                    <input type="date" />
                  </div>
                </div>
                <div className="modal-actions">
                  <button className="secondary-btn" onClick={() => setAssignmentModalOpen(false)}>Cancel</button>
                  <button className="primary-btn">Assign</button>
                </div>
              </div>
            </div>
          )}
        </div>}

        { activeTab == "movements" && <div className="movements-content">
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
                {movements.map(movement => (
                  <tr key={movement.id}>
                    <td>{movement.item}</td>
                    <td>{movement.quantity}</td>
                    <td>{movement.from}</td>
                    <td>{movement.to}</td>
                    <td>
                      <span className={`status-badge ${movement.status.toLowerCase().replace(' ', '-')}`}>
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
                {movements.map(m => (
                  <option key={m.id} value={m.id}>{m.item} - {m.to}</option>
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
        </div> }
      </div>
    </div>
  );
};


export default FinanceAdmin;

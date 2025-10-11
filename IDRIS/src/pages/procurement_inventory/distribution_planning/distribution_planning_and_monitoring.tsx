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
  Cell,
} from "recharts";

import "./distribution_palling.scss";
import { useState } from "react";
import { RoutesAndPlanning } from "./Tabs/RoutesAndPlanning";
import { VolunteerAssignmentTab } from "./Tabs/VolunteerAssignmentTab";
import { MovementLogsTab } from "./Tabs/MovementLogs";
const FinanceAdmin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  // Sample data for charts
  const performanceData = [
    { name: "Jan", delivered: 85, planned: 100 },
    { name: "Feb", delivered: 92, planned: 100 },
    { name: "Mar", delivered: 78, planned: 100 },
    { name: "Apr", delivered: 95, planned: 100 },
    { name: "May", delivered: 88, planned: 100 },
    { name: "Jun", delivered: 97, planned: 100 },
  ];

  const deliveryStatusData = [
    { name: "Completed", value: 68, color: "#10b981" },
    { name: "In Progress", value: 25, color: "#fcb814" },
    { name: "Delayed", value: 7, color: "#ef4444" },
  ];

  const routes = [
    {
      id: 1,
      name: "Route A - Cebu City North",
      status: "Active",
      assigned: "Team Alpha",
    },
    {
      id: 2,
      name: "Route B - Mandaue Central",
      status: "Active",
      assigned: "Team Beta",
    },
    {
      id: 3,
      name: "Route C - Lapu-Lapu East",
      status: "Pending",
      assigned: "Unassigned",
    },
    {
      id: 4,
      name: "Route D - Talisay West",
      status: "Completed",
      assigned: "Team Gamma",
    },
  ];

  const volunteers = [
    {
      id: 1,
      name: "Juan Dela Cruz",
      role: "Team Leader",
      status: "Available",
      area: "Cebu City",
    },
    {
      id: 2,
      name: "Maria Santos",
      role: "Volunteer",
      status: "Deployed",
      area: "Mandaue",
    },
    {
      id: 3,
      name: "Pedro Garcia",
      role: "Driver",
      status: "Available",
      area: "Lapu-Lapu",
    },
    {
      id: 4,
      name: "Ana Reyes",
      role: "Coordinator",
      status: "Available",
      area: "Talisay",
    },
  ];

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

  return (
    <div className="distribution-planning">
      <h3 className="public-feed-title">
        Distribution Planning and Monitoring
      </h3>

      <div className="navigation">
        <button
          className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === "routes" ? "active" : ""}`}
          onClick={() => setActiveTab("routes")}
        >
          🗺️ Routes & Schedules
        </button>
        <button
          className={`nav-btn ${activeTab === "assignment" ? "active" : ""}`}
          onClick={() => setActiveTab("assignment")}
        >
          👥 Volunteer Assignment
        </button>
        <button
          className={`nav-btn ${activeTab === "movements" ? "active" : ""}`}
          onClick={() => setActiveTab("movements")}
        >
          📦 Movement Logs
        </button>
      </div>

      <div className="distribution-planning-active-section">
        {activeTab === "dashboard" && (
          <div className="dashboard-content">
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
          </div>
        )}

        {activeTab == "routes" && <RoutesAndPlanning></RoutesAndPlanning>}

        {activeTab == "assignment" && (
          <VolunteerAssignmentTab></VolunteerAssignmentTab>
        )}

        {activeTab == "movements" && <MovementLogsTab></MovementLogsTab>}
      </div>
    </div>
  );
};

export default FinanceAdmin;

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
import { useState, useEffect } from "react";
import { RoutesAndPlanning } from "./Tabs/RoutesAndPlanning";

import { API } from "../../../API_Handler/Axio_API_Handler";

type DashboardData = {
  total_route: number;
  active_route: number;
  in_transit: number;
  pending_routes: number;
  deployed_volunteers: number;
  items_distributed: number;
  distribution_performance: {
    month: string;
    total_routes: number;
    completed_routes: number;
  }[];
  delivery_status: {
    "In Transit": number;
    Completed: number;
    Cancelled: number;
  };
};

const FinanceAdmin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [deliveryStatusData, setDeliveryStatusData] = useState<
    { name: string; value: number; color: string }[]
  >([]);

  const statusColors: Record<string, string> = {
    "In Transit": "#fcb814",
    Completed: "#10b981",
    Cancelled: "#ef4444",
  };

  const fetch = async () => {
    try {
      const response = await API.get("/distribution_planning/get_dashboard");

      const data = response.data;
      setDashboardData(data);

      const chartData = [
        {
          name: "In Transit",
          value: data.delivery_status["In Transit"],
          color: "#fcb814",
        },
        {
          name: "Completed",
          value: data.delivery_status.Completed,
          color: "#10b981",
        },
        {
          name: "Cancelled",
          value: data.delivery_status.Cancelled,
          color: "#ef4444",
        },
      ];

      setDeliveryStatusData(chartData);
    } catch (e: any) {
      if (e.message) {
        console.error(
          "Error fetching distribution planning dashboard: " + e.message,
        );
      }
    }
  };
  useEffect(() => {
    fetch();
  }, []);
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetch();
    }
  }, [activeTab]);
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
      </div>

      <div className="distribution-planning-active-section">
        {activeTab === "dashboard" && (
          <div className="dashboard-content">
            <div className="stats-grid-new">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>
                    {dashboardData?.total_route
                      ? dashboardData.total_route
                      : "0"}
                  </h3>
                  <p>Total Route</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚚</div>
                <div className="stat-info">
                  <h3>
                    {dashboardData?.active_route
                      ? dashboardData.active_route
                      : "0"}
                  </h3>
                  <p>Active Route</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-info">
                  <h3>
                    {dashboardData?.pending_routes
                      ? dashboardData.pending_routes
                      : "0"}
                  </h3>
                  <p>Pending Route</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚛</div>
                <div className="stat-info">
                  <h3>
                    {dashboardData?.in_transit ? dashboardData.in_transit : "0"}
                  </h3>
                  <p>In Transit</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>
                    {dashboardData?.deployed_volunteers
                      ? dashboardData.deployed_volunteers
                      : "0"}
                  </h3>
                  <p>Deployed Volunteers</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>
                    {" "}
                    {dashboardData?.items_distributed
                      ? dashboardData.items_distributed
                      : "0"}
                  </h3>
                  <p>Items Distributed</p>
                </div>
              </div>
            </div>

            <div className="charts-grid">
              <div className="chart-container">
                <h3>Distribution Performance</h3>
                {dashboardData?.distribution_performance ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashboardData?.distribution_performance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="total_routes"
                        fill="#749ab6"
                        name="Planned"
                      />
                      <Bar
                        dataKey="completed_routes"
                        fill="#fcb814"
                        name="Delivered"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  "No Data"
                )}
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
      </div>
    </div>
  );
};

export default FinanceAdmin;

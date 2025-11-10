import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "../ProcurementInventory.scss";
import "../ProcurementModal.scss";
import { useState, useEffect } from "react";
import { RoutesAndPlanning } from "./Tabs/RoutesAndPlanning";
import { useNavigate, useParams } from "react-router-dom";
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
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
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
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    navigate(`/procurement_inventory/distribution_planning/${newTab}`, {
      replace: false,
    });
  };

  const renderDashboard = () => {
    return (
      <>
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>
                  {dashboardData?.total_route ? dashboardData.total_route : "0"}
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

          <div className="dashboard-grid">
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
                    <Bar dataKey="total_routes" fill="#749ab6" name="Planned" />
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
                    data={deliveryStatusData.filter((entry) => entry.value > 0)} // filter out zero values
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {deliveryStatusData
                      .filter((entry) => entry.value > 0) // also filter for the cells
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </>
    );
  };
  return (
    <div className="procurement-management">
      <h3 className="public-feed-title">PROCUREMENT MANAGEMENT</h3>
      <div className="procurement-navigation">
        <button
          className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => handleTabChange("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === "routes" ? "active" : ""}`}
          onClick={() => handleTabChange("routes")}
        >
          🗺️ Routes & Schedules
        </button>
      </div>

      <div className="procurement-mains-content">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "routes" && <RoutesAndPlanning></RoutesAndPlanning>}
      </div>
    </div>
  );
};

export default FinanceAdmin;

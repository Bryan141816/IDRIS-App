import React, { useState, useEffect } from "react";
import "./ProcurementManagement.scss";
import RequestTab from "./Tabs/Request";
import { formatCurrency } from "./Tabs/Modals/ProcurementDefaults";
import { API } from "../../../API_Handler/Axio_API_Handler";
const ProcurementManagement = () => {
  type RequestCounts = {
    total_requests: number;
    total_pending: number;
    total_approved: number;
    total_value: number;
    resource_usage: {
      category: string;
      used: number;
      percentage: number;
    }[];
  };

  const [activeTab, setActiveTab] = useState("dashboard");
  const [requestCounterData, setRequestCounterData] =
    useState<RequestCounts | null>(null);

  const getDashboardData = async () => {
    try {
      const response = await API.get(
        "/procurement_management/get_dashboard_data",
      );
      const requestData: RequestCounts = response.data;
      setRequestCounterData(requestData);
    } catch (e: any) {
      console.error(e);
    }
  };
  useEffect(() => {
    getDashboardData();
  }, []);
  const resourceUsage = [
    {
      category: "Medical Supplies",
      allocated: 500000,
      used: 325000,
      percentage: 65,
    },
    {
      category: "Equipment",
      allocated: 800000,
      used: 480000,
      percentage: 60,
    },
    {
      category: "Transportation",
      allocated: 1200000,
      used: 720000,
      percentage: 60,
    },
    {
      category: "Office Supplies",
      allocated: 150000,
      used: 45000,
      percentage: 30,
    },
  ];
  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>
              {" "}
              {requestCounterData
                ? requestCounterData.total_requests
                : "loading data"}
            </h3>
            <p>Total Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>
              {" "}
              {requestCounterData
                ? requestCounterData.total_pending
                : "loading data"}
            </h3>
            <p>Pending Approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>
              {requestCounterData
                ? requestCounterData.total_approved
                : "loading data"}
            </h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>
              {requestCounterData
                ? formatCurrency(requestCounterData.total_value)
                : "loading data"}
            </h3>
            <p>Total Value</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3>Resource Usage Overview</h3>
          <div className="resource-usage">
            {requestCounterData?.resource_usage.map((resource, index) => (
              <div key={index} className="resource-item">
                <div className="resource-info">
                  <span className="resource-category">{resource.category}</span>
                  <span className="resource-amounts">
                    {formatCurrency(resource.used)} /{" "}
                    {formatCurrency(requestCounterData?.total_value)}
                  </span>
                </div>
                <div className="resource-bar">
                  <div
                    className="resource-fill"
                    style={{ width: `${resource.percentage}%` }}
                  ></div>
                </div>
                <div className="resource-percentage">
                  {resource.percentage}% utilized
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h3>Recent Notifications</h3>
          <div className="notifications-list">
            {/* {notifications.map((notification) => ( */}
            {/*   <div */}
            {/*     key={notification.id} */}
            {/*     className={`notification-item ${notification.read ? "read" : "unread"}`} */}
            {/*   > */}
            {/*     <div className="notification-content"> */}
            {/*       <div className={`notification-type ${notification.type}`}> */}
            {/*         {notification.type === "approval_required" && "⚠️"} */}
            {/*         {notification.type === "status_update" && "📋"} */}
            {/*         {notification.type === "rejection" && "❌"} */}
            {/*       </div> */}
            {/*       <div className="notification-text"> */}
            {/*         <p>{notification.message}</p> */}
            {/*         <small>{notification.timestamp}</small> */}
            {/*       </div> */}
            {/*     </div> */}
            {/*   </div> */}
            {/* ))} */}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="procurement-management">
      <h3 className="public-feed-title">PROCUREMENT MANAGEMENT</h3>
      <div className="navigation">
        <button
          className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          📋 Requests
        </button>

        <button
          className={`nav-btn ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          🔔 Notifications
        </button>
      </div>

      <div className="mains-content">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "requests" && <RequestTab></RequestTab>}
      </div>
    </div>
  );
};

export default ProcurementManagement;

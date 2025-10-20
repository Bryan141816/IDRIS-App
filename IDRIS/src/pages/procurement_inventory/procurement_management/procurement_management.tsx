import React, { useState, useEffect } from "react";
import "./ProcurementManagement.scss";
import RequestTab from "./Tabs/Request";
import { formatCurrency } from "./Tabs/Modals/ProcurementDefaults";
import { API } from "../../../API_Handler/Axio_API_Handler";
import { useNavigate, useParams } from "react-router-dom";
export function formatDatePretty(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long", // e.g. October
    day: "numeric", // e.g. 20
  });
}
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
    recent_notification: {
      notification_id: number;
      from_origin: string;
      title: string;
      message: string;
      url_redirect: string;
      date: string; // ISO string
      isRead: boolean;
      to: string;
    }[];
  };

  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState(tab || "dashboard");
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

  // Keep state in sync with URL
  useEffect(() => {
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [tab]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    navigate(`/procurement_inventory/procurement_management/${newTab}`, {
      replace: false,
    });
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>
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
            <div className="expiry-alerts">
              {requestCounterData?.recent_notification.map((item) => (
                <div key={item.notification_id} className={`expiry-item good`}>
                  <div className="expiry-info">
                    <strong>{item.title}</strong>
                    <span>Message: {item.message}</span>
                    <span>Date: {formatDatePretty(item.date)}</span>
                  </div>
                </div>
              ))}
            </div>
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
          onClick={() => handleTabChange("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => handleTabChange("requests")}
        >
          📋 Requests
        </button>
      </div>

      <div className="mains-content">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "requests" && (
          <RequestTab apiUrl="/procurement_management" />
        )}
      </div>
    </div>
  );
};

export default ProcurementManagement;

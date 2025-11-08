import React, { useState, useEffect } from "react";
import "../ProcurementInventory.scss";
import "../ProcurementModal.scss";
import "./ProcurementManagement.scss";
import RequestTab from "./Tabs/Request";
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
    total: number;
    pending: number;
    approved: number;

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
              {requestCounterData ? requestCounterData.total : "loading data"}
            </h3>
            <p>Total Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>
              {requestCounterData ? requestCounterData.pending : "loading data"}
            </h3>
            <p>Pending Approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>
              {requestCounterData
                ? requestCounterData.approved
                : "loading data"}
            </h3>
            <p>Approved</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="chart-container">
          <h3>Recent Activity</h3>
          <div className="notifications-list">
            <div className="expiry-alerts">
              {/* {requestCounterData?.recent_notification.map((item) => ( */}
              {/*   <div key={item.notification_id} className={`expiry-item good`}> */}
              {/*     <div className="expiry-info"> */}
              {/*       <strong>{item.title}</strong> */}
              {/*       <span>Message: {item.message}</span> */}
              {/*       <span>Date: {formatDatePretty(item.date)}</span> */}
              {/*     </div> */}
              {/*   </div> */}
              {/* ))} */}
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

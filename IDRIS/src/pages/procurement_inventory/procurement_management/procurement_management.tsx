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
  type ProcurementRequestLog = {
    log_id: number;
    log_type: string;
    log_message: string;
    date_created: string; // ISO datetime string from backend
  };
  type RequestCounts = {
    total: number;
    pending: number;
    approved: number;
    recent_log: ProcurementRequestLog[];
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
  type LogType =
    | "Created"
    | "Moved to Budget Approval"
    | "Rejected"
    | "Approved";
  const styleMap: Record<LogType, { bg: string; color: string }> = {
    Created: { bg: "#e8f5e9", color: "#2e7d32" }, // green
    "Moved to Budget Approval": { bg: "#e3f2fd", color: "#1565c0" }, // blue
    Approved: { bg: "#e8f5e9", color: "#2e7d32" }, // green
    Rejected: { bg: "#ffebee", color: "#c62828" }, // red
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

          {requestCounterData?.recent_log &&
          requestCounterData.recent_log.length > 0 ? (
            (() => {
              // 🎨 Define colors for each log type
              const styleMap: Record<
                string,
                {
                  bg: string;
                  badgeBg: string;
                  badgeText: string;
                  border: string;
                }
              > = {
                Added: {
                  bg: "rgba(46, 125, 50, 0.1)", // light green background
                  badgeBg: "#2e7d32", // dark green badge
                  badgeText: "#ffffff",
                  border: "#2e7d32",
                },
                "Moved to Budget Approval": {
                  bg: "rgba(21, 101, 192, 0.1)", // light blue background
                  badgeBg: "#1565c0",
                  badgeText: "#ffffff",
                  border: "#1565c0",
                },
                Approved: {
                  bg: "rgba(56, 142, 60, 0.1)", // soft green background
                  badgeBg: "#388e3c",
                  badgeText: "#ffffff",
                  border: "#388e3c",
                },
                Rejected: {
                  bg: "rgba(198, 40, 40, 0.1)", // light red background
                  badgeBg: "#c62828",
                  badgeText: "#ffffff",
                  border: "#c62828",
                },
              };

              return requestCounterData.recent_log.map((log, index) => {
                const style = styleMap[log.log_type] || {
                  bg: "rgba(158, 158, 158, 0.1)",
                  badgeBg: "#9e9e9e",
                  badgeText: "#ffffff",
                  border: "#9e9e9e",
                };

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      background: style.bg,
                      padding: "20px",
                      borderRadius: "10px",
                      border: `1px solid ${style.border}`,
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <strong
                        style={{
                          color: style.badgeText,
                          background: style.badgeBg,
                          padding: "10px 16px",
                          borderRadius: "20px",
                          fontWeight: 600,
                        }}
                      >
                        {log.log_type}
                      </strong>
                      <span>{formatDatePretty(log.date_created)}</span>
                    </span>
                    <span>{log.log_message}</span>
                  </div>
                );
              });
            })()
          ) : (
            <p>No recent activity</p>
          )}
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

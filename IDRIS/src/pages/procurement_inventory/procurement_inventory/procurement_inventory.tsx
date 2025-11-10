import React, { act, useEffect, useState } from "react";
import "../ProcurementInventory.scss";
import "../ProcurementModal.scss";
import "./procurement_inventory.scss";
import WarehouseZone from "./Tabs/Warehousezones";
import InventoryItems from "./Tabs/InventoryItems";
import { API } from "../../../API_Handler/Axio_API_Handler";
import Donations from "./Tabs/Donations";
const FinanceAdmin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  interface InventoryDashboard {
    available_inventory_items: number;
    active_zones: number;
    available_inkind_items: number;
    stock_level: StockLevel;
    expiry_alert: ExpiryAlertItem[];
  }

  interface StockLevel {
    clothing: number;
    food: number;
    medical: number;
    beverages: number;
  }

  interface ExpiryAlertItem {
    inventory_id: number;
    quantity: number;
    category: string;
    expiry: string; // ISO date string
    status: string;
    item_name: string;
    location: number | null;
    batch: string;
  }

  interface InventoryItemProps {
    id: number | string;
    name: string;
    quantity: number;
    category: string;
    location: string;
    batch: string;
    expiry?: string | null | undefined | Date;
    status: string;
  }

  interface WarehouseZoneProps {
    id: number;
    name: string;
    capacity: number;
    occupied: number;
    type: string;
    manager: string;
    status: string;
  }

  const getStockStatus = (quantity: number = 0) => {
    if (quantity < 50) return "critical";
    if (quantity < 200) return "low";
    return "good";
  };

  const getExpiryStatus = (expiry?: string | null): string => {
    if (!expiry) return "no-expiry"; // handles null, undefined, empty string

    // Now expiry is definitely a string, safe to pass to new Date()
    const expiryDate = new Date(expiry);

    if (isNaN(expiryDate.getTime())) return "invalid-date";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0) return "expired";
    if (daysUntilExpiry <= 30) return "expiring-soon";
    return "good";
  };

  const [dashboardData, setDashboardData] = useState<InventoryDashboard | null>(
    null,
  );
  const fetch = async () => {
    try {
      const response = await API.get("/procurement_inventory/get_dashboard");
      setDashboardData(response.data);
    } catch (e: any) {
      console.error("Error fetching inventory dashboard: " + e);
    }
  };
  const renderDashboard = () => {
    return (
      <>
        <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>
                  {dashboardData?.available_inventory_items
                    ? dashboardData.available_inventory_items
                    : "0"}
                </h3>
                <p>Total Items</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-info">
                <h3>
                  {dashboardData?.active_zones
                    ? dashboardData.active_zones
                    : "0"}
                </h3>
                <p>Active Zones</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎁</div>
              <div className="stat-info">
                <h3>
                  {dashboardData?.available_inkind_items
                    ? dashboardData.available_inkind_items
                    : "0"}
                </h3>
                <p>Recent Donations</p>
              </div>
            </div>
          </div>

          <div className="dashboard-grid">
            <div className="chart-container">
              <h3>Stock Levels Overview</h3>
              {dashboardData ? (
                <div className="stock-overview">
                  {Object.entries(dashboardData?.stock_level ?? {}).map(
                    ([category, quantity]) => (
                      <div className="stock-item">
                        <div className="item-info">
                          <span className="item-name">
                            {toLetterCase(category)}
                          </span>
                          <span className="item-quantity">{quantity}x</span>
                        </div>
                        <div className="stock-bar">
                          <div
                            className={`stock-fill ${getStockStatus(quantity)}`}
                            style={{
                              width: `${Math.min((quantity / dashboardData?.available_inventory_items) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                "No Data"
              )}
            </div>

            <div className="chart-container">
              <h3>Expiry Alert Dashboard</h3>
              <div className="expiry-alerts">
                {dashboardData?.expiry_alert.map((item) => (
                  <div
                    key={item.inventory_id}
                    className={`expiry-item ${getExpiryStatus(item.expiry)}`}
                  >
                    <div className="expiry-info">
                      <strong>{item.item_name}</strong>
                      <span>Batch: {item.batch}</span>
                      <span>
                        Expires:{" "}
                        {item.expiry
                          ? new Date(item.expiry).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div
                      className={`expiry-status ${getExpiryStatus(item.expiry)}`}
                    >
                      {getExpiryStatus(item.expiry)
                        .replace("-", " ")
                        .toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  useEffect(() => {
    fetch();
  }, []);
  useEffect(() => {
    if (activeTab === "dashboard") {
      fetch();
    }
  }, [activeTab]);
  const toLetterCase = (text: string): string => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  return (
    <div className="procurement-management">
      <h3 className="public-feed-title">Inventory & Warehousing System</h3>

      <div className="procurement-navigation">
        <button
          className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          📦 Inventory
        </button>
        <button
          className={`nav-btn ${activeTab === "warehouses" ? "active" : ""}`}
          onClick={() => setActiveTab("warehouses")}
        >
          🏢 Warehouse Zones
        </button>
        <button
          className={`nav-btn ${activeTab === "donations" ? "active" : ""}`}
          onClick={() => setActiveTab("donations")}
        >
          🎁 Donations
        </button>
      </div>

      <div className="procurement-mains-content">
        {activeTab == "dashboard" && renderDashboard()}
        {activeTab == "inventory" && <InventoryItems></InventoryItems>}
        {activeTab == "warehouses" && <WarehouseZone></WarehouseZone>}
        {activeTab == "donations" && <Donations></Donations>}
      </div>
    </div>
  );
};

export default FinanceAdmin;

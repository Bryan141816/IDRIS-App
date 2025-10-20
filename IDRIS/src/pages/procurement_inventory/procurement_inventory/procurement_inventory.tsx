import React, { act, useEffect, useState } from "react";
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

  // Sample inventory data
  const inventoryItems: InventoryItemProps[] = [
    {
      id: 1,
      name: "Rice Packs",
      quantity: 1250,
      category: "Food",
      location: "Warehouse A - Zone 1",
      expiry: "2024-08-15",
      batch: "RC-2024-001",
      status: "In Stock",
    },
    {
      id: 2,
      name: "Water Bottles",
      quantity: 3500,
      category: "Beverages",
      location: "Warehouse B - Zone 2",
      expiry: "2025-12-30",
      batch: "WB-2024-045",
      status: "In Stock",
    },
    {
      id: 3,
      name: "Medical Supplies",
      quantity: 85,
      category: "Medical",
      location: "Medical Storage - Zone 1",
      expiry: "2024-06-20",
      batch: "MS-2024-012",
      status: "Low Stock",
    },
    {
      id: 4,
      name: "Blankets",
      quantity: 450,
      category: "Clothing",
      location: "Warehouse C - Zone 3",
      expiry: null,
      batch: "BL-2024-008",
      status: "In Stock",
    },
    {
      id: 5,
      name: "First Aid Kits",
      quantity: 12,
      category: "Medical",
      location: "Medical Storage - Zone 2",
      expiry: "2024-07-10",
      batch: "FA-2024-003",
      status: "Critical",
    },
  ];

  interface WarehouseZoneProps {
    id: number;
    name: string;
    capacity: number;
    occupied: number;
    type: string;
    manager: string;
    status: string;
  }

  const warehouseZones: WarehouseZoneProps[] = [
    {
      id: 1,
      name: "Warehouse A - Zone 1",
      capacity: 5000,
      occupied: 3200,
      type: "Food Storage",
      manager: "Juan Carlos",
      status: "Active",
    },
    {
      id: 2,
      name: "Warehouse B - Zone 2",
      capacity: 8000,
      occupied: 5600,
      type: "General Storage",
      manager: "Maria Santos",
      status: "Active",
    },
    {
      id: 3,
      name: "Medical Storage - Zone 1",
      capacity: 1500,
      occupied: 890,
      type: "Medical Supplies",
      manager: "Dr. Pedro Gomez",
      status: "Active",
    },
    {
      id: 4,
      name: "Warehouse C - Zone 3",
      capacity: 6000,
      occupied: 2100,
      type: "Clothing & Textiles",
      manager: "Ana Reyes",
      status: "Under Maintenance",
    },
  ];

  const donations = [
    {
      id: 1,
      donor: "Red Cross Philippines",
      items: "Medical Supplies",
      quantity: 200,
      date: "2024-05-28",
      status: "Received",
    },
    {
      id: 2,
      donor: "Local Food Bank",
      items: "Rice Packs",
      quantity: 500,
      date: "2024-05-29",
      status: "Processing",
    },
    {
      id: 3,
      donor: "Community Center",
      items: "Blankets",
      quantity: 150,
      date: "2024-05-30",
      status: "Pending",
    },
  ];

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

  type ItemType =
    | string
    | InventoryItemProps
    | WarehouseZoneProps
    | {
        id: number;
        donor: string;
        items: string;
        quantity: number;
        date: string;
        status: string;
      }
    | null; // updated to include donation object

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
    <div className="inventory-warehousing">
      <h3 className="public-feed-title">Inventory & Warehousing System</h3>

      <div className="navigation">
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

      <div className="procurement-inventory-active-section">
        {activeTab == "dashboard" && (
          <div className="dashboard-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>
                    {dashboardData?.available_inventory_items
                      ? dashboardData.available_inventory_items
                      : "No Data"}
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
                      : "No Data"}
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
                      : "No Data"}
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
        )}
        {activeTab == "inventory" && <InventoryItems></InventoryItems>}
        {activeTab == "warehouses" && <WarehouseZone></WarehouseZone>}
        {activeTab == "donations" && <Donations></Donations>}
      </div>
    </div>
  );
};

export default FinanceAdmin;

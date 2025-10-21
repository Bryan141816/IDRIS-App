import { Link, useNavigate } from "react-router-dom";
import "./DefaultListViewStyle.scss";
import { useUserRoleContext } from "../../UserRoleContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faListUl,
  faExclamationTriangle,
  faUsers,
  faChevronDown,
  faChevronUp,
  faMapMarkerAlt,
  faClock,
  faFileAlt,
  faPrint,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, useRef } from "react";
import { fetchData } from "../../API_Handler/response_dashboard";

import { MapContainer, TileLayer, Marker, useMap, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./ResponseDashboard.scss";
import { API } from "../../API_Handler/Axio_API_Handler";

interface MapPinBase {
  id: string;
  type: "demand";
  label: string;
  lat: number;
  lng: number;
  address: string;
  last_updated: string;
}

interface DemandPin extends MapPinBase {
  contact: {
    name: string;
    phone: string;
  };
  status: "no response" | "responded" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  submitted_at: string;
  needs: {
    id: number;
    need: string;
    amount: number | "critical";
  }[];
}

type MapPin = DemandPin;

// New type for recent map activity
type RecentMapActivity = {
  id: string;
  timestamp: string;
  activity_type:
    | "new_request"
    | "response_dispatched"
    | "completed"
    | "status_update";
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  priority: "low" | "medium" | "high" | "urgent";
  description: string;
  assigned_team?: string;
  status: "no response" | "responded" | "completed";
};

// Company/Organization Information Interface
interface CompanyInfo {
  name: string;
  tagline: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  contact: {
    phone: string;
    email: string;
  };
}

// Report Data Interface
interface ReportData {
  period: string;
  dateRange: string;
  companyInfo: CompanyInfo;
  reportTitle: string;
  generatedDate: string;
  summary: {
    totalIncidents: number;
    activeIncidents: number;
    completedIncidents: number;
    avgResponseTime: number;
    totalStaffDeployed: number;
    totalResourcesDistributed: number;
  };
  incidentsByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  incidentsByStatus: {
    noResponse: number;
    responded: number;
    completed: number;
  };
  resourceDistribution: {
    food: number;
    medical: number;
    clothing: number;
    beverages: number;
    hygiene: number;
  };
  topIncidentLocations: Array<{
    location: string;
    count: number;
    avgResponseTime: number;
  }>;
  performanceMetrics: {
    responseTimeTarget: number;
    responseTimeAchieved: number;
    completionRate: number;
    staffUtilization: number;
  };
}

const getIconByStatus = (status: DemandPin["status"]) => {
  let iconUrl = "";
  let iconColor = "#6c757d"; // Default gray

  if (status === "no response") {
    iconColor = "#dc3545"; // Red for urgent/no response
  } else if (status === "responded") {
    iconColor = "#ffc107"; // Yellow for responded
  } else if (status === "completed") {
    iconColor = "#28a745"; // Green for completed
  }

  // Create a custom pin-shaped marker
  const svgIcon = `
    <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Pin shadow -->
      <ellipse cx="16" cy="37" rx="4" ry="2" fill="rgba(0,0,0,0.2)"/>

      <!-- Pin body -->
      <path d="M16 1C8.82 1 3 6.82 3 14C3 23 16 38 16 38S29 23 29 14C29 6.82 23.18 1 16 1Z"
            fill="${iconColor}"
            stroke="white"
            stroke-width="2"/>

      <!-- Inner circle -->
      <circle cx="16" cy="14" r="6" fill="white"/>

      <!-- Status indicator dot -->
      <circle cx="16" cy="14" r="3" fill="${iconColor}"/>

      <!-- Small status icon based on status -->
      ${
        status === "no response"
          ? `<text x="16" y="18" text-anchor="middle" fill="white" font-size="8" font-weight="bold">!</text>`
          : status === "responded"
            ? `<circle cx="16" cy="14" r="1.5" fill="white"/>`
            : `<path d="M13 14L15 16L19 12" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      }
    </svg>
  `;

  return L.divIcon({
    html: svgIcon,
    className: "custom-pin-marker",
    iconSize: [32, 40],
    iconAnchor: [16, 38], // Point of the pin
    popupAnchor: [0, -38], // Popup appears above the pin
  });
};

const FitBounds: React.FC<{ markers: MapPin[] }> = ({ markers }) => {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [markers, map]);

  return null;
};

const MapView: React.FC<{
  center?: [number, number];
  markers: MapPin[];
  fitBounds?: boolean;
}> = ({ center = [0, 0], markers, fitBounds = false }) => (
  <div style={{ position: "relative", height: "100%", width: "100%" }}>
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: "100%", width: "100%" }}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
      />
      {fitBounds && <FitBounds markers={markers} />}
      {markers.map((point, index) => (
        <Marker
          key={point.id}
          position={[point.lat, point.lng]}
          icon={getIconByStatus(point.status)}
        >
          <Popup>
            <div style={{ minWidth: "200px" }}>
              <h4 style={{ margin: "0 0 8px 0", color: "#495057" }}>
                {point.label}
              </h4>
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                <strong>Status:</strong>{" "}
                <span
                  style={{
                    color:
                      point.status === "completed"
                        ? "#28a745"
                        : point.status === "responded"
                          ? "#ffc107"
                          : "#dc3545",
                  }}
                >
                  {point.status}
                </span>
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                <strong>Priority:</strong>{" "}
                <span
                  style={{
                    color:
                      point.priority === "urgent"
                        ? "#dc3545"
                        : point.priority === "high"
                          ? "#fd7e14"
                          : point.priority === "medium"
                            ? "#ffc107"
                            : "#28a745",
                  }}
                >
                  {point.priority}
                </span>
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                <strong>Address:</strong> {point.address}
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.9rem" }}>
                <strong>Contact:</strong> {point.contact.name} (
                {point.contact.phone})
              </p>
              {point.needs && point.needs.length > 0 && (
                <div style={{ marginTop: "8px" }}>
                  <strong style={{ fontSize: "0.9rem" }}>Needs:</strong>
                  <ul
                    style={{
                      margin: "4px 0",
                      paddingLeft: "16px",
                      fontSize: "0.8rem",
                    }}
                  >
                    {point.needs.slice(0, 3).map((need) => (
                      <li key={need.id}>
                        {need.need}: {need.amount}
                      </li>
                    ))}
                    {point.needs.length > 3 && (
                      <li>... and {point.needs.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>

    {/* Legend Overlay */}
    <div
      style={{
        position: "absolute",
        bottom: "10px",
        right: "10px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        padding: "12px 16px",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "1px solid rgba(0, 0, 0, 0.1)",
        zIndex: 1000,
        fontSize: "0.85rem",
        minWidth: "160px",
      }}
    >
      <div
        style={{
          fontWeight: "600",
          marginBottom: "8px",
          color: "#495057",
          fontSize: "0.9rem",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <FontAwesomeIcon icon={faMapMarkerAlt} style={{ color: "#6c757d" }} />
        Status Legend
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {/* No Response */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#dc3545",
              border: "2px solid white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}
          ></div>
          <span style={{ color: "#495057", fontSize: "0.8rem" }}>
            No Response
          </span>
        </div>

        {/* Responded */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#ffc107",
              border: "2px solid white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}
          ></div>
          <span style={{ color: "#495057", fontSize: "0.8rem" }}>
            Responded
          </span>
        </div>

        {/* Completed */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#28a745",
              border: "2px solid white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}
          ></div>
          <span style={{ color: "#495057", fontSize: "0.8rem" }}>
            Completed
          </span>
        </div>
      </div>

      {/* Separator line */}
      <div
        style={{
          height: "1px",
          backgroundColor: "#e9ecef",
          margin: "8px 0",
        }}
      ></div>

      {/* Summary stats */}
      <div
        style={{
          fontSize: "0.75rem",
          color: "#6c757d",
          lineHeight: "1.4",
        }}
      >
        <div>Total Points: {markers.length}</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "2px",
          }}
        >
          <span>
            Active: {markers.filter((m) => m.status !== "completed").length}
          </span>
          <span>
            Done: {markers.filter((m) => m.status === "completed").length}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Report Header Component following the exact finance report design
const ReportHeader: React.FC<{
  companyInfo: CompanyInfo;
  reportTitle: string;
  reportPeriod: string;
  generatedDate: string;
  totalRecords?: number;
}> = ({
  companyInfo,
  reportTitle,
  reportPeriod,
  generatedDate,
  totalRecords = 0,
}) => {
  return (
    <div className="report-header-finance">
      {/* Top section with logo/company on left, contact info on right */}
      <div className="horizontal-flex">
        <div className="company-branding">
          <div className="company-logo">
            🚨 {/* Replace with actual emergency services logo */}
          </div>
          <div className="company-title">
            <h1 className="company-name">{companyInfo.name}</h1>
            <p className="company-tagline">{companyInfo.tagline}</p>
          </div>
        </div>

        <div className="company-info">
          <p className="company-legal-name">{companyInfo.name}</p>
          <p>{companyInfo.address.street}</p>
          <p>
            {companyInfo.address.city}, {companyInfo.address.state}{" "}
            {companyInfo.address.zip}
          </p>
          <p>Phone: {companyInfo.contact.phone}</p>
          <p>Email: {companyInfo.contact.email}</p>
        </div>
      </div>

      {/* Report info section */}
      <div className="report-info">
        <h2 className="report-title">{reportTitle}</h2>
        <div className="report-metadata">
          <span>Generated on: {generatedDate}</span>
          <div className="print-section">
            <button onClick={() => window.print()} className="print-button">
              <FontAwesomeIcon icon={faPrint} />
              Print Report
            </button>
          </div>
          <span>Total Records: {totalRecords}</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced types for itemized relief goods tracking
type ReportSummary = {
  total_reports: number;
  completed: number;
  started: number;
  active_incidents: number;
  high_priority: number;
  response_time_avg: number;
};

// Enhanced supply item structure for detailed tracking - Updated categories
type SupplyItem = {
  id: string;
  name: string;
  category: "food" | "medical" | "clothing" | "beverages" | "hygiene";
  unit: string; // kg, liters, pieces, etc.
  available: number;
  in_transit: number;
  distributed: number;
  low_stock_threshold: number;
};

const ResponseDashboard = () => {
  interface InventoryItemDetail {
    item_name: string;
    quantity: number;
    transit: number;
    distributed: number;
    unit: string;
  }

  // Represents a category summary with details
  interface CategorySummary {
    available: number;
    transit: number;
    distributed: number;
    details: InventoryItemDetail[];
  }

  // Represents the full structure for all categories
  interface InventorySummary {
    food: CategorySummary;
    medical: CategorySummary;
    clothing: CategorySummary;
    beverages: CategorySummary;
    hygiene: CategorySummary;
    staff_available: number;
    staff_deployed: number;
    supply_items: SupplyItem[];
  }
  const navigate = useNavigate();
  const { userRoles } = useUserRoleContext();
  const [recentMapActivity, setRecentMapActivity] = useState<
    RecentMapActivity[] | null
  >(null);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(
    null,
  );
  const [inKindMonitoring, setInKindMonitoring] =
    useState<InventorySummary | null>(null);
  const [demandMapPin, setDemandMapPin] = useState<MapPin[] | null>(null);
  const [isPageFullyLoaded, setIsPageFullyLoaded] = useState(false);

  // State for expandable supply breakdown
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(false);

  type Category = "food" | "medical" | "clothing" | "beverages" | "hygiene";
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  // Report generation states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<
    "monthly" | "quarterly" | "yearly"
  >("monthly");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [resourceStatus, setResourceStatus] = useState<{
    available_relief_items: number;
    in_transit: number;
    total_distributed: number;
  } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleLoad = () => setIsPageFullyLoaded(true);

    if (document.readyState === "complete") {
      setTimeout(() => setIsPageFullyLoaded(true), 1200);
    } else {
      window.addEventListener("load", handleLoad);
      return () => window.removeEventListener("load", handleLoad);
    }
  }, []);

  const fetchResourceStatus = () => {
    const fetch = async () => {
      try {
        const response = await API.get(
          "/response_dashboard/get_resource_status",
        );
        setResourceStatus(response.data);
      } catch (e: any) {
        console.error("Error fetching resource status: " + e);
      }
    };
    fetch();
  };

  useEffect(() => {
    // Load live data from the backend
    fetchData<ReportSummary>(
      "/response_dashboard/report_summary",
      setReportSummary,
    );
    fetchData<RecentMapActivity[]>(
      "/response_dashboard/recent_map_activity",
      setRecentMapActivity,
    );
    fetchData<InventorySummary>(
      "/response_dashboard/in_kind_monitoring_detailed",
      setInKindMonitoring,
    );
    fetchData<MapPin[]>(
      "/response_dashboard/demand_and_response/get_map_pin",
      setDemandMapPin,
    );
    fetchResourceStatus();
  }, []);

  // Updated helper function to match your categories
  const getCategoryStyle = (category: string) => {
    const styles = {
      food: { color: "#28a745", icon: "🍚" },
      medical: { color: "#dc3545", icon: "⚕️" },
      clothing: { color: "#6f42c1", icon: "👕" },
      beverages: { color: "#007bff", icon: "🥤" },
      hygiene: { color: "#20c997", icon: "🧼" },
    };
    return (
      styles[category as keyof typeof styles] || {
        color: "#6c757d",
        icon: "📦",
      }
    );
  };

  // Helper function to check if item is low stock
  const isLowStock = (item: SupplyItem) => {
    return item.available <= item.low_stock_threshold;
  };

  // Helper functions for activity styling
  const getActivityTypeStyle = (type: string) => {
    const styles = {
      new_request: {
        color: "#dc3545",
        icon: faExclamationTriangle,
        label: "New Request",
      },
      response_dispatched: {
        color: "#007bff",
        icon: faUsers,
        label: "Response Dispatched",
      },
      completed: { color: "#28a745", icon: faMapMarkerAlt, label: "Completed" },
      status_update: {
        color: "#ffc107",
        icon: faClock,
        label: "Status Update",
      },
    };
    return (
      styles[type as keyof typeof styles] || {
        color: "#6c757d",
        icon: faMapMarkerAlt,
        label: "Activity",
      }
    );
  };

  const getPriorityStyle = (priority: string) => {
    const styles = {
      urgent: { color: "#dc3545", bg: "#fff5f5" },
      high: { color: "#fd7e14", bg: "#fff8f0" },
      medium: { color: "#ffc107", bg: "#fffbf0" },
      low: { color: "#28a745", bg: "#f0fff4" },
    };
    return (
      styles[priority as keyof typeof styles] || {
        color: "#6c757d",
        bg: "#f8f9fa",
      }
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor(
      (now.getTime() - time.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getDateRange = (period: string): string => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case "monthly":
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        return `${monthNames[currentMonth]} ${currentYear}`;
      case "quarterly":
        const quarter = Math.floor(currentMonth / 3) + 1;
        return `Q${quarter} ${currentYear}`;
      case "yearly":
        return `${currentYear}`;
      default:
        return "";
    }
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    try {
      // Company/Organization Information
      const companyInfo: CompanyInfo = {
        name: "Emergency Response Center",
        tagline: "Professional Emergency Management Services",
        address: {
          street: "123 Emergency Services Drive",
          city: "Cebu City",
          state: "Philippines",
          zip: "6000",
        },
        contact: {
          phone: "(032) 123-4567",
          email: "emergency@response.gov.ph",
        },
      };

      // Report Details
      const reportTitle = `Emergency Response Activity Report • ${getDateRange(reportPeriod)}`;
      const generatedDate = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Calculate total records from your data
      const totalRecords = demandMapPin?.length || 0;

      // Mock report data - replace with actual API call
      const mockReportData: ReportData = {
        period: reportPeriod,
        dateRange: getDateRange(reportPeriod),
        companyInfo,
        reportTitle,
        generatedDate,

        summary: {
          totalIncidents: reportSummary?.total_reports || 15,
          activeIncidents: reportSummary?.active_incidents || 3,
          completedIncidents: reportSummary?.completed || 8,
          avgResponseTime: reportSummary?.response_time_avg || 1.5,
          totalStaffDeployed: inKindMonitoring?.staff_deployed || 8,
          totalResourcesDistributed: resourceStatus?.total_distributed || 75,
        },
        incidentsByPriority: {
          urgent: 4,
          high: 6,
          medium: 3,
          low: 2,
        },
        incidentsByStatus: {
          noResponse: 3,
          responded: 4,
          completed: 8,
        },
        resourceDistribution: {
          food: inKindMonitoring?.food.distributed || 50,
          medical: inKindMonitoring?.medical.distributed || 15,
          clothing: inKindMonitoring?.clothing.distributed || 25,
          beverages: inKindMonitoring?.beverages.distributed || 30,
          hygiene: inKindMonitoring?.hygiene.distributed || 20,
        },
        topIncidentLocations: [
          { location: "District 1", count: 5, avgResponseTime: 1.2 },
          { location: "District 2", count: 4, avgResponseTime: 1.8 },
          { location: "District 3", count: 3, avgResponseTime: 1.1 },
          { location: "District 4", count: 2, avgResponseTime: 2.1 },
          { location: "District 5", count: 1, avgResponseTime: 0.9 },
        ],
        performanceMetrics: {
          responseTimeTarget: 2.0,
          responseTimeAchieved: 1.5,
          completionRate: 53.3,
          staffUtilization: 66.7,
        },
      };

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setReportData(mockReportData);

      // Uncomment when API is ready:
      // const report = await fetchData<ReportData>(`/response_dashboard/generate_report?period=${reportPeriod}`, setReportData);
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        const reportContent = printRef.current.innerHTML;

        printWindow.document.write(`
          <html>
            <head>
              <title>Emergency Response Report - ${reportData?.dateRange}</title>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  margin: 20px;
                  color: #333;
                  line-height: 1.6;
                }
                .report-header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 3px solid #007bff;
                  padding-bottom: 20px;
                }
                .company-name {
                  font-size: 28px;
                  font-weight: bold;
                  color: #007bff;
                  margin-bottom: 10px;
                }
                .company-tagline {
                  font-size: 16px;
                  color: #6c757d;
                  margin-bottom: 15px;
                  font-style: italic;
                }
                .company-contact {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 20px;
                  margin-bottom: 20px;
                  font-size: 14px;
                }
                .report-title {
                  font-size: 24px;
                  font-weight: bold;
                  color: #495057;
                  margin: 20px 0 10px 0;
                }
                .report-meta {
                  font-size: 14px;
                  color: #6c757d;
                  margin-bottom: 20px;
                }
                .section {
                  margin-bottom: 25px;
                  page-break-inside: avoid;
                }
                .section-title {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 15px;
                  color: #495057;
                  border-bottom: 2px solid #dee2e6;
                  padding-bottom: 5px;
                }
                .metrics-grid {
                  display: grid;
                  grid-template-columns: repeat(3, 1fr);
                  gap: 15px;
                  margin-bottom: 20px;
                }
                .metric-card {
                  padding: 15px;
                  border: 2px solid #dee2e6;
                  border-radius: 8px;
                  text-align: center;
                  background: #f8f9fa;
                }
                .metric-value {
                  font-size: 24px;
                  font-weight: bold;
                  color: #007bff;
                  display: block;
                  margin-bottom: 5px;
                }
                .metric-label {
                  font-size: 12px;
                  color: #666;
                  line-height: 1.4;
                }
                .table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 20px;
                }
                .table th, .table td {
                  padding: 12px;
                  text-align: left;
                  border-bottom: 1px solid #dee2e6;
                }
                .table th {
                  background-color: #f8f9fa;
                  font-weight: bold;
                  color: #495057;
                }
                .priority-urgent { color: #dc3545; font-weight: bold; }
                .priority-high { color: #fd7e14; font-weight: bold; }
                .priority-medium { color: #ffc107; font-weight: bold; }
                .priority-low { color: #28a745; font-weight: bold; }
                .status-completed { color: #28a745; font-weight: 600; }
                .status-responded { color: #ffc107; font-weight: 600; }
                .status-no-response { color: #dc3545; font-weight: 600; }
                @page {
                  margin: 1in;
                  @bottom-right {
                    content: "Page " counter(page) " of " counter(pages);
                  }
                }
                @media print {
                  body { margin: 0; }
                  .no-print { display: none; }
                  .section { page-break-inside: avoid; }
                }
              </style>
            </head>
            <body>
              ${reportContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="response_container">
      <div className="response-content">
        {/* Enhanced page header with report button */}
        <div className="page-header-enhanced">
          <div>
            <h1>Emergency Response Dashboard</h1>
            <p className="dashboard-subtitle">
              Real-time monitoring and incident management
            </p>
          </div>
          <div className="header-actions">
            <button
              onClick={() => navigate("/response_dashboard/emergency_report")}
              className="btn-generate-report"
            >
              <FontAwesomeIcon icon={faFileAlt} />
              Generate Report
            </button>
          </div>
        </div>

        {/* Essential Metrics Only */}
        <div id="report-container">
          <div
            id="reports-value"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "15px",
            }}
          >
            <h3 style={{ gridColumn: "span 3" }}>Key Metrics</h3>

            {/* Active Incidents - Most Critical */}
            <div className="sub-item-content-big-data-inverted">
              <h1>
                <FontAwesomeIcon
                  icon={faExclamationTriangle}
                  style={{ marginRight: "8px", color: "#fff" }}
                />
                Active Response Activity
              </h1>
              <div className="horizontal-container full-width space-between-container">
                {reportSummary ? (
                  <span
                    style={{
                      color: "#fff",
                      fontSize: "2rem",
                      fontWeight: "700",
                    }}
                  >
                    {reportSummary.active_incidents}
                  </span>
                ) : (
                  <span>Loading Data</span>
                )}
                <span
                  className="comparizon-value"
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  High: {reportSummary?.high_priority || 0}
                </span>
              </div>
            </div>

            {/* Response Time - Critical for Operations */}
            <div className="sub-item-content-big-data-inverted">
              <h1>Avg Response Time</h1>
              <div className="horizontal-container full-width space-between-container">
                {reportSummary ? (
                  <span
                    style={{
                      color: "#fff",
                      fontSize: "2rem",
                      fontWeight: "700",
                    }}
                  >
                    {reportSummary.response_time_avg}h
                  </span>
                ) : (
                  <span>Loading Data</span>
                )}
                <span
                  className="comparizon-value"
                  style={{
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.8)",
                  }}
                >
                  Target: ≤ 2h
                </span>
              </div>
            </div>

            {/* Staff Status - Enhanced with better spacing */}
            <div className="sub-item-content-big-data-inverted">
              <h1
                style={{
                  fontSize: "clamp(0.85rem, 1.1vw, 0.95rem)",
                  fontWeight: "500",
                  marginBottom: "12px",
                  lineHeight: "1.2",
                }}
              >
                <FontAwesomeIcon
                  icon={faUsers}
                  style={{
                    marginRight: "6px",
                    fontSize: "0.9em",
                    color: "#fff",
                  }}
                />
                Staff Status
              </h1>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  alignItems: "stretch",
                  padding: "0 4px",
                }}
              >
                {/* Available Staff */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 8px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(0.8rem, 1vw, 0.85rem)",
                      fontWeight: "500",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    Available
                  </span>
                  <span
                    style={{
                      fontSize: "clamp(1rem, 1.3vw, 1.1rem)",
                      fontWeight: "700",
                      color: "#fff",
                    }}
                  >
                    {inKindMonitoring?.staff_available || 0}
                  </span>
                </div>

                {/* Deployed Staff */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 8px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(0.8rem, 1vw, 0.85rem)",
                      fontWeight: "500",
                      color: "rgba(255,255,255,0.9)",
                    }}
                  >
                    Deployed
                  </span>
                  <span
                    style={{
                      fontSize: "clamp(1rem, 1.3vw, 1.1rem)",
                      fontWeight: "700",
                      color: "#fff",
                    }}
                  >
                    {inKindMonitoring?.staff_deployed || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Map Activity - Simple Header Without Action Button */}
          <div id="recent-activity-container">
            <div className="horizontal-container">
              <h3>Recent Map Activity</h3>
            </div>
            <div
              className="recent-activity"
              style={{
                maxHeight: "300px",
                overflowY: "auto",
                backgroundColor: "#fff",
                border: "1px solid #e9ecef",
                borderRadius: "6px",
                padding: "12px",
              }}
            >
              {recentMapActivity ? (
                recentMapActivity.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {recentMapActivity.slice(0, 5).map((activity) => {
                      const activityStyle = getActivityTypeStyle(
                        activity.activity_type,
                      );
                      const priorityStyle = getPriorityStyle(activity.priority);

                      return (
                        <div
                          key={activity.id}
                          style={{
                            padding: "10px 12px",
                            backgroundColor: priorityStyle.bg,
                            border: `1px solid ${priorityStyle.color}20`,
                            borderRadius: "6px",
                            borderLeft: `4px solid ${activityStyle.color}`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: "6px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <FontAwesomeIcon
                                icon={activityStyle.icon}
                                style={{
                                  color: activityStyle.color,
                                  fontSize: "0.9rem",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: "600",
                                  color: activityStyle.color,
                                }}
                              >
                                {activityStyle.label}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: "500",
                                  color: priorityStyle.color,
                                  backgroundColor: `${priorityStyle.color}20`,
                                  padding: "2px 6px",
                                  borderRadius: "10px",
                                  textTransform: "uppercase",
                                }}
                              >
                                {activity.priority}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#6c757d",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              <FontAwesomeIcon icon={faClock} />
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                          </div>

                          <div style={{ marginBottom: "4px" }}>
                            <span
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: "500",
                                color: "#495057",
                              }}
                            >
                              📍 {activity.location.name}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#6c757d",
                              marginBottom: "4px",
                            }}
                          >
                            {activity.description}
                          </div>

                          {activity.assigned_team && (
                            <div
                              style={{ fontSize: "0.7rem", color: "#007bff" }}
                            >
                              Team: {activity.assigned_team}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#6c757d",
                      padding: "2rem",
                      fontSize: "0.9rem",
                    }}
                  >
                    No recent activity
                  </div>
                )
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    color: "#6c757d",
                    padding: "2rem",
                    fontSize: "0.9rem",
                  }}
                >
                  Loading activity...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Essential Visual Components */}
        <div className="horizontal-container-dash" id="second-dash">
          {/* Relief Activity Map - Critical for Geographic Awareness */}
          <div
            className="vertical-container"
            id="demand-map-container"
            style={{ flex: "2" }}
          >
            <div className="horizontal-container space-between-container">
              <h3>Relief Activity Map</h3>
              {userRoles.includes("operations admin") && (
                <Link
                  to="/response_dashboard/demand_and_response_map"
                  className="manage-button"
                >
                  <FontAwesomeIcon icon={faListUl} /> Manage
                </Link>
              )}
            </div>
            <div
              style={{
                overflow: "hidden",
                boxShadow: "0 1px 10px rgba(50, 50, 50, 0.35)",
                position: "relative",
                minHeight: "400px",
              }}
              className="bordered-sub-item"
            >
              {isPageFullyLoaded && demandMapPin && (
                <MapView
                  center={[10.313924, 123.887082]}
                  markers={demandMapPin}
                  fitBounds={true}
                />
              )}
            </div>
          </div>

          {/* Enhanced Resource Tracking with Detailed Breakdown */}
          <div
            className="vertical-container"
            id="in-kind-container"
            style={{ flex: "1" }}
          >
            <div className="horizontal-container space-between-container">
              <h3>Resource Status</h3>
              <button
                onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                <FontAwesomeIcon
                  icon={showDetailedBreakdown ? faChevronUp : faChevronDown}
                />
                {showDetailedBreakdown ? " Hide Details" : " Show Details"}
              </button>
            </div>

            {/* Summary Cards */}
            <div className="sub-item-content-big-data-inverted">
              <h1>Available Relief Items</h1>
              {resourceStatus ? (
                <span
                  style={{ color: "#fff", fontSize: "2rem", fontWeight: "700" }}
                >
                  {resourceStatus.available_relief_items}
                </span>
              ) : (
                <span>Loading Data</span>
              )}
            </div>

            <div className="sub-item-content-big-data-inverted">
              <h1>In Transit</h1>
              {resourceStatus ? (
                <span
                  style={{ color: "#fff", fontSize: "2rem", fontWeight: "700" }}
                >
                  {resourceStatus.in_transit}
                </span>
              ) : (
                <span>Loading Data</span>
              )}
            </div>

            <div className="sub-item-content-big-data-inverted">
              <h1>Total Distributed</h1>
              {resourceStatus ? (
                <span
                  style={{ color: "#fff", fontSize: "2rem", fontWeight: "700" }}
                >
                  {resourceStatus.total_distributed}
                </span>
              ) : (
                <span>Loading Data</span>
              )}
            </div>

            {/* Detailed Category Breakdown */}
            {showDetailedBreakdown && inKindMonitoring && (
              <div style={{ marginTop: "15px" }}>
                <h4
                  style={{
                    fontSize: "1rem",
                    marginBottom: "10px",
                    color: "#495057",
                  }}
                >
                  Supply Categories
                </h4>

                {/* Category Summary Grid - Updated categories */}
                <div
                  style={{ display: "grid", gap: "8px", marginBottom: "15px" }}
                >
                  {Object.entries(inKindMonitoring).map(([category, data]) => {
                    <p>
                      Category: {category}, data: {data}
                    </p>;
                    const style = getCategoryStyle(category);
                    const categoryDisplayNames = {
                      food: "Food",
                      medical: "Medical",
                      clothing: "Clothing",
                      beverages: "Beverages",
                      hygiene: "Hygiene",
                    };

                    return (
                      <div
                        key={category}
                        onClick={() =>
                          setSelectedCategory(
                            selectedCategory === category
                              ? null
                              : (category as Category),
                          )
                        }
                        style={{
                          padding: "10px 12px",
                          backgroundColor:
                            selectedCategory === category
                              ? `${style.color}15`
                              : "white",
                          border: `2px solid ${style.color}`,
                          borderRadius: "8px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontSize: "0.85rem",
                          boxShadow:
                            selectedCategory === category
                              ? `0 2px 8px ${style.color}25`
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span
                            style={{ fontWeight: "600", color: style.color }}
                          >
                            {style.icon}{" "}
                            {
                              categoryDisplayNames[
                                category as keyof typeof categoryDisplayNames
                              ]
                            }
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: "2px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "0.75rem",
                                color: "#6c757d",
                              }}
                            >
                              Available: {data.available}
                            </span>
                            <span
                              style={{ fontSize: "0.7rem", color: "#adb5bd" }}
                            >
                              Transit: {data.transit} | Distributed:{" "}
                              {data.distributed}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detailed Item List for Selected Category */}
                {selectedCategory && (
                  <div style={{ marginTop: "15px" }}>
                    <h5
                      style={{
                        fontSize: "0.95rem",
                        marginBottom: "10px",
                        color: "#495057",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {/* Optional icon function */}
                      {/* {getCategoryStyle(selectedCategory).icon} */}
                      {selectedCategory.charAt(0).toUpperCase() +
                        selectedCategory.slice(1)}{" "}
                      Items
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6c757d",
                          fontWeight: "400",
                        }}
                      >
                        ({inKindMonitoring[selectedCategory].details.length}{" "}
                        items)
                      </span>
                    </h5>

                    <div
                      style={{
                        maxHeight: "250px",
                        overflowY: "auto",
                        border: "1px solid #e9ecef",
                        borderRadius: "6px",
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      {inKindMonitoring[selectedCategory].details.map(
                        (item, index) => (
                          <div
                            key={index}
                            style={{
                              padding: "10px 12px",
                              backgroundColor:
                                item.quantity < 5 ? "#fff3cd" : "white", // example low stock
                              border:
                                item.quantity < 5
                                  ? "1px solid #ffc107"
                                  : "none",
                              borderBottom:
                                index <
                                inKindMonitoring[selectedCategory].details
                                  .length -
                                  1
                                  ? "1px solid #e9ecef"
                                  : "none",
                              fontSize: "0.8rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "6px",
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: "600",
                                  color: "#495057",
                                  fontSize: "0.85rem",
                                }}
                              >
                                {item.item_name}
                                {item.quantity < 5 && (
                                  <span
                                    style={{
                                      color: "#856404",
                                      marginLeft: "6px",
                                      fontSize: "0.75rem",
                                      fontWeight: "500",
                                    }}
                                  >
                                    ⚠️ Low Stock
                                  </span>
                                )}
                              </span>
                            </div>

                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: "8px",
                                fontSize: "0.75rem",
                                color: "#6c757d",
                              }}
                            >
                              <div
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#e3f2fd",
                                  borderRadius: "4px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "500",
                                    color: "#1976d2",
                                  }}
                                >
                                  Available
                                </div>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    color: "#0d47a1",
                                  }}
                                >
                                  {item.quantity} {item.unit || ""}
                                </div>
                              </div>

                              <div
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#fff3e0",
                                  borderRadius: "4px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "500",
                                    color: "#f57c00",
                                  }}
                                >
                                  Transit
                                </div>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    color: "#e65100",
                                  }}
                                >
                                  {item.transit} {item.unit || ""}
                                </div>
                              </div>

                              <div
                                style={{
                                  padding: "4px 6px",
                                  backgroundColor: "#e8f5e8",
                                  borderRadius: "4px",
                                  textAlign: "center",
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: "500",
                                    color: "#388e3c",
                                  }}
                                >
                                  Distributed
                                </div>
                                <div
                                  style={{
                                    fontWeight: "600",
                                    color: "#1b5e20",
                                  }}
                                >
                                  {item.distributed} {item.unit || ""}
                                </div>
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDashboard;

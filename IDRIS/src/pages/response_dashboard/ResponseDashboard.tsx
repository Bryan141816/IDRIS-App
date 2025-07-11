import { Link } from "react-router-dom";
import "./ResponseDashboard.scss";
import { useUserRoleContext } from "../../UserRoleContext";
import { TableView } from "../../components/TableView/table_view";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListUl } from "@fortawesome/free-solid-svg-icons/faListUl";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Bar } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ArcElement,
  Tooltip,
  Legend,
);
import { useEffect, useState } from "react";
import { fetchData } from "../../API_Handler/response_dashboard";

import { TableResponse } from "../donations_management/list_of_rafi_donors/TableComponent";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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

const getIconByStatus = (status: DemandPin["status"]) => {
  let iconUrl = "/images/icons/gray.png";
  if (status === "no response") iconUrl = "/images/icons/baranggay.png";
  else if (status === "responded") iconUrl = "/images/icons/raffi.png";
  else if (status === "completed") iconUrl = "/images/icons/lgu.png";

  return L.icon({
    iconUrl,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
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
  pathCoordinates?: [number, number][] | null;
}> = ({ center = [0, 0], markers, fitBounds = false, pathCoordinates }) => (
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
        key={index}
        position={[point.lat, point.lng]}
        icon={getIconByStatus(point.status)}
      />
    ))}
    {pathCoordinates && <Polyline positions={pathCoordinates} color="red" />}
  </MapContainer>
);

const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "bottom" as const, // 👈 fix here
    },
  },
  cutout: "80%", // or a pixel value like '100px'
};
const lineChartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: "Raised",
    },
    legend: {
      display: true,
      position: "top" as const,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const barChartOptions = {
  responsive: true,
  plugins: {
    title: {
      display: true,
      text: "Spending Breakdown",
    },
    legend: {
      display: false, // Hide legend for cleaner look
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

type ReportSummary = {
  month: string;
  total_reports: number;
  completed: number;
  started: number;
  comparison: {
    total_reports_change: {
      diff: "+" | "-" | " ";
      percent: string; // e.g. "25.0%"
    };
    completed_change: {
      diff: "+" | "-" | " ";
      percent: string;
    };
    started_change: {
      diff: "+" | "-" | " ";
      percent: string;
    };
  };
};

type PieChartDataset = {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderWidth: number;
};
type PieChartData = {
  labels: string[];
  datasets: PieChartDataset[];
};
type LineChartDataset = {
  label: string;
  data: number[];
  fill: boolean;
  borderColor: string;
  backgroundColor: string;
  tension: number;
};
type LineChartData = {
  labels: string[];
  datasets: LineChartDataset[];
};
type BarChartDataset = {
  label: string;
  data: number[];
  backgroundColor: string[];
  borderRadius: number;
};
type BarChartData = {
  labels: string[];
  datasets: BarChartDataset[];
};
type InKindMonitoring = {
  available_relief_packs: number;
  currently_in_transit: number;
  already_distributed: number;
};

const ResponseDashboard = () => {
  const { userRoles } = useUserRoleContext();
  const [recentReport, setRecentReport] = useState<TableResponse | null>(null);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(
    null,
  );
  const [modalityChart, setModalityChart] = useState<PieChartData | null>(null);
  const [inKindMonitoring, setInKindMonitoring] =
    useState<InKindMonitoring | null>(null);
  const [raisedBudget, setRaisedBudget] = useState<LineChartData | null>(null);
  const [spendingBreakdown, setSpendingBreakdown] =
    useState<BarChartData | null>(null);
  const [demandMapPin, setDemandMapPin] = useState<MapPin[] | null>(null);

  useEffect(() => {
    fetchData<ReportSummary>(
      "/response_dashboard/report_summary",
      setReportSummary,
    );
    ("/response_dashboard/spending_breakdown");
    fetchData<TableResponse>("/report_list/recent", setRecentReport);
    fetchData<PieChartData>(
      "/response_dashboard/modality_chart",
      setModalityChart,
    );
    fetchData<InKindMonitoring>(
      "/response_dashboard/in_kind_monitoring",
      setInKindMonitoring,
    );
    fetchData<LineChartData>(
      "/response_dashboard/raised_budget",
      setRaisedBudget,
    );
    fetchData<BarChartData>(
      "/response_dashboard/spending_breakdown",
      setSpendingBreakdown,
    );
    fetchData<MapPin[]>(
      "/response_dashboard/demand_and_response/get_map_pin",
      setDemandMapPin,
    );
  }, []);

  return (
    <div className="response_container">
      <h3>Response Dashboard</h3>
      <div className="response-content">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "15px",
          }}
        >
          <h3 style={{ gridColumn: "span 2" }}>Reports</h3>
          <div
            className="horizontal-container space-between-container"
            style={{ gridColumn: "span 2" }}
          >
            <h3>Recent Reports</h3>
            {userRoles.includes("operations admin") && (
              <Link
                to="/response_dashboard/report_list"
                className="manage-button"
              >
                <FontAwesomeIcon icon={faListUl} /> Manage
              </Link>
            )}
          </div>
          <div
            className="sub-item-content-big-data"
            style={{ gridColumn: "span 2" }}
          >
            <h1>Monthly Report Count</h1>
            <div className="horizontal-container full-width space-between-container comparizon-container">
              {reportSummary ? (
                <span>{reportSummary.total_reports}</span>
              ) : (
                <span>Loading Data</span>
              )}
              <span className="comparizon-value">
                {reportSummary?.comparison.total_reports_change.diff}
                {reportSummary?.comparison.total_reports_change.percent} vs Last
                Month
              </span>
            </div>
          </div>
          <div className="recent-report">
            {recentReport ? (
              <TableView
                tableJSON={recentReport}
                onClickCallback={() => {}}
                setCallbackTableData={false}
              ></TableView>
            ) : (
              <div>Loading Data</div>
            )}
          </div>
          <div className="sub-item-content-big-data">
            <h1>Completed Reports</h1>
            <div className="horizontal-container full-width space-between-container comparizon-container">
              {reportSummary ? (
                <span>{reportSummary.completed}</span>
              ) : (
                <span>Loading Data</span>
              )}
              <span className="comparizon-value">
                {reportSummary?.comparison.completed_change.diff}
                {reportSummary?.comparison.completed_change.percent} vs Last
                Month
              </span>
            </div>
          </div>
          <div className="sub-item-content-big-data">
            <h1>Ongoing Reports</h1>
            <div className="horizontal-container full-width space-between-container comparizon-container">
              {reportSummary ? (
                <span>{reportSummary.started}</span>
              ) : (
                <span>Loading Data</span>
              )}
              <span className="comparizon-value">
                {reportSummary?.comparison.started_change.diff}
                {reportSummary?.comparison.started_change.percent} vs Last Month
              </span>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "15px",
          }}
        >
          <div className="horizontal-container space-between-container">
            <h3>Demand and Response Map</h3>
            {userRoles.includes("operations admin") && (
              <Link
                to="/response_dashboard/demand_and_response_map"
                className="manage-button"
              >
                <FontAwesomeIcon icon={faListUl} /> Manage
              </Link>
            )}
          </div>
          <div className="horizontal-container space-between-container">
            <h3>Modality Distribution</h3>
            {userRoles.includes("operations admin") && (
              <Link
                to="/response_dashboard/modality_distribution"
                className="manage-button"
              >
                <FontAwesomeIcon icon={faListUl} /> Manage
              </Link>
            )}
          </div>
          <div
            className="horizontal-container space-between-container"
            style={{ gridColumn: "span 2" }}
          >
            <h3>In-Kind Monitoring</h3>
            {userRoles.includes("operations admin") && (
              <Link
                to="/response_dashboard/in_kind_monitoring"
                className="manage-button"
              >
                <FontAwesomeIcon icon={faListUl} /> Manage
              </Link>
            )}
          </div>
          <div
            style={{
              gridRow: "span 4",
              overflow: "hidden",
              boxShadow: "0 1px 10px rgba(50, 50, 50, 0.35)",
              position: "relative",
            }}
            className="bordered-sub-item"
          >
            <MapView
              center={[10.313924, 123.887082]}
              markers={demandMapPin ?? []}
              fitBounds={true}
              pathCoordinates={null}
            />
          </div>
          <div
            style={{
              gridRow: "span 4",
              backgroundColor: "white",
              boxShadow: "0 1px 10px rgba(50, 50, 50, 0.35)",
            }}
            className="bordered-sub-item"
          >
            <div
              style={{
                display: "flex",
                padding: "15px",
                height: "100%",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {modalityChart ? (
                modalityChart.labels ? (
                  <Doughnut data={modalityChart} options={options} />
                ) : (
                  <div>No Records</div>
                )
              ) : (
                <div>Loading Data</div>
              )}
            </div>
          </div>
          <div
            className="sub-item-content-big-data-inverted"
            style={{ gridColumn: "span 2" }}
          >
            <h1>Relief Packs Available for Distribution</h1>
            {inKindMonitoring ? (
              <span>{inKindMonitoring?.available_relief_packs}</span>
            ) : (
              <span>Loading Data</span>
            )}
          </div>
          <div
            className="sub-item-content-big-data-inverted"
            style={{ gridColumn: "span 2" }}
          >
            <h1>Relief Packs Currently in Transit</h1>
            {inKindMonitoring ? (
              <span>{inKindMonitoring?.currently_in_transit}</span>
            ) : (
              <span>Loading Data</span>
            )}
          </div>
          <div
            className="sub-item-content-big-data-inverted"
            style={{ gridColumn: "span 2" }}
          >
            <h1>Total Relief Packs Already Distributed</h1>
            {inKindMonitoring ? (
              <span>{inKindMonitoring?.already_distributed}</span>
            ) : (
              <span>Loading Data</span>
            )}
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "15px",
            paddingBottom: "30px",
          }}
        >
          <div
            className="horizontal-container space-between-container"
            style={{ gridColumn: "span 2" }}
          >
            <h3>Budget</h3>
            {userRoles.includes("operations admin") && (
              <Link
                to="/response_dashboard/budget_record"
                className="manage-button"
              >
                <FontAwesomeIcon icon={faListUl} /> Manage
              </Link>
            )}
          </div>
          <div
            className="bordered-sub-item"
            style={{
              padding: "15px",
              boxShadow: "0 1px 10px rgba(50, 50, 50, 0.35)",
            }}
          >
            {raisedBudget ? (
              <Line data={raisedBudget} options={lineChartOptions} />
            ) : (
              <div>Loading Data</div>
            )}
          </div>
          <div
            className="bordered-sub-item"
            style={{
              padding: "15px",
              boxShadow: "0 1px 10px rgba(50, 50, 50, 0.35)",
            }}
          >
            {spendingBreakdown ? (
              <Bar data={spendingBreakdown} options={barChartOptions} />
            ) : (
              <div>Loading Data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ResponseDashboard;

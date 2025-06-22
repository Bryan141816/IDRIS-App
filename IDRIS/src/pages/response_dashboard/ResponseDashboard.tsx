import { Link } from "react-router-dom";
import "./ResponseDashboard.scss";
import { useUserRoleContext } from "../../UserRoleContext";
import MapView from "../../components/MapView/MapView";
import { TableView } from "../../components/TableView/table_view";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faListUl } from "@fortawesome/free-solid-svg-icons";
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
const markers = [
  {
    lat: 10.313924,
    lng: 123.887082,
    lguName: "Cebu City",
    type: "lgu",
    description: `Cebu City is the center of commerce, trade, education, and tourism in the Visayas region. It’s one of the Philippines' oldest and most developed cities.`,
    population: "964,169",
    resources: `Major hospitals (Chong Hua Hospital, Cebu Doctors’ University Hospital), CDRRMO...`,
    evacuationCenter: "Cebu City Sports Center",
    image: "../images/lgu/cebucity.jpeg",
    hazardAreas: [
      { lat: 10.313, lng: 123.885 },
      { lat: 10.315, lng: 123.889 },
    ],
  },
  {
    lat: 10.346693,
    lng: 123.898476,
    lguName: "Mandaue City",
    type: "lgu",
    description: `Mandaue City is known for its manufacturing and commercial establishments.`,
    population: "364,116",
    resources: `Ambulances, Fire trucks, MCDRRMO...`,
    evacuationCenter: "Mandaue Coliseum",
    image: "../images/lgu/mandaue.jpg",
    hazardAreas: [{ lat: 10.345, lng: 123.899 }],
  },
  {
    lat: 10.34,
    lng: 123.9,
    lguName: "Barangay Apas",
    type: "barangay",
    description:
      "It is a residential area known for its proximity to Cebu IT Park and the bustling business centers in the area. The barangay is home to schools, healthcare facilities, and various residential communities.",
    population: "15,000",
    resources: "Basic Medical Kits, Barangay Tanod, Community Health Workers",
    evacuationCenter: "Barangay Apas Hall",
    image: "../images/baranggay/baranggay.jpg",
    hazardAreas: [],
  },
  {
    lat: 10.35,
    lng: 123.91,
    lguName: "RAFI Infra A",
    type: "raffi",
    description:
      "The facility includes warehouses, transportation hubs, and communication systems to ensure smooth coordination of relief efforts.",
    population: "-",
    resources: "-",
    evacuationCenter: "-",
    image: "../images/raffi/raffi.jpg",
    hazardAreas: [],
  },
];

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
  remaining_days: number;
};

const ResponseDashboard = () => {
  const { userRole } = useUserRoleContext();
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
            {userRole == "operations admin" && (
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
            {userRole == "operations admin" && (
              <Link
                to="/response_dashboard/report_list"
                className="manage-button"
              >
                <FontAwesomeIcon icon={faListUl} /> Manage
              </Link>
            )}
          </div>
          <div className="horizontal-container space-between-container">
            <h3>Modality Distribution</h3>
            {userRole == "operations admin" && (
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
            {userRole == "operations admin" && (
              <Link
                to="/response_dashboard/report_list"
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
              markers={markers}
              onMarkerClick={() => {}}
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
          <div
            className="sub-item-content-big-data-inverted"
            style={{ gridColumn: "span 2" }}
          >
            <h1>Remaining Days for Distribution Completion</h1>
            {inKindMonitoring ? (
              <span>{inKindMonitoring?.remaining_days} Days</span>
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
            {userRole == "operations admin" && (
              <Link
                to="/response_dashboard/report_list"
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

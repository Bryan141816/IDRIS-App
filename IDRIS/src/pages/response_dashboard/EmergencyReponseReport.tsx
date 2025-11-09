import React, { useState, useEffect } from "react";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import RAFI_Shield from "../../media/RAFI_Shield.png";
import "./EmergencyReportResponse.css";
import axios from "axios";
import { API } from "../../API_Handler/Axio_API_Handler";

type ReportData = {
  reportTitle: string;
  dateRange: string;
  generatedDate: string;
  totalRecords: number;
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
  resourceDistribution: {
    [key: string]: number;
  };
  performanceMetrics: {
    responseTimeAchieved: number;
    responseTimeTarget: number;
    completionRate: number;
    staffUtilization: number;
  };
};

const companyInfo = {
  name: "RAFI Inc.",
  tagline: "The Ramon Aboitiz Foundation Inc.",
  address: {
    street: "35 Eduardo Aboitiz St",
    city: "Cebu City",
    state: "Philippines",
    zip: "6000",
  },
  contact: {
    phone: "(09) 000-000-0000",
    email: "sampleemail@gmail.com",
  },
};

// Type for each item in the distributed_report
type DistributedReportItem = {
  ResourceType: string;
  Distributed: number;
  Percent: number;
};

// Main emergency response report type
type EmergencyResponseReport = {
  generatedDate: string;
  range: string;
  total_relief_activities: number;
  completed_routes: number;
  completed_team_members_count: number;
  distributed_count: number;
  completed_procurement_items_count: number;
  low_priority_count: number;
  medium_priority_count: number;
  high_priority_count: number;
  total_request_count: number;
  distributed_report: DistributedReportItem[];
};

const EmergencyReportResponse = () => {
  const [filterPeriod, setFilterPeriod] = useState("monthly");
  const [reportData, setReportData] = useState<EmergencyResponseReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await API.get(
          `api/emergency-response/report?period=${filterPeriod}`,
        );
        setReportData(response.data);
      } catch (err) {
        setError("Failed to fetch report data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [filterPeriod]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!reportData) {
    return <div>No data available.</div>;
  }

  return (
    <div className="erc-report-container">
      {/* Header */}
      <div className="erc-report-header">
        <div className="erc-horizontal-flex">
          <div className="erc-company-branding">
            <img
              src={RAFI_Shield}
              alt="rafi-shield"
              className="erc-company-logo"
            />
            <div className="erc-company-title">
              <h1 className="erc-company-name">{companyInfo.name}</h1>
              <p className="erc-company-tagline">{companyInfo.tagline}</p>
            </div>
          </div>

          <div className="erc-company-info">
            <p className="erc-company-legal-name">{companyInfo.name}</p>
            <p className="erc-company-address">{companyInfo.address.street}</p>
            <p className="erc-company-address">
              {companyInfo.address.city}, {companyInfo.address.state}{" "}
              {companyInfo.address.zip}
            </p>
            <p className="erc-company-contact">
              Phone: {companyInfo.contact.phone}
            </p>
            <p className="erc-company-contact">
              Email: {companyInfo.contact.email}
            </p>
          </div>
        </div>

        <div className="erc-report-info">
          <h2 className="erc-report-title">{"Emergency Response Report"}</h2>
          <div className="erc-report-metadata">
            <span>
              Generated on:{" "}
              {new Date(reportData.generatedDate).toLocaleDateString()}
            </span>

            {/* Period filters + actions */}
            <div className="print-section">
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Period:</span>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  className="erc-filter-button"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>

              <button onClick={handlePrint} className="erc-print-button">
                Print Report
              </button>
            </div>

            <span>
              Reporting Period: {reportData.range} • Records:{" "}
              {reportData.total_relief_activities}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="erc-report-main">
        {/* Executive Summary Cards */}
        <div className="erc-section">
          <h3 className="erc-section-title">Executive Summary</h3>
          <div className="erc-metrics-grid">
            <div className="erc-metric-card">
              <p className="erc-metric-value">
                {reportData.total_relief_activities}
              </p>
              <p className="erc-metric-label">Total Relief Activities</p>
            </div>

            <div className="erc-metric-card">
              <p className="erc-metric-value">{reportData.completed_routes}</p>
              <p className="erc-metric-label">Completed</p>
            </div>

            <div className="erc-metric-card">
              <p className="erc-metric-value">{reportData.completed_routes}</p>
              <p className="erc-metric-label">Staff Deployed</p>
            </div>
            <div className="erc-metric-card">
              <p className="erc-metric-value">{reportData.distributed_count}</p>
              <p className="erc-metric-label">Resources Distributed</p>
            </div>
          </div>
        </div>

        {/* Relief Activities by Priority Table */}

        <div className="erc-table-container">
          <h3 className="erc-section-title">Relief Activities by Priority</h3>
          <table className="erc-table">
            <thead>
              <tr>
                <th>Priority Level</th>
                <th>Count</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="priority-high">High</td>
                <td>{reportData.high_priority_count}</td>
                <td>
                  {(
                    (reportData.high_priority_count /
                      (reportData.completed_routes || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </td>
              </tr>
              <tr>
                <td className="priority-medium">Medium</td>
                <td>{reportData.medium_priority_count}</td>
                <td>
                  {(
                    (reportData.medium_priority_count /
                      (reportData.completed_routes || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </td>
              </tr>
              <tr>
                <td className="priority-low">Low</td>
                <td>{reportData.low_priority_count}</td>
                <td>
                  {(
                    (reportData.low_priority_count /
                      (reportData.completed_routes || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="erc-table-container">
          <h3 className="erc-section-title">Resource Distribution</h3>
          <table className="erc-table">
            <thead>
              <tr>
                <th>Resource Type</th>
                <th>Distributed</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {reportData && reportData.distributed_report.length > 0 ? (
                reportData.distributed_report.map((item, index) => (
                  <tr key={index}>
                    <td>{item.ResourceType}</td>
                    <td>{item.Distributed}</td>
                    <td>{item.Percent}%</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3}>No Data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Performance Metrics */}
        {/* <div className="erc-summary-section"> */}
        {/*   <h3 className="erc-summary-title">Performance Metrics</h3> */}
        {/*   <div className="erc-summary-grid"> */}
        {/*     <div className="erc-summary-item"> */}
        {/*       <p className="erc-summary-label">Response Time:</p> */}
        {/*       <p */}
        {/*         className="erc-summary-value" */}
        {/*         style={{ */}
        {/*           color: */}
        {/*             reportData.performanceMetrics.responseTimeAchieved <= */}
        {/*             reportData.performanceMetrics.responseTimeTarget */}
        {/*               ? "#28a745" */}
        {/*               : "#dc3545", */}
        {/*         }} */}
        {/*       > */}
        {/*         {reportData.performanceMetrics.responseTimeAchieved}h */}
        {/*         <span className="erc-target-text"> */}
        {/*           {" "} */}
        {/*           (Target: {reportData.performanceMetrics.responseTimeTarget}h) */}
        {/*         </span> */}
        {/*       </p> */}
        {/*     </div> */}
        {/*     <div className="erc-summary-item"> */}
        {/*       <p className="erc-summary-label">Completion Rate:</p> */}
        {/*       <p */}
        {/*         className="erc-summary-value" */}
        {/*         style={{ */}
        {/*           color: */}
        {/*             reportData.performanceMetrics.completionRate >= 80 */}
        {/*               ? "#28a745" */}
        {/*               : reportData.performanceMetrics.completionRate >= 60 */}
        {/*                 ? "#ffc107" */}
        {/*                 : "#dc3545", */}
        {/*         }} */}
        {/*       > */}
        {/*         {reportData.performanceMetrics.completionRate}% */}
        {/*       </p> */}
        {/*     </div> */}
        {/*     <div className="erc-summary-item"> */}
        {/*       <p className="erc-summary-label">Staff Utilization:</p> */}
        {/*       <p className="erc-summary-value"> */}
        {/*         {reportData.performanceMetrics.staffUtilization}% */}
        {/*       </p> */}
        {/*     </div> */}
        {/*   </div> */}
        {/* </div> */}
      </main>

      {/* Print Footer */}
      <div className="erc-print-footer">
        <p>
          This report was generated on {reportData.generatedDate} at{" "}
          {new Date().toLocaleTimeString()}
        </p>
        <p>{companyInfo.name} - Confidential Document</p>
      </div>
    </div>
  );
};

export default EmergencyReportResponse;

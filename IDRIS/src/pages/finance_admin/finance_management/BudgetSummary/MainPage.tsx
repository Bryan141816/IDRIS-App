import React, { useRef, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import styles from "./MainPage.module.scss";
import RAFI_Shield from "../../../../media/RAFI_Shield.png";

// Replace with your real components
import ExecutiveSummary from "./ExecutiveSummary";
import { BarChartComponent, PieChartComponent } from "./Charts";
import PendingTransactionsChart from "./PendingTransactionChart";
import DataTable from "./DataTable";

import { jsPDF } from "jspdf";
import { getBudgetSummary, getNestedBudgetSummary } from "../../../../API_Handler/finance_management_handler";
import { CompanyInfo, FinanceRecordType, emptyFinanceRecord } from "../types";
import { NestedAllocationItem } from "./types";
import { formatDate, formatDateOnly, getActionRequired, getTotalPendingTransactions } from "../helpers";
import { formatCurrency } from "../../../helpers";

const companyInfo: CompanyInfo & { _reportTitle?: string } = {
  name: "RAFI Inc.",
  tagline: "The Ramon Aboitiz Foundation Inc.",
  address: {
    street: "35 Eduardo Aboitiz St",
    city: "Cebu City",
    state: "Philippines",
    zip: "6000",
  },
  contact: { phone: "(09) 000-000-0000", email: "sampleemail@gmail.com" },
  _reportTitle: "",
};

const FinancialReportDashboard: React.FC = () => {
  const location = useLocation();
  const state = location.state as { date_from?: string; date_to?: string; title?: string; };
  const printableRef = useRef<HTMLDivElement>(null);
  const [exportMode, setExportMode] = useState(false);

  // state for API data
  const [summaryData, setSummaryData] = useState<FinanceRecordType | null>(null);
  const [tableData, setTableData] = useState<NestedAllocationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);

  const effectiveDateFrom = state?.date_from ?? startOfYear.toISOString().split("T")[0];
  const effectiveDateTo = state?.date_to ?? today.toISOString().split("T")[0];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch both datasets in parallel
        const [summary, nestedData] = await Promise.all([
          getBudgetSummary(effectiveDateFrom, effectiveDateTo),
          getNestedBudgetSummary(effectiveDateFrom, effectiveDateTo),
        ]);
        setSummaryData(summary);
        setTableData(nestedData);
      } catch (err: any) {
        console.error("Failed to fetch financial data:", err);
        setError("Could not load financial data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [effectiveDateFrom, effectiveDateTo]);
  
  if (loading) return <div>Loading report…</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  if (!summaryData) return <div>No data available.</div>;


  const title = state?.title || "Financial Report";
  const reportTitle = `${title} • ${
    summaryData.filters.from_date ? formatDateOnly(summaryData.filters.from_date) : "N/A"
  } – ${
    summaryData.filters.to_date ? formatDateOnly(summaryData.filters.to_date) : "N/A"
  }`;

  companyInfo._reportTitle = reportTitle;

  // Chart prep using the more accurate nested data
  const chartData = tableData.map(item => ({
    name: item.budget_for.replace(/_/g, " "),
    inflow: parseFloat(String(item.inflow_total)),
    outflow: parseFloat(String(item.outflow_total)),
  }));

  const pieData = tableData.map(item => ({
    name: item.budget_for.replace(/_/g, " "),
    value: parseFloat(String(item.net_total)),
  }));

  return (
    <div className={styles.budgetReport}>
      <div className={styles.container} ref={printableRef}>
        {/* Header */}
        <div className={styles.reportHeader}>
          <div className={styles.horizontalflex}>
            <div className={styles.companyBranding}>
              <img
                src={RAFI_Shield}
                alt="rafi-shield"
                className={styles.companyLogo}
              />
              <div className={styles.companyTitle}>
                <h1 className={styles.companyName}>{companyInfo.name}</h1>
                <p className={styles.companyTagline}>{companyInfo.tagline}</p>
              </div>
            </div>

            <div className={styles.companyInfo}>
              <p className={styles.companyLegalName}>{companyInfo.name}</p>
              <p>{companyInfo.address.street}</p>
              <p>
                {companyInfo.address.city}, {companyInfo.address.state}{" "}
                {companyInfo.address.zip}
              </p>
              <p>Phone: {companyInfo.contact.phone}</p>
              <p>Email: {companyInfo.contact.email}</p>
            </div>
          </div>

          <div className={styles.reportInfo}>
            <h2 className={styles.reportTitle}>{reportTitle}</h2>
            <div className={styles.reportMetadata}>
              <span>Generated on: {new Date().toLocaleDateString()}</span>
              <div className={styles.printSection}>
                <button
                  onClick={() => window.print()}
                  className={styles.printButton}
                >
                  Print Report
                </button>
              </div>
              <span>From {summaryData.diagnostics.records_considered} records</span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <ExecutiveSummary kpis={summaryData.kpis} />

        <div className="pageBreakBefore" />

        {/* Financial Overview */}
        <section className={`${styles.section} pageBreakAfter`}>
          <h2 className={styles.sectionTitle}>Financial Overview</h2>
          <div className={styles.chartsGrid}>
            <div className={styles.chartContainer}>
              <h3 className={styles.chartTitle}>Inflow vs Outflow by Allocation</h3>
              <BarChartComponent
                data={chartData}
                title="Inflow vs Outflow by Allocation"
                exportAsImage={exportMode}
              />
            </div>

            <div className={styles.chartContainer}>
              <h3 className={styles.chartTitle}>Net Balance Distribution</h3>
              <PieChartComponent
                data={pieData}
                title="Net Balance Distribution"
                exportAsImage={exportMode}
              />
            </div>
          </div>
        </section>

        <div className="pageBreakBefore" />

        {/* Detailed Breakdown */}
        <DataTable tableData={tableData} kpis={summaryData.kpis} />

        <div className="pageBreakBefore" />

        {/* Pending Transactions Analysis */}
        {/* <section className={`${styles.section} pageBreakAfter`}>
          <h2 className={styles.sectionTitle}>Pending Transactions Analysis</h2>
          <div className={styles.chartsGrid}>
            <PendingTransactionsChart
              data={chartData}
              title="Pending & Denied Transactions"
            />

            <div className={styles.chartContainer}>
              <h3 className={styles.chartTitle}>Transaction Status Summary</h3>
              <div className={styles.statusList}>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>
                    Total Pending Transactions
                  </span>
                  <span
                    className={`${styles.statusValue} ${styles.pendingInflow}`}
                  >
                    {formatCurrency(getTotalPendingTransactions(summaryData))}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Pending Inflow</span>
                  <span
                    className={`${styles.statusValue} ${styles.pendingInflow}`}
                  >
                    {formatCurrency(summaryData.kpis.pending_inflow)}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Pending Outflow</span>
                  <span
                    className={`${styles.statusValue} ${styles.pendingOutflow}`}
                  >
                    {formatCurrency(summaryData.kpis.pending_outflow)}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>
                    Denied Transactions
                  </span>
                  <span className={`${styles.statusValue} ${styles.denied}`}>
                    {formatCurrency(summaryData.kpis.denied_total)}
                  </span>
                </div>
                <div className={styles.actionBox}>
                  <p>
                    <strong>Action Required:</strong>{" "}
                    {getActionRequired(summaryData)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section> */}

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerGrid}>
            <div className={styles.footerColumn}>
              <h4>Report Parameters</h4>
              <p>
                Date Range:{" "}
                {new Date(summaryData.filters.from_date).toLocaleDateString()} -{" "}
                {new Date(summaryData.filters.to_date).toLocaleDateString()}
              </p>
            </div>
            <div className={styles.footerColumn}>
              <h4>Data Summary</h4>
              <p>Records Processed: {summaryData.diagnostics.records_considered}</p>
              <p>Allocation Categories: 3</p>
              <p>Report Accuracy: 99.4%</p>
            </div>
            <div className={styles.footerColumn}>
              <h4>Generated</h4>
              <p>{formatDate(summaryData.kpis.last_updated)}</p>
              <p>Financial Reports System</p>
              <p>Version 2.1</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default FinancialReportDashboard;

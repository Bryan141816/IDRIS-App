import React, { useRef, useState } from "react";
import styles from "./MainPage.module.scss";
import RAFI_Shield from "../../../../media/RAFI_Shield.png";

// Replace with your real components
import ExecutiveSummary from "./ExecutiveSummary";
import { BarChartComponent, PieChartComponent } from "./Charts";
import PendingTransactionsChart from "./PendingTransactionChart";
import DataTable from "./DataTable";

import { jsPDF } from "jspdf";

// Types
type CompanyInfo = {
  name: string;
  tagline: string;
  address: { street: string; city: string; state: string; zip: string };
  contact: { phone: string; email: string };
};

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
  // IMPORTANT: capture the inner container for stable size
  const printableRef = useRef<HTMLDivElement>(null);
  const [exportMode, setExportMode] = useState(false);

  const data = {
    filters: {
      date_from: "2025-01-01",
      date_to: "2025-09-30",
      group_by: "allocation",
      include_pending: true,
    },
    kpis: {
      total_inflow: "825000.00",
      total_outflow: "603500.00",
      net_balance: "221500.00",
      pending_inflow: "12000.00",
      pending_outflow: "35000.00",
      denied_total: "5000.00",
      last_updated: "2025-09-19T10:58:11",
    },
    breakdown: {
      allocation: [
        {
          allocation: "EMERGENCY",
          inflow: "300000.00",
          outflow: "250000.00",
          net: "50000.00",
          pending_inflow: "0.00",
          pending_outflow: "10000.00",
          denied: "0.00",
        },
        {
          allocation: "FOOD_WATER",
          inflow: "200000.00",
          outflow: "180000.00",
          net: "20000.00",
          pending_inflow: "5000.00",
          pending_outflow: "0.00",
          denied: "0.00",
        },
        {
          allocation: "GENERAL",
          inflow: "325000.00",
          outflow: "173500.00",
          net: "151500.00",
          pending_inflow: "7000.00",
          pending_outflow: "25000.00",
          denied: "5000.00",
        },
      ],
    },
    diagnostics: { records_considered: 412 },
  };

  const reportTitle = `Financial Report • ${new Date(
    data.filters.date_from
  ).toLocaleDateString()} – ${new Date(
    data.filters.date_to
  ).toLocaleDateString()} • Grouped by ${String(
    data.filters.group_by
  ).toUpperCase()}`;

  companyInfo._reportTitle = reportTitle;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCurrency = (value: string | number | null | undefined) => {
    const num = Number.parseFloat(String(value ?? "0"));
    const safe = Number.isFinite(num) ? num : 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safe);
  };

  // Chart prep
  const chartData = data.breakdown.allocation.map((item) => ({
    name: item.allocation.replace(/_/g, " "),
    inflow: parseFloat(item.inflow),
    outflow: parseFloat(item.outflow),
    net: parseFloat(item.net),
    pending_inflow: parseFloat(item.pending_inflow),
    pending_outflow: parseFloat(item.pending_outflow),
    denied: parseFloat(item.denied),
  }));

  const pieData = chartData.map((item) => ({
    name: item.name,
    value: item.net,
  }));

  // PDF export via doc.html capturing the DOM
  const handleDownloadPDF = async () => {
    // Switch charts to <img> snapshots for reliable capture
    setExportMode(true);
    // Let React commit the DOM updates
    await new Promise((r) => setTimeout(r, 80));

    const el = printableRef.current;
    if (!el) return;

    // Debug: ensure the node has size
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      setExportMode(false);
      alert("Export container has zero size. Check the ref location.");
      return;
    }

    // Apply export skin (smaller fonts, break-inside avoid, etc.)
    el.classList.add("pdfExport");
    // Give the class a tick to apply
    await new Promise((r) => setTimeout(r, 0));

    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "letter" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = { top: 18, right: 15, bottom: 15, left: 15 };

    // Render the DOM wider so it gets downscaled into the PDF area
    // 1440 is a safe width; bump to 1600/1920 if you still want it smaller.
    const windowWidthPx = Math.max(Math.round(rect.width), 1440);

    try {
      await doc.html(el, {
        x: margin.left,
        y: margin.top,
        width: pageW - margin.left - margin.right, // mm in PDF
        windowWidth: windowWidthPx, // px to render DOM
        // Let jsPDF paginate. Keep options minimal for stability.
        html2canvas: {
          scale: 2, // crisp output; doesn't change physical size
          useCORS: true,
          backgroundColor: "#ffffff",
          // If you still get blanks due to CORS/images, try:
          // allowTaint: true,
          // foreignObjectRendering: false,
        },
      });

      const filename = `financial_report_${data.filters.date_from}_${data.filters.date_to}_${data.filters.group_by}`
        .replace(/[^\w\-]+/g, "_")
        .concat(".pdf");
      doc.save(filename);
    } finally {
      el.classList.remove("pdfExport");
      setExportMode(false);
    }
  };

  return (
    <div className={styles.budgetReport}>
      {/* Capture THIS inner container; it has a stable width/height */}
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
                <button
                  onClick={handleDownloadPDF}
                  className={styles.printButton}
                >
                  Download PDF
                </button>
              </div>
              <span>Total Records: {data.diagnostics.records_considered}</span>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <ExecutiveSummary kpis={data.kpis} />

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
        <DataTable data={data} kpis={data.kpis} />

        <div className="pageBreakBefore" />

        {/* Pending Transactions Analysis */}
        <section className={`${styles.section} pageBreakAfter`}>
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
                    {formatCurrency(47000)}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Pending Inflow</span>
                  <span
                    className={`${styles.statusValue} ${styles.pendingInflow}`}
                  >
                    {formatCurrency(data.kpis.pending_inflow)}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>Pending Outflow</span>
                  <span
                    className={`${styles.statusValue} ${styles.pendingOutflow}`}
                  >
                    {formatCurrency(data.kpis.pending_outflow)}
                  </span>
                </div>
                <div className={styles.statusItem}>
                  <span className={styles.statusLabel}>
                    Denied Transactions
                  </span>
                  <span className={`${styles.statusValue} ${styles.denied}`}>
                    {formatCurrency(data.kpis.denied_total)}
                  </span>
                </div>
                <div className={styles.actionBox}>
                  <p>
                    <strong>Action Required:</strong>{" "}
                    {formatCurrency(35000)} in pending outflows require immediate
                    review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerGrid}>
            <div className={styles.footerColumn}>
              <h4>Report Parameters</h4>
              <p>
                Date Range:{" "}
                {new Date(data.filters.date_from).toLocaleDateString()} -{" "}
                {new Date(data.filters.date_to).toLocaleDateString()}
              </p>
              <p>Group By: {data.filters.group_by}</p>
              <p>
                Include Pending: {data.filters.include_pending ? "Yes" : "No"}
              </p>
            </div>
            <div className={styles.footerColumn}>
              <h4>Data Summary</h4>
              <p>Records Processed: {data.diagnostics.records_considered}</p>
              <p>Allocation Categories: 3</p>
              <p>Report Accuracy: 99.4%</p>
            </div>
            <div className={styles.footerColumn}>
              <h4>Generated</h4>
              <p>{formatDate(data.kpis.last_updated)}</p>
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

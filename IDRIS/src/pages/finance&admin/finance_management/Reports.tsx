import React, { useEffect, useState } from "react";

/* ────────────────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────────────────── */
type ReportItem = {
  id: number;
  name: string;
  type: string;
  period: string;
  generated: string;
  status: "Generated" | "Draft";
};

type Mode = "reports" | "exports";

type ExportPreset =
  | "Complete Financial Log"
  | "Inflows Only"
  | "Outflows Only"
  | "Budget Summary";

type ExportFormat = "Excel (.xlsx)" | "PDF Report" | "CSV Data" | "JSON Data";

type ReportType =
  | "Monthly Summary"
  | "Quarterly Report"
  | "Annual Report"
  | "Donor Report"
  | "Expense Analysis"
  | "Budget vs Actual";

interface ExportData {
  exportType: ExportPreset;
  format: ExportFormat;
  fromDate?: string;
  toDate?: string;
  includeAttachments: boolean;
  addAuditTrail: boolean;
  includePending: boolean;
}

interface GenerateReportData {
  reportType: ReportType;
  fromDate?: string;
  toDate?: string;
  includeIncome: boolean;
  includeExpense: boolean;
  includeBudget: boolean;
  includeCompliance: boolean;
}

/* ────────────────────────────────────────────────────────────────────────────
   GenerateReportModal
   ──────────────────────────────────────────────────────────────────────────── */
const GenerateReportModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onGenerate?: (data: GenerateReportData) => void;
}> = ({ open, onClose, onGenerate }) => {
  const [reportType, setReportType] = useState<ReportType>("Monthly Summary");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [includeIncome, setIncludeIncome] = useState(true);
  const [includeExpense, setIncludeExpense] = useState(true);
  const [includeBudget, setIncludeBudget] = useState(true);
  const [includeCompliance, setIncludeCompliance] = useState(false);

  useEffect(() => {
    if (!open) return;
    // reset to defaults on open
    setReportType("Monthly Summary");
    setFromDate("");
    setToDate("");
    setIncludeIncome(true);
    setIncludeExpense(true);
    setIncludeBudget(true);
    setIncludeCompliance(false);
  }, [open]);

  if (!open) return null;

  const handleGenerate = () => {
    const payload: GenerateReportData = {
      reportType,
      fromDate,
      toDate,
      includeIncome,
      includeExpense,
      includeBudget,
      includeCompliance,
    };
    onGenerate?.(payload);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">
          <h3>Generate Financial Report</h3>

          <div className="form-group">
            <label>Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
              <option>Monthly Summary</option>
              <option>Quarterly Report</option>
              <option>Annual Report</option>
              <option>Donor Report</option>
              <option>Expense Analysis</option>
              <option>Budget vs Actual</option>
            </select>
          </div>

          <div className="form-group">
            <label>Period</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                type="date"
                placeholder="From"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input
                type="date"
                placeholder="To"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Include Sections</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={includeIncome}
                  onChange={(e) => setIncludeIncome(e.target.checked)}
                />{" "}
                Income Summary
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={includeExpense}
                  onChange={(e) => setIncludeExpense(e.target.checked)}
                />{" "}
                Expense Breakdown
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={includeBudget}
                  onChange={(e) => setIncludeBudget(e.target.checked)}
                />{" "}
                Budget Analysis
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={includeCompliance}
                  onChange={(e) => setIncludeCompliance(e.target.checked)}
                />{" "}
                Compliance Notes
              </label>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleGenerate}>
            Generate
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   ExportModal
   ──────────────────────────────────────────────────────────────────────────── */
const ExportModal: React.FC<{
  open: boolean;
  preset?: ExportPreset;
  onClose: () => void;
  onExport?: (data: ExportData) => void;
}> = ({ open, preset = "Complete Financial Log", onClose, onExport }) => {
  const [exportType, setExportType] = useState<ExportPreset>(preset);
  const [format, setFormat] = useState<ExportFormat>("Excel (.xlsx)");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [includeAttachments, setIncludeAttachments] = useState(false);
  const [addAuditTrail, setAddAuditTrail] = useState(false);
  const [includePending, setIncludePending] = useState(false);

  useEffect(() => {
    if (!open) return;
    // reset each time it opens and respect incoming preset
    setExportType(preset);
    setFormat("Excel (.xlsx)");
    setFromDate("");
    setToDate("");
    setIncludeAttachments(false);
    setAddAuditTrail(false);
    setIncludePending(false);
  }, [open, preset]);

  if (!open) return null;

  const handleExport = () => {
    const payload: ExportData = {
      exportType,
      format,
      fromDate,
      toDate,
      includeAttachments,
      addAuditTrail,
      includePending,
    };
    onExport?.(payload);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-content">
          <h3>Export Financial Logs</h3>

          <div className="form-group">
            <label>Export Type</label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as ExportPreset)}
            >
              <option>Complete Financial Log</option>
              <option>Inflows Only</option>
              <option>Outflows Only</option>
              <option>Budget Summary</option>
            </select>
          </div>

          <div className="form-group">
            <label>Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <option>Excel (.xlsx)</option>
              <option>PDF Report</option>
              <option>CSV Data</option>
              <option>JSON Data</option>
            </select>
          </div>

          <div className="form-group">
            <label>Date Range</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                type="date"
                placeholder="From"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <input
                type="date"
                placeholder="To"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Additional Options</label>
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={includeAttachments}
                  onChange={(e) => setIncludeAttachments(e.target.checked)}
                />{" "}
                Include attachments
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={addAuditTrail}
                  onChange={(e) => setAddAuditTrail(e.target.checked)}
                />{" "}
                Add audit trail
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={includePending}
                  onChange={(e) => setIncludePending(e.target.checked)}
                />{" "}
                Include pending transactions
              </label>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-btn" onClick={handleExport}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   ReportsView
   ──────────────────────────────────────────────────────────────────────────── */
type ExportModalProps = React.ComponentProps<typeof ExportModal>;

const ReportsView: React.FC<{
  reports: ReportItem[];
  onOpenGenerate: () => void;
  onOpenExport: (preset?: ExportModalProps["preset"]) => void;
}> = ({ reports, onOpenGenerate, onOpenExport }) => (
  <div className="reports-content">
    <div className="section-header">
      <h2>Review Financial Reports</h2>
      <div className="header-actions">
        <button className="secondary-btn" onClick={onOpenGenerate}>
          📊 Generate Budget Summary
        </button>
        <button className="primary-btn" onClick={onOpenGenerate}>
          + Generate Report
        </button>
      </div>
    </div>

    <div className="reports-grid">
      {reports.map((r) => (
        <div key={r.id} className="report-card">
          <div className="report-header">
            <h3>{r.name}</h3>
            <span className={`status-badge ${r.status.toLowerCase()}`}>
              {r.status}
            </span>
          </div>
          <div className="report-details">
            <div className="detail-row">
              <span>Type:</span>
              <span>{r.type}</span>
            </div>
            <div className="detail-row">
              <span>Period:</span>
              <span>{r.period}</span>
            </div>
            <div className="detail-row">
              <span>Generated:</span>
              <span>{new Date(r.generated).toLocaleDateString()}</span>
            </div>
            <div className="report-actions">
              <button className="action-btn" onClick={onOpenGenerate}>
                View
              </button>
              <button
                className="action-btn"
                onClick={() => onOpenExport("Complete Financial Log")}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="audit-section">
      <h3>Generate Budget Summaries and Audits</h3>
      <div className="audit-actions">
        <button className="audit-btn" onClick={onOpenGenerate}>
          📈 Monthly Audit
        </button>
        <button className="audit-btn" onClick={onOpenGenerate}>
          📊 Quarterly Review
        </button>
        <button className="audit-btn" onClick={onOpenGenerate}>
          📋 Annual Summary
        </button>
        <button className="audit-btn" onClick={onOpenGenerate}>
          ✅ Compliance Audit
        </button>
      </div>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   ExportsView
   ──────────────────────────────────────────────────────────────────────────── */
const ExportsView: React.FC<{
  onOpen: (preset?: ExportModalProps["preset"]) => void;
}> = ({ onOpen }) => (
  <div className="exports-content">
    <div className="section-header">
      <h2>Export Financial Logs</h2>
      <button
        className="primary-btn"
        onClick={() => onOpen("Complete Financial Log")}
      >
        📤 Export Data
      </button>
    </div>

    <div className="export-options">
      <div className="export-card">
        <div className="export-icon">📊</div>
        <h3>Complete Financial Log</h3>
        <p>Export all inflows, outflows, and transactions</p>
        <button
          className="export-btn"
          onClick={() => onOpen("Complete Financial Log")}
        >
          Export Complete Log
        </button>
      </div>

      <div className="export-card">
        <div className="export-icon">💰</div>
        <h3>Inflow Summary</h3>
        <p>Export donations, grants, and income sources</p>
        <button className="export-btn" onClick={() => onOpen("Inflows Only")}>
          Export Inflows
        </button>
      </div>

      <div className="export-card">
        <div className="export-icon">💸</div>
        <h3>Expense Report</h3>
        <p>Export all expenditures and purchases</p>
        <button className="export-btn" onClick={() => onOpen("Outflows Only")}>
          Export Expenses
        </button>
      </div>

      <div className="export-card">
        <div className="export-icon">📈</div>
        <h3>Budget Analysis</h3>
        <p>Export budget vs actual spending analysis</p>
        <button className="export-btn" onClick={() => onOpen("Budget Summary")}>
          Export Budget Report
        </button>
      </div>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Parent: ReportsExportsSection
   ──────────────────────────────────────────────────────────────────────────── */
const ReportsExportsSection: React.FC<{
  mode: Mode;
  reports?: ReportItem[];
}> = ({ mode, reports = [] }) => {
  const [openGen, setOpenGen] = useState(false);
  const [openExport, setOpenExport] = useState<{
    open: boolean;
    preset?: ExportModalProps["preset"];
  }>({ open: false });

  // handlers; replace console.log with your API calls
  const handleGenerate = (data: GenerateReportData) => {
    console.log("GENERATE REPORT →", data);
  };

  const handleExport = (data: ExportData) => {
    console.log("EXPORT DATA →", data);
  };

  return (
    <>
      {mode === "reports" ? (
        <ReportsView
          reports={reports}
          onOpenGenerate={() => setOpenGen(true)}
          onOpenExport={(preset) => setOpenExport({ open: true, preset })}
        />
      ) : (
        <ExportsView
          onOpen={(preset) => setOpenExport({ open: true, preset })}
        />
      )}

      <GenerateReportModal
        open={openGen}
        onClose={() => setOpenGen(false)}
        onGenerate={handleGenerate}
      />

      <ExportModal
        open={openExport.open}
        preset={openExport.preset}
        onClose={() => setOpenExport({ open: false })}
        onExport={handleExport}
      />
    </>
  );
};

export default ReportsExportsSection;

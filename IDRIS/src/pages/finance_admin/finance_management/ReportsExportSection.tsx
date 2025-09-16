import React, { useState } from "react";
import GenerateReportModal from "./GenerateReportModal";
import ExportModal, { ExportPreset } from "./ExportModal";

type Mode = "reports" | "exports";

type ReportItem = {
  id: number;
  name: string;
  type: string;
  period: string;
  generated: string;
  status: "Generated" | "Draft";
};

type ExportModalState = { open: boolean; preset?: ExportPreset };

const ReportsView: React.FC<{
  reports: ReportItem[];
  onOpenGenerate: () => void;
  onOpenExport: (preset?: ExportPreset) => void;
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
            <span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span>
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
              <button className="action-btn" onClick={onOpenGenerate}>View</button>
              <button className="action-btn" onClick={() => onOpenExport("Complete Financial Log")}>
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
        <button className="audit-btn" onClick={onOpenGenerate}>📈 Monthly Audit</button>
        <button className="audit-btn" onClick={onOpenGenerate}>📊 Quarterly Review</button>
        <button className="audit-btn" onClick={onOpenGenerate}>📋 Annual Summary</button>
        <button className="audit-btn" onClick={onOpenGenerate}>✅ Compliance Audit</button>
      </div>
    </div>
  </div>
);

const ExportsView: React.FC<{
  onOpen: (preset?: ExportPreset) => void;
}> = ({ onOpen }) => (
  <div className="exports-content">
    <div className="section-header">
      <h2>Export Financial Logs</h2>
      <button className="primary-btn" onClick={() => onOpen("Complete Financial Log")}>
        📤 Export Data
      </button>
    </div>

    <div className="export-options">
      <div className="export-card">
        <div className="export-icon">📊</div>
        <h3>Complete Financial Log</h3>
        <p>Export all inflows, outflows, and transactions</p>
        <button className="export-btn" onClick={() => onOpen("Complete Financial Log")}>
          Export Complete Log
        </button>
      </div>

      <div className="export-card">
        <div className="export-icon">💰</div>
        <h3>Inflow Summary</h3>
        <p>Export donations, grants, and income sources</p>
        <button className="export-btn" onClick={() => onOpen("Inflows Only")}>Export Inflows</button>
      </div>

      <div className="export-card">
        <div className="export-icon">💸</div>
        <h3>Expense Report</h3>
        <p>Export all expenditures and purchases</p>
        <button className="export-btn" onClick={() => onOpen("Outflows Only")}>Export Expenses</button>
      </div>

      <div className="export-card">
        <div className="export-icon">📈</div>
        <h3>Budget Analysis</h3>
        <p>Export budget vs actual spending analysis</p>
        <button className="export-btn" onClick={() => onOpen("Budget Summary")}>Export Budget Report</button>
      </div>
    </div>
  </div>
);

const ReportsExportsSection: React.FC<{
  mode: Mode;
  reports?: ReportItem[];
}> = ({ mode, reports = [] }) => {
  const [openGen, setOpenGen] = useState(false);
  const [openExport, setOpenExport] = useState<ExportModalState>({ open: false });

  return (
    <>
      {mode === "reports" ? (
        <ReportsView
          reports={reports}
          onOpenGenerate={() => setOpenGen(true)}
          onOpenExport={(preset) => setOpenExport({ open: true, preset })}
        />
      ) : (
        <ExportsView onOpen={(preset) => setOpenExport({ open: true, preset })} />
      )}

      <GenerateReportModal open={openGen} onClose={() => setOpenGen(false)} />

      <ExportModal
        open={openExport.open}
        preset={openExport.preset}
        onClose={() => setOpenExport({ open: false })}
      />
    </>
  );
};

export default ReportsExportsSection;

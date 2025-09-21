import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  onOpenGenerate: () => void;
  onOpenExport: (preset?: ExportPreset) => void;
  onOpenGenerateSummary: () => void;
}> = ({ onOpenGenerate, onOpenExport, onOpenGenerateSummary }) => {
  const navigate = useNavigate();

  return (
    <div className="reports-content">
      <div className="section-header">
        <h2>Review Financial Reports</h2>
        <div className="header-actions">
          <button className="secondary-btn" onClick={onOpenGenerateSummary}>
            📊 Generate Budget Summary
          </button>
          <button className="primary-btn" onClick={onOpenGenerate}>
            + Generate Report
          </button>
        </div>
      </div>

      <div className="audit-section">
        <h3>Generate Budget Summaries and Audits</h3>
        <div className="audit-actions">
          <button className="audit-btn" onClick={onOpenGenerate}>📈 Monthly Audit</button>
          <button className="audit-btn" onClick={onOpenGenerate}>📊 Quarterly Review</button>
          <button className="audit-btn" onClick={onOpenGenerate}>📋 Annual Summary</button>
        </div>
      </div>
    </div>
  );
};

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
}> = ({ mode = [] }) => {
  const [openGen, setOpenGen] = useState(false);
  const [openExport, setOpenExport] = useState<ExportModalState>({ open: false });
  const [openSummary, setOpenSummary] = useState(false);

  return (
    <>
      {mode === "reports" && (
        <>
        <ReportsView
          onOpenGenerate={() => setOpenGen(true)}
          onOpenExport={(preset) => setOpenExport({ open: true, preset })}
          onOpenGenerateSummary={() => setOpenSummary(true) }
        />
        <br />
        <ExportsView onOpen={(preset) => setOpenExport({ open: true, preset })} />
        </>
      )
      }

      <GenerateReportModal open={openGen} onClose={() => setOpenGen(false)} />
      <GenerateReportModal open={ openSummary } onClose={() => setOpenSummary(false)} isSummary={true} />

      <ExportModal
        open={openExport.open}
        preset={openExport.preset}
        onClose={() => setOpenExport({ open: false })}
      />
    </>
  );
};

export default ReportsExportsSection;

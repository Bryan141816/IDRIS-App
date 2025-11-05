import React, { useState } from "react";
import GenerateReportModal from "./GenerateReportModal";
import GenerateInflowsModal from "./GenerateInflowsModal";
import ExportModal, { ExportPreset } from "./ExportModal";

type Mode = "reports" | "exports";

type ExportModalState = { open: boolean; preset?: ExportPreset };

const ReportsView: React.FC<{
  onOpenGenerate: () => void;
  onOpenExport: (preset?: ExportPreset) => void;
  onOpenGenerateSummary: () => void;
  onOpenGenerateInflowsOrOutflows: () => void;
  onInflowReportSelect: (isInflows: boolean) => void;
}> = ({ onOpenGenerate, onOpenExport, onOpenGenerateSummary, onOpenGenerateInflowsOrOutflows, onInflowReportSelect }) => {

  return (
    <div className="reports-content">
      <div id='reports-content-header'>
        <button id="modalOverlayClose">X</button>
      </div>

      {/* <div className="section-header">
        <h2>Review Financial Reports</h2>
        <div className="header-actions">
          <button className="secondary-btn" onClick={onOpenGenerateSummary}>
            📊 Generate Budget Summary
          </button>
          <button className="primary-btn" onClick={onOpenGenerate}>
            + Generate Report
          </button>
        </div>
      </div> */}

      <div className="export-options">
        <div className="export-card">
          <div className="export-icon">📊</div>
          <h3>Generate Budget Summary</h3>
          <p>Overall Graphical Summary of Inflows and Outflows</p>
          <button className="export-btn" onClick={onOpenGenerateSummary}>
            Export
          </button>
        </div>

        <div className="export-card">
          <div className="export-icon">💰</div>
          <h3>Inflow Summary</h3>
          <p>Export donations, grants, and income sources</p>
          <button className="export-btn" onClick={() => {
            onInflowReportSelect(true);
            onOpenGenerateInflowsOrOutflows();
          }}>Export Inflows</button>
        </div>

        <div className="export-card">
          <div className="export-icon">💸</div>
          <h3>Expense Report</h3>
          <p>Export all expenditures and purchases</p>
          <button className="export-btn" onClick={() => {
            onInflowReportSelect(false);
            onOpenGenerateInflowsOrOutflows();
          }}>Export Expenses</button>
        </div>

        <div className="export-card">
          <div className="export-icon">💰 + 💸</div>
          <h3>Inflows and Outflows Report</h3>
          <p>Export all Inflows and Outflows</p>
          <button className="export-btn" onClick={() => {
            onInflowReportSelect(false);
            onOpenGenerateInflowsOrOutflows();
          }}>Export</button>
        </div>
      </div>
      <div id='reports-content-footer'>
        <button className="finance-report-cancel">Cancel</button>
      </div>

    </div>
  );
};

export const ReportsExportsSection: React.FC<{
  mode: Mode;
}> = ({ mode = [] }) => {
  const [openGen, setOpenGen] = useState(false);
  const [openExport, setOpenExport] = useState<ExportModalState>({ open: false });
  const [openSummary, setOpenSummary] = useState(false);
  const [openGenInflowsOrOutflows, setOpenGenInflowsOrOutflows] = useState<boolean>(false);
  const [_isInflows, setIsInflows] = useState<boolean>();

  return (
    <>
      {mode === "reports" && (
        <>
          <ReportsView
            onOpenGenerate={() => setOpenGen(true)}
            onOpenExport={(preset) => setOpenExport({ open: true, preset })}
            onOpenGenerateSummary={() => setOpenSummary(true)}
            onOpenGenerateInflowsOrOutflows={() => setOpenGenInflowsOrOutflows(true)}
            onInflowReportSelect={setIsInflows}
          />
          <br />
          {/* <ExportsView onOpen={(preset) => setOpenExport({ open: true, preset })} /> */}
        </>
      )
      }

      <GenerateReportModal open={openGen} onClose={() => setOpenGen(false)} />
      <GenerateReportModal open={openSummary} onClose={() => setOpenSummary(false)} isSummary={true} />
      <GenerateInflowsModal open={openGenInflowsOrOutflows} onClose={() => setOpenGenInflowsOrOutflows(false)} isInflows={_isInflows} />

      <ExportModal
        open={openExport.open}
        preset={openExport.preset}
        onClose={() => setOpenExport({ open: false })}
      />
    </>
  );
};

export default ReportsExportsSection;





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
        <h3>Inflow Report</h3>
        <p>Export donations, grants, and income sources</p>
        <button className="export-btn" onClick={() => onOpen("Inflows Only")}>Export Inflows</button>
      </div>

      <div className="export-card">
        <div className="export-icon">💸</div>
        <h3>Outflow Report</h3>
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

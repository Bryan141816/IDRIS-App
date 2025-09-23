import React, { useEffect, useState } from "react";
import { getReportData } from "../../../API_Handler/finance_management_handler";
import {
  downloadFinanceReportPDFFromRows,
  previewPrintFinanceReportFromRowsUserGesture,
  type Finance,
  type CompanyInfo,
} from "./FinanceReport";

export type ExportPreset =
  | "Complete Financial Log"
  | "Inflows Only"
  | "Outflows Only"
  | "Budget Summary";

export type ExportFormat =
  | "Excel (.xlsx)"
  | "PDF Report"
  | "CSV Data"
  | "JSON Data"
  | "Print";

export type FinanceStatuses =
  | "PENDING"
  | "RECEIVED"
  | "PAID"
  | "APPROVED"
  | "DENIED"
  | "RECONCILED";

export type BudgetAllocations =
  | "EMERGENCY SUPPLIES"
  | "FOOD AND WATER"
  | "TRANSPORTATION"
  | "EQUIPMENT"
  | "ADMINISTRATIVE"
  | "DONATIONS"
  | "GENERAL";

type ReportType = "Monthly" | "Quarterly" | "Annual";

type Props = {
  open: boolean;
  preset?: ExportPreset;
  onClose: () => void;
};

const ExportModal: React.FC<Props> = ({ open, preset = "Complete Financial Log", onClose }) => {
  // Period picker (same UX as Generate for consistency)
  const [reportType, setReportType] = useState<ReportType>("Monthly");
  const [monthValue, setMonthValue] = useState<string>("");
  const [quarterYear, setQuarterYear] = useState<string>("");
  const [quarter, setQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4" | "">("");
  const [yearValue, setYearValue] = useState<string>("");

  // Export filters/format
  const [exportType, setExportType] = useState<ExportPreset>(preset);
  const [format, setFormat] = useState<ExportFormat>("Excel (.xlsx)");
  const [budgetAllocation, setBudgetAllocation] = useState<BudgetAllocations[]>([]);
  const [financeStatus, setFinanceStatus] = useState<FinanceStatuses[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReportType("Monthly");
    setMonthValue("");
    setQuarterYear("");
    setQuarter("");
    setYearValue("");

    setExportType(preset);
    setFormat("Excel (.xlsx)");
    setBudgetAllocation([]);
    setFinanceStatus([]);
  }, [open, preset]);

  const invalidPeriodMsg = (() => {
    if (reportType === "Monthly" && !monthValue) return "Select a month.";
    if (reportType === "Quarterly" && (!quarterYear || !quarter)) return "Select year and quarter.";
    if (reportType === "Annual" && !yearValue) return "Select a year.";
    return "";
  })();

  const computeRange = (): { from?: string; to?: string; error?: string } => {
    if (reportType === "Monthly") {
      if (!monthValue) return { error: "Select a month." };
      const [y, m] = monthValue.split("-").map(Number);
      const from = new Date(y, m - 1, 1);
      const to = new Date(y, m, 0);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    }
    if (reportType === "Quarterly") {
      if (!quarterYear || !quarter) return { error: "Select year and quarter." };
      const y = Number(quarterYear);
      const map = { Q1: [0, 2], Q2: [3, 5], Q3: [6, 8], Q4: [9, 11] } as const;
      const [startM, endM] = map[quarter];
      const from = new Date(y, startM, 1);
      const to = new Date(y, endM + 1, 0);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    }
    if (!yearValue) return { error: "Select a year." };
    const y = Number(yearValue);
    const from = new Date(y, 0, 1);
    const to = new Date(y, 12, 0);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  };

  const handleBudgetAllocations = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBudgetAllocation(Array.from(e.target.selectedOptions, (o) => o.value) as BudgetAllocations[]);
  };

  const handleStatuses = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFinanceStatus(Array.from(e.target.selectedOptions, (o) => o.value) as FinanceStatuses[]);
  };

  const handleExport = async () => {
    const { from, to, error } = computeRange();
    if (error) return;

    const statuses = (financeStatus as unknown as string[]) || undefined;
    const allocation_type = (budgetAllocation as unknown as string[]) || undefined;

    setLoading(true);

    try {
      const results = await getReportData(from, to, statuses, allocation_type);

      const rangeLabel =
        reportType === "Monthly"
          ? monthValue
          : reportType === "Quarterly"
          ? `${quarterYear} ${quarter}`
          : yearValue;

      const reportTitle = [
        "Finance Report",
        rangeLabel ? `(${rangeLabel})` : "",
        allocation_type?.length ? `• ${allocation_type.join(", ")}` : "",
        statuses?.length ? `• ${statuses.join(", ")}` : "",
        exportType ? `• ${exportType}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      const companyInfo: CompanyInfo = {
        name: "RAFI Inc.",
        tagline: "The Ramon Aboitiz Foundation Inc.",
        address: { street: "35 Eduardo Aboitiz St", city: "Cebu City", state: "Philippines", zip: "6000" },
        contact: { phone: "(09) 000-000-0000", email: "sampleemail@gmail.com" },
      };

      // Route by format
      if (format === "Print") {
        await previewPrintFinanceReportFromRowsUserGesture(results as Finance[], {
          currency: "PHP",
          reportTitle,
          companyInfo,
          logoUrl: "/logo.png",
        });
      } else if (format === "PDF Report") {
        await downloadFinanceReportPDFFromRows(results as Finance[], {
          currency: "PHP",
          reportTitle,
          companyInfo,
          logoUrl: "/logo.png",
        });
      } else {
        // TODO: plug in your Excel/CSV/JSON exporters here
        console.log(`[${format}] export requested — implement your generator here.`);
        console.log("Raw rows:", results);
      }

      onClose();
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <h3>Export Financial Logs</h3>

          {/* Period */}
          <div className="form-group">
            <label>Period Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annual</option>
            </select>
          </div>
          <div className="form-group">
            <label>Period</label>
            {reportType === "Monthly" && (
              <input type="month" value={monthValue} onChange={(e) => setMonthValue(e.target.value)} />
            )}
            {reportType === "Quarterly" && (
              <div style={{ display: "flex", gap: "1rem" }}>
                <input
                  type="number"
                  placeholder="Year (e.g., 2025)"
                  value={quarterYear}
                  onChange={(e) => setQuarterYear(e.target.value)}
                  min={1970}
                  max={9999}
                />
                <select value={quarter} onChange={(e) => setQuarter(e.target.value as any)}>
                  <option value="">Select Quarter</option>
                  <option value="Q1">Q1 (Jan–Mar)</option>
                  <option value="Q2">Q2 (Apr–Jun)</option>
                  <option value="Q3">Q3 (Jul–Sep)</option>
                  <option value="Q4">Q4 (Oct–Dec)</option>
                </select>
              </div>
            )}
            {reportType === "Annual" && (
              <input
                type="number"
                placeholder="Year (e.g., 2025)"
                value={yearValue}
                onChange={(e) => setYearValue(e.target.value)}
                min={1970}
                max={9999}
              />
            )}
            {invalidPeriodMsg && <small className="error-text">{invalidPeriodMsg}</small>}
          </div>

          {/* Preset */}
          <div className="form-group">
            <label>Export Type (Preset)</label>
            <select value={exportType} onChange={(e) => setExportType(e.target.value as ExportPreset)}>
              <option>Complete Financial Log</option>
              <option>Inflows Only</option>
              <option>Outflows Only</option>
              <option>Budget Summary</option>
            </select>
          </div>

          {/* Filters */}
          <div className="form-group">
            <label>Budget Allocation</label>
            <select multiple value={budgetAllocation} onChange={handleBudgetAllocations}>
              <option>EMERGENCY SUPPLIES</option>
              <option>FOOD AND WATER</option>
              <option>TRANSPORTATION</option>
              <option>EQUIPMENT</option>
              <option>ADMINISTRATIVE</option>
              <option>DONATIONS</option>
              <option>GENERAL</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select multiple value={financeStatus} onChange={handleStatuses}>
              <option>PENDING</option>
              <option>PAID</option>
              <option>RECEIVED</option>
              <option>APPROVED</option>
              <option>DENIED</option>
              <option>RECONCILED</option>
            </select>
          </div>

          {/* Format */}
          <div className="form-group">
            <label>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
              <option>Excel (.xlsx)</option>
              <option>PDF Report</option>
              <option>CSV Data</option>
              <option>JSON Data</option>
              <option>Print</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="primary-btn" onClick={handleExport} disabled={!!invalidPeriodMsg || loading}>
            {loading ? "Exporting…" : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;

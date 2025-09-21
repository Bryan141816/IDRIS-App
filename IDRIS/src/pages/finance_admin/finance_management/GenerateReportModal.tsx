import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom
import { getReportData } from "../../../API_Handler/finance_management_handler";
import {
  downloadFinanceReportPDFFromRows,
  previewPrintFinanceReportFromRowsUserGesture,
  type Finance,
  type CompanyInfo,
} from "./FinanceReport";

export type ReportType = "Monthly" | "Quarterly" | "Annual";
type ExportFormat = "PDF Report" | "Print";

// Local filter enums (adjust to match your backend exactly)
type FinanceStatuses =
  | "PENDING"
  | "RECEIVED"
  | "PAID"
  | "APPROVED"
  | "DENIED"
  | "RECONCILED";

type BudgetAllocations =
  | "EMERGENCY SUPPLIES"
  | "FOOD AND WATER"
  | "TRANSPORTATION"
  | "EQUIPMENT"
  | "ADMINISTRATIVE"
  | "DONATIONS"
  | "GENERAL";

type Props = {
  open: boolean;
  onClose: () => void;
  isSummary?: boolean;
};

const GenerateReportModal: React.FC<Props> = ({ open, onClose, isSummary = false }) => {
  const navigate = useNavigate(); // Initialize navigate

  const [reportType, setReportType] = useState<ReportType>("Monthly");

  // Period state
  const [monthValue, setMonthValue] = useState<string>(""); // "01".."12"
  const [quarter, setQuarter] = useState<"Q1" | "Q2" | "Q3" | "Q4" | "">("");
  const [yearValue, setYearValue] = useState<string>(""); // "YYYY"

  // Filters (NEW)
  const [budgetAllocation, setBudgetAllocation] = useState<BudgetAllocations[]>([]);
  const [financeStatus, setFinanceStatus] = useState<FinanceStatuses[]>([]);

  // Output format for "Generate"
  const [format, setFormat] = useState<ExportFormat>("PDF Report");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReportType("Monthly");
    setMonthValue("");
    setYearValue("");
    setQuarter("");
    setBudgetAllocation([]);
    setFinanceStatus([]);
    setFormat("PDF Report");
  }, [open]);

  const invalidPeriodMsg = (() => {
    if (reportType === "Monthly" && (!yearValue || !monthValue)) return "Select a month.";
    if (reportType === "Quarterly" && (!yearValue || !quarter)) return "Select year and quarter.";
    if (reportType === "Annual" && !yearValue) return "Select a year.";
    return "";
  })();

  const computeRange = (): { from?: string; to?: string; error?: string } => {
    if (reportType === "Monthly") {
      if (!yearValue || !monthValue) return { error: "Select year and month." };
      const y = Number(yearValue);
      const m = Number(monthValue);
      const from = new Date(y, m - 1, 1);
      const to = new Date(y, m, 0);
      return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
    }

    if (reportType === "Quarterly") {
      if (!yearValue || !quarter) return { error: "Select year and quarter." };
      const y = Number(yearValue);
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

  // Handlers for filters (NEW)
  const handleBudgetAllocations = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value) as BudgetAllocations[];
    setBudgetAllocation(selected);
  };
  const handleStatuses = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value) as FinanceStatuses[];
    setFinanceStatus(selected);
  };

  const handleGenerateReport = async () => {
    const { from, to, error } = computeRange();
    if (error) return;

    setLoading(true);
    try {
      // pass filters to the API
      const normalizedAllocations = budgetAllocation.map((a) => {
        const val = a.toLowerCase();

        if (val.includes("emergency")) return "EMERGENCY";
        if (val.includes("food") || val.includes("water")) return "FOOD AND WATER";
        if (val.includes("transport")) return "TRANSPORTATION";
        if (val.includes("equip")) return "EQUIPMENT";
        if (val.includes("admin")) return "ADMINISTRATIVE";
        if (val.includes("donation")) return "DONATIONS";
        if (val.includes("general")) return "GENERAL";

        return a; // fallback if nothing matched
      });

      const normalizedStatuses = financeStatus.map((s) => {
        const val = s.toLowerCase();

        if (val.includes("pending")) return "PENDING";
        if (val.includes("received")) return "RECEIVED";
        if (val.includes("paid")) return "PAID";
        if (val.includes("approved")) return "APPROVED";
        if (val.includes("denied")) return "DENIED";
        if (val.includes("reconciled")) return "RECONCILED";

        return s; // fallback
      });

      const results = await getReportData(from, to, normalizedStatuses, normalizedAllocations);

      const rangeLabel =
        reportType === "Monthly"
          ? `${yearValue}-${monthValue}`
          : reportType === "Quarterly"
            ? `${yearValue} ${quarter}`
            : yearValue;

      const reportTitle = [
        "Finance Report",
        rangeLabel ? `(${rangeLabel})` : "",
        normalizedAllocations?.length ? `• ${normalizedAllocations.join(", ")}` : "",
        normalizedStatuses?.length ? `• ${normalizedStatuses.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      const companyInfo: CompanyInfo = {
        name: "RAFI Inc.",
        tagline: "The Ramon Aboitiz Foundation Inc.",
        address: { street: "35 Eduardo Aboitiz St", city: "Cebu City", state: "Philippines", zip: "6000" },
        contact: { phone: "(09) 000-000-0000", email: "sampleemail@gmail.com" },
      };

      // Redirect to /finance_printable with the finance data
      console.log("results", results);
      navigate("/finance_printable", { state: { finances: results } });

      onClose();
    } catch (err) {
      console.error("Generate (PDF/Print) failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBudgetSummary = () => {
    const { from, to, error } = computeRange();
    if (error) return;

    console.log("from:", from, " and to:", to);

    navigate("/finance&admin/finance_management/budget_summary", {
      state: { date_from: from, date_to: to }
    });
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          { isSummary ? 
            <h3>Generate Budget Summary</h3> :
            <h3>Generate Financial Report</h3>
          }

          {/* Report Type */}
          <div className="form-group">
            <label>Report Type</label>
            <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
              <option>Monthly</option>
              <option>Quarterly</option>
              <option>Annual</option>
            </select>
          </div>

          {/* Period */}
          <div className="form-group">
            <label>Period</label>

            {reportType === "Monthly" && (
              <div style={{ display: "flex", gap: "1rem" }}>
                {/* Year */}
                <select value={yearValue} onChange={(e) => setYearValue(e.target.value)}>
                  <option value="">Select Year</option>
                  {Array.from({ length: 15 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    );
                  })}
                </select>

                {/* Month */}
                <select value={monthValue} onChange={(e) => setMonthValue(e.target.value)}>
                  <option value="">Select Month</option>
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
            )}

            {reportType === "Quarterly" && (
              <div style={{ display: "flex", gap: "1rem" }}>
                {/* Year */}
                <select value={yearValue} onChange={(e) => setYearValue(e.target.value)}>
                  <option value="">Select Year</option>
                  {Array.from({ length: 15 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    );
                  })}
                </select>
                {/* Quarter */}
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
              <select value={yearValue} onChange={(e) => setYearValue(e.target.value)}>
                <option value="">Select Year</option>
                {Array.from({ length: 15 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
            )}

            {invalidPeriodMsg && <small className="error-text">{invalidPeriodMsg}</small>}
          </div>

          {/* Filters (NEW) */}

          {!isSummary &&
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
          }

          {!isSummary &&
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
          }

          {/* Output format */}
          <div className="form-group">
            <label>Format</label>
            <select value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
              {/* <option>PDF Report</option> */}
              <option selected>Print</option>
            </select>
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={isSummary ? handleGenerateBudgetSummary : handleGenerateReport}
            disabled={!!invalidPeriodMsg || loading}
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateReportModal;

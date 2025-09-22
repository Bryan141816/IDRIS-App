import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInflowsReport } from '../../../API_Handler/finance_management_handler';

type ReportType = "Monthly" | "Quarterly" | "Annual";
type FinanceStatus = "PENDING" | "RECEIVED";
type ExportFormat = "Print";

interface Props {
  open: boolean;
  onClose: () => void;
  isInflows?: boolean;
  navigatePath?: string; // default: "/finance&admin/finance_management/inflows"
}

const years = Array.from({ length: 15 }, (_, i) => `${new Date().getFullYear() - i}`);

const monthOptions = [
  { v: "01", label: "January" },
  { v: "02", label: "February" },
  { v: "03", label: "March" },
  { v: "04", label: "April" },
  { v: "05", label: "May" },
  { v: "06", label: "June" },
  { v: "07", label: "July" },
  { v: "08", label: "August" },
  { v: "09", label: "September" },
  { v: "10", label: "October" },
  { v: "11", label: "November" },
  { v: "12", label: "December" },
];

const quarterMap = { Q1: [0, 2], Q2: [3, 5], Q3: [6, 8], Q4: [9, 11] } as const;
type Quarter = keyof typeof quarterMap;

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

const computeRange = (
  reportType: ReportType,
  yearValue: string,
  monthValue: string,
  quarter: Quarter | ""
): { from?: string; to?: string; error?: string } => {
  if (reportType === "Monthly") {
    if (!yearValue || !monthValue) return { error: "Select year and month." };
    const y = Number(yearValue);
    const m = Number(monthValue);
    const from = new Date(Date.UTC(y, m - 1, 1));
    const to = new Date(Date.UTC(y, m, 0));
    return { from: toISODate(from), to: toISODate(to) };
  }

  if (reportType === "Quarterly") {
    if (!yearValue || !quarter) return { error: "Select year and quarter." };
    const y = Number(yearValue);
    const [startM, endM] = quarterMap[quarter];
    const from = new Date(Date.UTC(y, startM, 1));
    const to = new Date(Date.UTC(y, endM + 1, 0));
    return { from: toISODate(from), to: toISODate(to) };
  }

  if (!yearValue) return { error: "Select a year." };
  const y = Number(yearValue);
  const from = new Date(Date.UTC(y, 0, 1));
  const to = new Date(Date.UTC(y, 11, 31));
  return { from: toISODate(from), to: toISODate(to) };
};

const GenerateInflowsModal: React.FC<Props> = ({
  open,
  onClose,
  isInflows = true,
  navigatePath = "/finance&admin/finance_management/inflows",
}) => {
  const navigate = useNavigate();

  const [reportType, setReportType] = useState<ReportType>("Monthly");
  const [monthValue, setMonthValue] = useState<string>("");
  const [quarter, setQuarter] = useState<Quarter | "">("");
  const [yearValue, setYearValue] = useState<string>("");

  // Status limited to Pending & Received
  const [financeStatus, setFinanceStatus] = useState<FinanceStatus[]>(["PENDING", "RECEIVED"]);

  const [format, setFormat] = useState<ExportFormat>("Print");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setReportType("Monthly");
    setMonthValue("");
    setQuarter("");
    setYearValue("");
    setFinanceStatus(["PENDING", "RECEIVED"]);
    setFormat("Print");
  }, [open]);

  const invalidPeriodMsg =
    (reportType === "Monthly" && (!yearValue || !monthValue) && "Select a month.") ||
    (reportType === "Quarterly" && (!yearValue || !quarter) && "Select year and quarter.") ||
    (reportType === "Annual" && !yearValue && "Select a year.") ||
    "";

  const handleStatuses = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, (o) => o.value as FinanceStatus);
    setFinanceStatus(selected);
  };

  const handleGenerate = async () => {
    const { from, to, error } = computeRange(reportType, yearValue, monthValue, quarter);
    if (error || !from || !to) return;

    setLoading(true);
    try {
      const results = await getInflowsReport(from, to, financeStatus);

      const rangeLabel =
        reportType === "Monthly"
          ? `${yearValue}-${monthValue}`
          : reportType === "Quarterly"
          ? `${yearValue} ${quarter}`
          : yearValue;

      const title = `Inflows ${rangeLabel}${
        financeStatus.length ? ` • ${financeStatus.join(", ")}` : ""
      }`;

      // Push to your inflows page/print view with state
      navigate(navigatePath, {
        state: { date_from: from, date_to: to, title, inflows: results, statuses: financeStatus },
      });

      onClose();
    } catch (err) {
      console.error("Generate Inflows failed", err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal-content">
          <h3>Generate Inflows</h3>

          {/* Report Type */}
          <div className="form-group">
            <label htmlFor="reportType">Report Type</label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
            >
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
                <select value={yearValue} onChange={(e) => setYearValue(e.target.value)}>
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <select value={monthValue} onChange={(e) => setMonthValue(e.target.value)}>
                  <option value="">Select Month</option>
                  {monthOptions.map((m) => (
                    <option key={m.v} value={m.v}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {reportType === "Quarterly" && (
              <div style={{ display: "flex", gap: "1rem" }}>
                <select value={yearValue} onChange={(e) => setYearValue(e.target.value)}>
                  <option value="">Select Year</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>

                <select value={quarter} onChange={(e) => setQuarter(e.target.value as Quarter)}>
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
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}

            {invalidPeriodMsg && <small className="error-text">{invalidPeriodMsg}</small>}
          </div>

          {/* Status (Pending/Received only) */}
          <div className="form-group">
            <label htmlFor="statusSelect">Status</label>
            <select
              id="statusSelect"
              multiple
              value={financeStatus}
              onChange={handleStatuses}
            >
                <option>PENDING</option>
                { isInflows && <option>PAID</option>}
                { isInflows && <option>RECEIVED</option>}
                { !isInflows && <option>APPROVED</option>}
                { !isInflows && <option>DENIED</option>}
                { !isInflows && <option>RECONCILED</option>}
            </select>
          </div>

          {/* Output format */}
          {/* <div className="form-group">
            <label htmlFor="format">Format</label>
            <select id="format" value={format} onChange={(e) => setFormat(e.target.value as ExportFormat)}>
              <option value="Print">Print</option>
            </select>
          </div> */}
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="primary-btn"
            onClick={handleGenerate}
            disabled={!!invalidPeriodMsg || loading}
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateInflowsModal;

import { useEffect, useMemo, useState } from "react";
import styles from "./css/ProgramsReport.module.scss"; // reuse same styles to keep layout/design
import RAFI_Shield from "../../../../src/media/RAFI_Shield.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";
import { listPrograms } from "../../../API_Handler/assignment_handler";

// ───────────────────────────────────────────────────────────────────────────────
// Types
// ───────────────────────────────────────────────────────────────────────────────
type Program = {
  id: number | string;
  name: string;
  location?: string;
  date?: string;           // single event date (ISO-like)
  start_date?: string;     // start of multi-day program (ISO-like)
  end_date?: string;       // end of multi-day program (ISO-like)
  expected_volunteers?: number;
  actual_deployed?: number;
  status?: string;         // "upcoming" | "ongoing" | "finished" (computed)
};

type CompanyInfo = {
  name: string;
  tagline: string;
  address: { street: string; city: string; state: string; zip: string };
  contact: { phone: string; email: string };
};

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
const monthNames = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("default", { month: "long" })
);

const safeDate = (d?: string | null) => {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};

const formatDate = (isoLike?: string) => {
  const dt = safeDate(isoLike ?? "");
  return dt
    ? dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";
};

const formatDateRange = (start?: string, end?: string, fallback?: string) => {
  const s = safeDate(start);
  const e = safeDate(end);
  if (s && e) {
    const sTxt = s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const eTxt = e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${sTxt} – ${eTxt}`;
  }
  if (fallback) return formatDate(fallback);
  if (s) return formatDate(start);
  if (e) return formatDate(end);
  return "—";
};

const monthWindow = (year: number, month1to12: number) => {
  const start = new Date(year, month1to12 - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month1to12, 1, 0, 0, 0, 0); // exclusive
  return { start, end };
};

const overlapsMonth = (p: Program, m: number, y: number) => {
  const { start, end } = monthWindow(y, m);
  const s = safeDate(p.start_date);
  const e = safeDate(p.end_date);
  if (s && e) return s < end && e >= start; // ranges overlap
  const d = safeDate(p.date);
  return !!d && d >= start && d < end;
};

// Compute program status from dates → "upcoming" | "ongoing" | "finished"
const computeStatus = (startISO?: string, endISO?: string, dateOnly?: string) => {
  const now = Date.now();
  const s = startISO
    ? new Date(startISO).getTime()
    : dateOnly
      ? new Date(`${dateOnly}T08:00:00`).getTime()
      : NaN;
  const e = endISO
    ? new Date(endISO).getTime()
    : dateOnly
      ? new Date(`${dateOnly}T17:00:00`).getTime()
      : NaN;

  if (!Number.isFinite(s) || !Number.isFinite(e)) return "upcoming";
  if (now < s) return "upcoming";
  if (now >= e) return "finished";
  return "ongoing";
};

// Map our status to your existing SCSS pill classes
const statusBadgeClass = (status: string) => {
  const s = status.toLowerCase();
  if (s === "finished") return `${styles.statusBadge} ${styles.statusCompleted}`; // green
  if (s === "ongoing")  return `${styles.badge} ${styles.typeBadge}`;            // blue
  return `${styles.statusBadge} ${styles.statusPending}`;                        // yellow (upcoming)
};

const normalizeProgram = (r: any): Program => {
  const startISO = r.start_date ?? r.start_at ?? r.start ?? undefined;
  const endISO   = r.end_date   ?? r.end_at   ?? r.end   ?? undefined;
  const dateOnly = r.date ?? r.task_date ?? r.event_date ?? undefined;

  return {
    id: r.id ?? r.program_id ?? r._id ?? r.name ?? "—",
    name: r.name ?? r.title ?? r.program_name ?? "—",
    location: r.location ?? r.venue ?? "",
    date: dateOnly,
    start_date: startISO,
    end_date: endISO,
    expected_volunteers: Number(
      r.expected_volunteers ?? r.expected ?? r.max_volunteers ?? 0
    ),
    actual_deployed: Number(
      r.actual_deployed ??
      r.actual ??
      r.current_count ??
      (Array.isArray(r.assigned_volunteer_ids) ? r.assigned_volunteer_ids.length : 0)
    ),
    status: computeStatus(startISO, endISO, dateOnly),
  };
};

// Fallback demo (only used if API fails completely)
const samplePrograms: Program[] = [
  {
    id: 201,
    name: "Community Clean-up",
    location: "Barangay San Isidro",
    date: "2025-09-05",
    expected_volunteers: 30,
    actual_deployed: 28,
    status: "finished",
  },
  {
    id: 202,
    name: "Tree Planting Drive",
    location: "Busay Hills",
    start_date: "2025-09-10",
    end_date: "2025-09-11",
    expected_volunteers: 50,
    actual_deployed: 41,
    status: "finished",
  },
  {
    id: 203,
    name: "Medical Mission",
    location: "Mandaue Gym",
    date: "2025-08-22",
    expected_volunteers: 40,
    actual_deployed: 32,
    status: "finished",
  },
  {
    id: 204,
    name: "Coastal Cleanup",
    location: "Liloan Shore",
    date: "2025-09-18",
    expected_volunteers: 25,
    actual_deployed: 18,
    status: "upcoming",
  },
];

// ───────────────────────────────────────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────────────────────────────────────
export default function ProgramsReport({
  companyInfo = {
    name: "RAFI Inc.",
    tagline: "The Ramon Aboitiz Foundation Inc.",
    address: {
      street: "35 Eduardo Aboitiz St",
      city: "Cebu City",
      state: "Philippines",
      zip: "6000",
    },
    contact: { phone: "(09) 000-000-0000", email: "sampleemail@gmail.com" },
  } as CompanyInfo,
  reportTitle = "Programs Report",
}: {
  companyInfo?: CompanyInfo;
  reportTitle?: string;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [apiPrograms, setApiPrograms] = useState<Program[]>([]);

  // Fetch real programs from backend
  useEffect(() => {
    const toArray = (resp: any): any[] => {
      if (Array.isArray(resp)) return resp;
      if (Array.isArray(resp?.data)) return resp.data;
      if (Array.isArray(resp?.results)) return resp.results;
      if (Array.isArray(resp?.items)) return resp.items;
      if (Array.isArray(resp?.programs)) return resp.programs;
      return [];
    };

    const fetchPrograms = async () => {
      try {
        setLoading(true);
        const raw = await listPrograms();
        const arr = toArray(raw);
        const normalized = arr.map(normalizeProgram);
        setApiPrograms(normalized);
      } catch (e) {
        console.error("Failed to fetch programs:", e);
        // keep fallback demo data on UI so page still renders
        setApiPrograms(samplePrograms);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  // Filter by Month/Year (same as volunteer report)
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const monthLabel = monthNames[month - 1] ?? "—";

  const allPrograms = apiPrograms; // already normalized
  const filtered = useMemo(
    () => allPrograms.filter((p) => overlapsMonth(p, month, year)),
    [allPrograms, month, year]
  );

  // Summary figures
  const totalPrograms = filtered.length;
  const totalExpected = filtered.reduce(
    (sum, p) => sum + (Number.isFinite(p.expected_volunteers) ? (p.expected_volunteers || 0) : 0),
    0
  );
  const totalActual = filtered.reduce(
    (sum, p) => sum + (Number.isFinite(p.actual_deployed) ? (p.actual_deployed || 0) : 0),
    0
  );
  const overallRate = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;

  // PDF helpers
  const urlToDataUrl = async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const left = 15, right = 15, top = 18, bottom = 15;

    const logo = await urlToDataUrl(RAFI_Shield);

    const drawHeader = () => {
      const y = 12;
      let x = left;

      if (logo) {
        const w = 12, h = 12;
        doc.addImage(logo, "PNG", left, y - 8, w, h);
        x += w + 4;
      }

      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      doc.text(companyInfo.name, x, y);

      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(companyInfo.tagline, x, y + 5);

      doc.setFontSize(8); doc.setTextColor(80);
      const rx = pageWidth - right;
      [
        companyInfo.name,
        companyInfo.address.street,
        `${companyInfo.address.city}, ${companyInfo.address.state} ${companyInfo.address.zip}`,
        `Phone: ${companyInfo.contact.phone}`,
        `Email: ${companyInfo.contact.email}`,
      ].forEach((line, i) => doc.text(line, rx, y - 2 + i * 4, { align: "right" }));

      doc.setTextColor(0);
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text(reportTitle, left, y + 18);

      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(
        `Generated on: ${new Date().toLocaleDateString()}  •  Reporting Period: ${monthLabel} ${year}  •  Records: ${filtered.length}`,
        left,
        y + 24
      );

      doc.setDrawColor(200);
      doc.line(left, y + 27, pageWidth - right, y + 27);
    };

    const drawFooter = () => {
      const y = pageHeight - 8;
      doc.setFontSize(8); doc.setTextColor(100);
      doc.text(`${companyInfo.name}  •  Confidential Document`, left, y);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - right, y, { align: "right" });
    };

    const head = [["Program ID", "Program Name", "Dates", "Expected", "Actual", "Status", "Rate %"]];
    const body = filtered.length
      ? filtered.map((p) => {
          const expected = p.expected_volunteers ?? 0;
          const actual = p.actual_deployed ?? 0;
          const rate = expected > 0 ? (actual / expected) * 100 : 0;
          return [
            String(p.id),
            p.name + (p.location ? ` — ${p.location}` : ""),
            formatDateRange(p.start_date, p.end_date, p.date),
            String(expected),
            String(actual),
            String(p.status ?? "upcoming"),
            `${rate.toFixed(2)}%`,
          ];
        })
      : [["No Data Found for period", "", "", "", "", "", ""]];

    autoTable(doc, {
      head,
      body,
      startY: top + 27 + 6,
      margin: { left, right, top, bottom },
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [243, 244, 246], textColor: 0 },
      didDrawPage: () => { drawHeader(); drawFooter(); },
    });

    const lastTable: any = (doc as any).lastAutoTable;
    const finalY: number = (lastTable?.finalY ?? top + 40) as number;

    // Summary box
    let sumY = finalY + 8;
    const boxX = left;
    const boxW = pageWidth - left - right;
    const boxH = 26;

    if (sumY + boxH > pageHeight - bottom) {
      doc.addPage();
      drawHeader();
      drawFooter();
      sumY = top + 36;
    }

    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(220);
    doc.roundedRect(boxX, sumY, boxW, boxH, 2, 2, "FD");

    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30);
    doc.text("Summary", boxX + 4, sumY + 7);

    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60);
    doc.text(`Programs: ${totalPrograms}`, boxX + 4, sumY + 13);
    doc.text(`Total Expected: ${totalExpected}`, boxX + 4, sumY + 19);
    doc.text(`Total Actual: ${totalActual}`, boxX + 4 + 90, sumY + 13);
    doc.text(`Overall Rate: ${overallRate.toFixed(2)}%`, boxX + 4 + 90, sumY + 19);

    const safeTitle = `${reportTitle} ${monthLabel} ${year}`.replace(/\s+/g, "_").toLowerCase();
    doc.save(`${safeTitle}.pdf`);
  };

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i));

  return (
    <div className={styles.donationReport}>
      {/* Breadcrumb */}
      <div className="breadcrumb-section">
        <h2 className="page-title">Programs Reports</h2>
        <Breadcrumb>
          <Breadcrumb.Item href="#">
            <span>Home</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/volunteer_management/volunteer_dashboard">
              Volunteer Dashboard
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span>Programs Reports</span>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* Header (kept same layout/design) */}
      <div className={styles.reportHeader}>
        <div className={styles.horizontalflex}>
          <div className={styles.companyBranding}>
            <img src={RAFI_Shield} alt="rafi-shield" className={styles.companyLogo} />
            <div className={styles.companyTitle}>
              <h1 className={styles.companyName}>{companyInfo.name}</h1>
              <p className={styles.companyTagline}>{companyInfo.tagline}</p>
            </div>
          </div>

          <div className={styles.companyInfo}>
            <p className={styles.companyLegalName}>{companyInfo.name}</p>
            <p>{companyInfo.address.street}</p>
            <p>{companyInfo.address.city}, {companyInfo.address.state} {companyInfo.address.zip}</p>
            <p>Phone: {companyInfo.contact.phone}</p>
            <p>Email: {companyInfo.contact.email}</p>
          </div>
        </div>

        <div className={styles.reportInfo}>
          <h2 className={styles.reportTitle}>{reportTitle}</h2>
          <div className={styles.reportMetadata}>
            <span>Generated on: {new Date().toLocaleDateString()}</span>

            {/* Month/Year filters + actions */}
            <div className={styles.printSection} style={{ gap: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Month:</span>
                <select
                  value={month}
                  onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                  className={styles.printButton}
                >
                  {monthNames.map((m, ix) => (
                    <option key={m} value={ix + 1}>{m}</option>
                  ))}
                </select>
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span>Year:</span>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value, 10))}
                  className={styles.printButton}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>

              <button onClick={() => window.print()} className={styles.printButton}>Print Report</button>
              <button onClick={handleDownloadPDF} className={styles.printButton}>Download PDF</button>
            </div>

            <span>
              Reporting Period: {monthLabel} {year} • Records: {loading ? "—" : filtered.length}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <main className={styles.reportMain}>
        <div className={styles.tableContainer}>
          <table className={styles.donationsTable}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Program ID</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Program Name</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Dates</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Expected</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Actual</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Status</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Participation Rate</th>
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.map((p, idx) => {
                const expected = p.expected_volunteers ?? 0;
                const actual   = p.actual_deployed ?? 0;
                const rate     = expected > 0 ? (actual / expected) * 100 : 0;

                return (
                  <tr key={p.id ?? idx} className={styles.tableRow}>
                    <td className={styles.tableCell}>{p.id}</td>
                    <td className={`${styles.tableCell} ${styles.donorName}`}>
                      {p.name}{p.location ? ` — ${p.location}` : ""}
                    </td>
                    <td className={styles.tableCell}>
                      {formatDateRange(p.start_date, p.end_date, p.date)}
                    </td>
                    <td className={styles.tableCell}>{expected}</td>
                    <td className={styles.tableCell}>{actual}</td>
                    <td className={styles.tableCell}>
                      <span className={statusBadgeClass(p.status ?? "upcoming")}>
                        {(p.status ?? "upcoming")}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      {expected > 0 ? `${rate.toFixed(2)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className={`${styles.tableCell} ${styles.noData}`} colSpan={7}>
                    No Data Found for {monthLabel} {year}
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className={`${styles.tableCell}`} colSpan={7}>
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className={styles.summarySection}>
          <h3 className={styles.summaryTitle}>Summary</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Programs:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>{loading ? "—" : totalPrograms}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Total Expected Volunteers:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>{loading ? "—" : totalExpected}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Total Actual Deployed:</p>
              <p className={`${styles.summaryValue} ${styles.totalAmount}`}>{loading ? "—" : totalActual}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Overall Participation Rate:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>
                {loading ? "—" : `${overallRate.toFixed(2)}%`}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Print footer */}
      <div className={styles.printFooter}>
        <p>This report was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>{companyInfo.name} - Confidential Document</p>
      </div>
    </div>
  );
}

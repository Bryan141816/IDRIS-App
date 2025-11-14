import { useEffect, useMemo, useState } from "react";
import styles from "./css/VolunteerReport.module.scss";
import RAFI_Shield from "../../../../src/media/RAFI_Shield.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Breadcrumb } from "antd";
import { Link } from "react-router-dom";

// ✅ pull the same data sources you use elsewhere
import { getAllVolunteers } from "../../../API_Handler/individual_volunter_handler";
import { getAllOrganizationVolunteers } from "../../../API_Handler/organization_volunteer_handler";

type VolunteerRow = {
  id: number | string;
  name: string;
  email?: string;
  join_date: string;               // <- used for month/year filtering (created_at/reg date)
  last_active_date?: string;       // optional; not required for table filtering
  programs_joined: number;         // events_joined / tasks_joined (fallbacks)
  volunteer_type: "individual" | "organization";
  status: string;                  // normalized: approved|submitted|verifying|...
};

type CompanyInfo = {
  name: string;
  tagline: string;
  address: { street: string; city: string; state: string; zip: string };
  contact: { phone: string; email: string };
};

// ── helpers ─────────────────────────────────────────────────────────
const monthNames = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("default", { month: "long" })
);

const safeDate = (d?: string | null) => {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};
const isInPeriod = (d: Date | null, m: number, y: number) =>
  !!d && d.getMonth() + 1 === m && d.getFullYear() === y;

const formatDate = (iso?: string) => {
  const dt = safeDate(iso ?? "");
  return dt
    ? dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";
};

const normalizeStatus = (x: any) =>
  String(x?.status ?? x?.application_status ?? x?.volunteer_status ?? "")
    .trim()
    .toLowerCase();

const nameFrom = (first?: string, middle?: string | null, last?: string) =>
  [first, middle ? `${middle[0]}.` : "", last]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const toIndividualRow = (v: any): VolunteerRow => {
  const name = (v.name ?? v.full_name ?? nameFrom(v.first_name, v.middle_name, v.last_name)) || "—";
  const programs = Number(
    v.events_joined ?? v.active_events_joined ?? v.tasks_joined ?? v.active_tasks_joined ?? 0
  );

  const join =
    v.created_at ?? v.join_date ?? v.registration_date ?? new Date().toISOString();

  return {
    id: v.id ?? v.volunteer_id ?? v._id ?? v.email ?? name ?? "—",
    name,
    email: v.email ?? v.contact_email ?? "",
    join_date: join, // ← month/year filter uses this
    last_active_date: v.last_active_date ?? v.lastActivity ?? v.activity_date ?? v.updated_at ?? undefined,
    programs_joined: Number.isFinite(programs) ? programs : 0,
    volunteer_type: "individual",
    status: normalizeStatus(v),
  };
};

const toOrganizationRow = (o: any): VolunteerRow => {
  const orgName =
    (o.organization_name ?? o.name ?? o.full_name ?? nameFrom(o.first_name, o.middle_name, o.last_name)) || "—";
  const programs = Number(
    o.events_joined ?? o.active_events_joined ?? o.tasks_joined ?? o.active_tasks_joined ?? 0
  );

  const join =
    o.created_at ?? o.join_date ?? o.registration_date ?? new Date().toISOString();

  return {
    id: o.id ?? o.volunteer_id ?? o._id ?? o.organization_email ?? orgName ?? "—",
    name: orgName,
    email: o.organization_email ?? o.email ?? "",
    join_date: join, // ← month/year filter uses this
    last_active_date: o.last_active_date ?? o.lastActivity ?? o.activity_date ?? o.updated_at ?? undefined,
    programs_joined: Number.isFinite(programs) ? programs : 0,
    volunteer_type: "organization",
    status: normalizeStatus(o),
  };
};

// fetch logo as dataurl for PDF
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

// ── component ───────────────────────────────────────────────────────
export default function VolunteerReport({
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
  reportTitle = "Volunteer Report",
}: {
  companyInfo?: CompanyInfo;
  reportTitle?: string;
}) {
  const [indiv, setIndiv] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Month/Year filter (default = current)
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const monthLabel = monthNames[month - 1] ?? "—";

  // Load from your API handlers (same ones Manage Applicants uses)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [a, b] = await Promise.all([getAllVolunteers(), getAllOrganizationVolunteers()]);
        setIndiv(Array.isArray(a) ? a : []);
        setOrgs(Array.isArray(b) ? b : []);
      } catch (e) {
        console.error("Failed to fetch volunteers", e);
        setIndiv([]);
        setOrgs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // unify rows
  const allRows: VolunteerRow[] = useMemo(() => {
    const A = indiv.map(toIndividualRow);
    const B = orgs.map(toOrganizationRow);
    return [...A, ...B];
  }, [indiv, orgs]);

  // 🟡 IMPORTANT: Filter by JOIN DATE (created_at) to match Manage Applicants
  const displayRows = useMemo(
  () =>
    allRows.filter(
      (r) => r.status === "approved" && isInPeriod(safeDate(r.join_date), month, year)
    ),
  [allRows, month, year]
);

  // Summary metrics (across ALL volunteers, as requested)
  const totalApproved = useMemo(
    () => allRows.filter((r) => r.status === "approved").length,
    [allRows]
  );
  const totalPending = useMemo(
    () => allRows.filter((r) => r.status === "submitted" || r.status === "verifying").length,
    [allRows]
  );
  // Active % = approved AND in selected period (by join_date) over total approved
  const approvedInPeriod = useMemo(
    () => displayRows.filter((r) => r.status === "approved").length,
    [displayRows]
  );
  const activePercentage = totalApproved > 0 ? (approvedInPeriod / totalApproved) * 100 : 0;

  // PDF
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
        `Generated on: ${new Date().toLocaleDateString()}  •  Reporting Period: ${monthLabel} ${year}  •  Records: ${displayRows.length}`,
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

    const head = [["Volunteer ID", "Name", "Email", "Join Date", "Programs Joined", "Volunteer Type"]];
    const body = displayRows.length
      ? displayRows.map((r) => [
          String(r.id),
          r.name,
          r.email ?? "—",
          formatDate(r.join_date),
          String(r.programs_joined ?? 0),
          r.volunteer_type,
        ])
      : [["No Data Found for period", "", "", "", "", ""]];

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

    // Summary box
    const lastTable: any = (doc as any).lastAutoTable;
    let sumY: number = (lastTable?.finalY ?? top + 40) + 8;
    const boxX = left, boxW = pageWidth - left - right, boxH = 26;
    if (sumY + boxH > pageHeight - bottom) {
      doc.addPage();
      drawHeader(); drawFooter();
      sumY = top + 36;
    }
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(220);
    doc.roundedRect(boxX, sumY, boxW, boxH, 2, 2, "FD");

    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30);
    doc.text("Summary", boxX + 4, sumY + 7);

    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60);
    doc.text(`Total Registered (Approved): ${totalApproved}`, boxX + 4, sumY + 13);
    doc.text(`Pending (Submitted + Verifying): ${totalPending}`, boxX + 4, sumY + 19);
    doc.text(`Approved in ${monthLabel} ${year}: ${approvedInPeriod}`, boxX + 4 + 90, sumY + 13);
    doc.text(`Active %: ${totalApproved ? activePercentage.toFixed(2) : "0.00"}%`, boxX + 4 + 90, sumY + 19);

    const safeTitle = `${reportTitle} ${monthLabel} ${year}`.replace(/\s+/g, "_").toLowerCase();
    doc.save(`${safeTitle}.pdf`);
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  if (loading) return <div>Loading…</div>;

  return (
    <div className={styles.donationReport}>
      <div className="breadcrumb-section">
        <h2 className="page-title">Volunteer Reports</h2>
        <Breadcrumb>
          <Breadcrumb.Item>
            <Link to="/volunteer_management/volunteer_dashboard">Volunteer Dashboard</Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item><span>Volunteer Reports</span></Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* Header */}
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

            <span>Reporting Period: {monthLabel} {year} • Records: {displayRows.length}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <main className={styles.reportMain}>
        <div className={styles.tableContainer}>
          <table className={styles.donationsTable}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Volunteer ID</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Name</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Email</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Join Date</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Number of Programs Joined</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Volunteer Type</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((v, idx) => (
                <tr key={v.id ?? idx} className={styles.tableRow}>
                  <td className={styles.tableCell}>{v.id}</td>
                  <td className={`${styles.tableCell} ${styles.donorName}`}>{v.name}</td>
                  <td className={styles.tableCell}>{v.email || "—"}</td>
                  <td className={styles.tableCell}>{formatDate(v.join_date)}</td>
                  <td className={styles.tableCell}>{v.programs_joined ?? 0}</td>
                  <td className={styles.tableCell}>{v.volunteer_type}</td>
                </tr>
              ))}
              {displayRows.length === 0 && (
                <tr>
                  <td className={`${styles.tableCell} ${styles.noData}`} colSpan={6}>
                    No Data Found for {monthLabel} {year}
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
              <p className={styles.summaryLabel}>Total Registered Volunteers:</p>
              <p className={`${styles.summaryValue} ${styles.totalAmount}`}>{totalApproved}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Number of pending applicants:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>{totalPending}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Active Volunteer Percentage:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>
                {totalApproved ? activePercentage.toFixed(2) : "0.00"}%
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

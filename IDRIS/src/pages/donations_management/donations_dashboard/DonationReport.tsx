import { useState } from "react";
import styles from "./DonationReport.module.scss";
import RAFI_Shield from "../../../../src/media/RAFI_Shield.png";
import TransparencyReportForm from "./TransparencyReportForm";
import {
  getFundingProposalTotalCashDonations,
  getFundingProposalTotalInKindDonations,
} from "../../../API_Handler/donations_transparency_report";

import Swal from "sweetalert2";

// PDF libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Donation = {
  id: number | string;
  amount: number;
  donation_date: string;   // ISO date or yyyy-mm-dd
  donation_type: string;   // e.g., "CASH", "CREDIT_CARD"
  donor_name: string;
  status: string;          // e.g., "COMPLETED"
};

type CompanyInfo = {
  name: string;
  tagline: string;
  address: { street: string; city: string; state: string; zip: string };
  contact: { phone: string; email: string };
};

export default function DonationReport({
  donations = [],
  companyInfo = {
    name: "RAFI Inc.",
    tagline: "The Ramon Aboitiz Foundation Inc.",
    address: { street: "35 Eduardo Aboitiz St", city: "Cebu City", state: "Philippines", zip: "6000" },
    contact: { phone: "(09) 000-000-0000", email: "sampleemail@gmail.com" },
  } as CompanyInfo,
  reportTitle = "Donation Report",
  currency = "USD",
}: {
  donations?: Donation[];
  companyInfo?: CompanyInfo;
  reportTitle?: string;
  currency?: string;
}) {
  // ------- Rows: no placeholders; show empty state instead -------
  const [rows, setRows] = useState<Donation[]>(Array.isArray(donations) ? donations : []);

  // ------- Helpers -------
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount || 0);

  const formatDate = (isoLike: string) =>
    new Date(isoLike).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const totalDonations = rows.reduce((sum, d) => sum + (Number.isFinite(d.amount) ? d.amount : 0), 0);

  const statusClass = (status: string) => {
    const key = "status" + status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    return (styles as Record<string, string>)[key] ?? "";
  };

  const normalizeRow = (r: any): Donation => ({
    id: r.id ?? r.donation_id ?? r._id ?? `${r.donor_name ?? "donor"}-${r.donation_date ?? ""}`,
    amount: Number(r.amount ?? r.total_amount ?? 0),
    donation_date: r.donation_date ?? r.date ?? r.created_at ?? new Date().toISOString().slice(0, 10),
    donation_type: r.donation_type ?? r.type ?? "UNKNOWN",
    donor_name: r.donor_name ?? r.donor ?? r.name ?? "—",
    status: r.status ?? "—",
  });

  // ------- Filters / modals -------
  const [month, setMonth] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [donationType, setDonationType] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState("");
  const closeModal = () => setActiveModal("");

  // ------- Fetch + replace table rows (SweetAlert on empty) -------
  const handleFormSubmit = async (m: number, y: number | null, type: string) => {
    setMonth(m);
    setYear(y);
    setDonationType(type);

    const localMonthLabel =
      typeof m === "number" && m >= 1 && m <= 12
        ? new Date(2000, m - 1).toLocaleString("default", { month: "long" })
        : "—";
    const localYearLabel = y ?? "—";

    const showNoDonationsAlert = () =>
      Swal.fire({
        icon: "info",
        title: "No Data Found",
        text: `There are no donations found for ${localMonthLabel} ${localYearLabel}`,
        confirmButtonColor: "#3085d6",
      });

    if (!y || !(m >= 1 && m <= 12)) {
      await showNoDonationsAlert();
      // Clear rows to reflect empty state
      setRows([]);
      return;
    }

    try {
      const fn =
        type === "cash"
          ? getFundingProposalTotalCashDonations
          : getFundingProposalTotalInKindDonations;

      const raw = await fn(m, y);
      const list = Array.isArray(raw)
        ? raw
        : (raw as any)?.results ?? (raw as any)?.donations ?? (raw as any)?.data ?? [];

      if (!Array.isArray(list) || list.length === 0) {
        await showNoDonationsAlert();
        setRows([]); // ensure table is empty
        return;
      }

      setRows(list.map(normalizeRow));
      setActiveModal(""); // close transparency modal if open
    } catch (err: any) {
      if (err?.response?.status === 404) {
        await showNoDonationsAlert();
        setRows([]);
      } else {
        console.error("Error fetching totals", { m, y, type, err });
      }
    }
  };

  // ------- Download as PDF (jsPDF + autotable) -------
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
    const pageWidth  = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const leftMargin = 15, rightMargin = 15, topMargin = 18, bottomMargin = 15;

    const logoDataUrl = await urlToDataUrl(RAFI_Shield);

    const drawHeader = () => {
      const y = 12;
      let x = leftMargin;

      if (logoDataUrl) {
        const w = 12, h = 12;
        doc.addImage(logoDataUrl, "PNG", leftMargin, y - 8, w, h);
        x += w + 4;
      }

      doc.setFont("helvetica", "bold"); doc.setFontSize(11);
      doc.text(companyInfo.name, x, y);

      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(companyInfo.tagline, x, y + 5);

      doc.setFontSize(8); doc.setTextColor(80);
      const rx = pageWidth - rightMargin;
      [
        companyInfo.name,
        companyInfo.address.street,
        `${companyInfo.address.city}, ${companyInfo.address.state} ${companyInfo.address.zip}`,
        `Phone: ${companyInfo.contact.phone}`,
        `Email: ${companyInfo.contact.email}`,
      ].forEach((line, i) => doc.text(line, rx, y - 2 + i * 4, { align: "right" }));

      doc.setTextColor(0);
      doc.setFont("helvetica", "bold"); doc.setFontSize(12);
      doc.text(reportTitle, leftMargin, y + 18);

      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}  •  Total Records: ${rows.length}`, leftMargin, y + 24);

      doc.setDrawColor(200);
      doc.line(leftMargin, y + 27, pageWidth - rightMargin, y + 27);
    };

    const drawFooter = () => {
      const y = pageHeight - 8;
      doc.setFontSize(8); doc.setTextColor(100);
      doc.text(`${companyInfo.name}  •  Confidential Document`, leftMargin, y);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - rightMargin, y, { align: "right" });
    };

    const head = [["Donation ID", "Donor Name", "Amount", "Date", "Type", "Status"]];
    const body = rows.length
      ? rows.map(r => [
          String(r.id),
          r.donor_name,
          formatCurrency(r.amount),
          formatDate(r.donation_date),
          String(r.donation_type || "").replace("_", " "),
          r.status,
        ])
      : [["No Data Found", "", "", "", "", ""]];

    autoTable(doc, {
      head, body,
      startY: topMargin + 27 + 6,
      margin: { left: leftMargin, right: rightMargin, top: topMargin, bottom: bottomMargin },
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [243, 244, 246], textColor: 0 },
      didDrawPage: () => { drawHeader(); drawFooter(); },
    });

    const lastTable: any = (doc as any).lastAutoTable;
    const finalY: number = (lastTable?.finalY ?? topMargin + 40) as number;

    // Summary box (on last page)
    let sumY = finalY + 8;
    const boxX = leftMargin;
    const boxW = pageWidth - leftMargin - rightMargin;
    const boxH = 22;

    if (sumY + boxH > pageHeight - bottomMargin) {
      doc.addPage();
      drawHeader();
      drawFooter();
      sumY = topMargin + 36;
    }

    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(220);
    doc.roundedRect(boxX, sumY, boxW, boxH, 2, 2, "FD");

    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30);
    doc.text("Summary", boxX + 4, sumY + 7);

    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60);
    doc.text(`Total Donations: ${formatCurrency(totalDonations)}`, boxX + 4, sumY + 13);
    doc.text(`Number of Donors: ${rows.length}`, boxX + 4, sumY + 19);

    const safeTitle = reportTitle.replace(/\s+/g, "_").toLowerCase();
    doc.save(`${safeTitle}.pdf`);
  };

  return (
    <div className={styles.donationReport}>
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
            <div className={styles.printSection}>
              <button onClick={() => window.print()} className={styles.printButton}>Print Report</button>
              <button onClick={handleDownloadPDF} className={styles.printButton}>Download PDF</button>
              <button
                type="button"
                className={styles.printButton}
                onClick={() => setActiveModal("transparency-report-modal")}
              >
                Request
              </button>
            </div>
            <span>Total Records: {rows.length}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <main className={styles.reportMain}>
        <div className={styles.tableContainer}>
          <table className={styles.donationsTable}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Donation ID</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Donor Name</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Amount</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Date</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Type</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d, idx) => (
                <tr key={d.id ?? idx} className={styles.tableRow}>
                  <td className={styles.tableCell}>{d.id}</td>
                  <td className={`${styles.tableCell} ${styles.donorName}`}>{d.donor_name}</td>
                  <td className={`${styles.tableCell} ${styles.amount}`}>{formatCurrency(d.amount)}</td>
                  <td className={styles.tableCell}>{formatDate(d.donation_date)}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.badge} ${styles.typeBadge}`}>
                      {String(d.donation_type || "").replace("_", " ")}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.badge} ${styles.statusBadge} ${statusClass(d.status)}`}>
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className={`${styles.tableCell} ${styles.noData}`} colSpan={6}>No Data Found</td>
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
              <p className={styles.summaryLabel}>Total Donations:</p>
              <p className={`${styles.summaryValue} ${styles.totalAmount}`}>
                {formatCurrency(totalDonations)}
              </p>
            </div>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Number of Donors:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>{rows.length}</p>
            </div>
          </div>
        </div>
      </main>

      {/* Print footer */}
      <div className={styles.printFooter}>
        <p>This report was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>{companyInfo.name} - Confidential Document</p>
      </div>

      {/* Transparency request form */}
      <TransparencyReportForm
        isOpen={activeModal === "transparency-report-modal"}
        onClose={() => setActiveModal("")}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

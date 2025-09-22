import { useState } from "react";
import { useLocation } from 'react-router-dom';
import styles from "./FinanceReport.module.scss";
import RAFI_Shield from "../../../../src/media/RAFI_Shield.png";
import { formatDateOnly, formatCurrency, urlToDataUrl } from "./helpers";
import { CompanyInfo, Finance } from "./types";

// PDF libs
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function FinanceReport({
  finances = [],
  companyInfo = {
    name: "RAFI Inc.",
    tagline: "The Ramon Aboitiz Foundation Inc.",
    address: { street: "35 Eduardo Aboitiz St", city: "Cebu City", state: "Philippines", zip: "6000" },
    contact: { phone: "(09) 000-000-0000", email: "sampleemail@gmail.com" },
  } as CompanyInfo,
  reportTitle = "Finance Report",
  currency = "USD",
}: {
  finances?: Finance[];
  companyInfo?: CompanyInfo;
  reportTitle?: string;
  currency?: string;
}) {
  const location = useLocation();
  const _finances = location.state?.finances;

  const repTitle =
  (location.state as any)?.title ??
  (location.state as any)?.reportTitle ??
  undefined;

  const title = repTitle ?? reportTitle ?? "Finance Report";

  // ------- Rows: no placeholders; show empty state instead -------
  const [rows, setRows] = useState<Finance[]>(Array.isArray(_finances) ? _finances : []);
  console.log("Rows", rows);


  const totalAmount = rows.reduce((sum, f) => sum + (Number.isFinite(f.amount) ? f.amount : 0), 0);

  const statusClass = (status: string) => {
    const key = "status" + status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    return (styles as Record<string, string>)[key] ?? "";
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

    const head = [["Finance ID", "Counterparty", "Amount", "Date", "Budget For", "Description", "Type", "Status"]];
    const body = rows.length
      ? rows.map(r => [
          String(r.finance_id),
          r.counterparty,
          formatCurrency(r.amount),
          formatDateOnly(r.date),
          r.budget_for,
          r.description,
          r.transaction_type,
          r.status,
        ])
      : [["No Data Found", "", "", "", "", "", "", ""]];

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
    doc.text(`Total Amount: ${formatCurrency(totalAmount)}`, boxX + 4, sumY + 13);
    doc.text(`Number of Transactions: ${rows.length}`, boxX + 4, sumY + 19);

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
          <h2 className={styles.reportTitle}>{title}</h2>
          <div className={styles.reportMetadata}>
            <span>Generated on: {new Date().toLocaleDateString()}</span>
            <div className={styles.printSection}>
              <button onClick={() => window.print()} className={styles.printButton}>Print Report</button>
              <button onClick={handleDownloadPDF} className={styles.printButton}>Download PDF</button>
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
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Finance ID</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Counterparty</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Amount</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Date</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Budget For</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Description</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Type</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f, idx) => (
                <tr key={f.finance_id ?? idx} className={styles.tableRow}>
                  <td className={styles.tableCell}>{f.finance_id}</td>
                  <td className={styles.tableCell}>{f.counterparty}</td>
                  <td className={`${styles.tableCell} ${styles.amount}`}>{formatCurrency(f.amount)}</td>
                  <td className={styles.tableCell}>{formatDateOnly(f.date)}</td>
                  <td className={styles.tableCell}>{f.budget_for}</td>
                  <td className={styles.tableCell}>{f.description}</td>
                  <td className={styles.tableCell}>{f.transaction_type}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.badge} ${styles.statusBadge} ${statusClass(f.status)}`}>
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className={`${styles.tableCell} ${styles.noData}`} colSpan={8}>No Data Found</td>
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
              <p className={styles.summaryLabel}>Total Amount:</p>
              <p className={`${styles.summaryValue} ${styles.totalAmount}`}>
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Number of Transactions:</p>
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
      {/* <TransparencyReportForm
        isOpen={activeModal === "transparency-report-modal"}
        onClose={() => setActiveModal("")}
        onSubmit={handleFormSubmit}
      /> */}
    </div>
  );
}

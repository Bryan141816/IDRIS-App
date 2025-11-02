import styles from './FinanceReport.module.scss'
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
// Optional headless fetch (kept but simplified; no Filters type)
import {
  getFundingProposalTotalCashDonations,
  getFundingProposalTotalInKindDonations,
} from "../../../API_Handler/donations_transparency_report";
import { Finance, CompanyInfo } from './types';

export type ReportOptions = {
  currency?: string;       // default "USD"
  reportTitle?: string;    // default "Donation Report"
  companyInfo?: CompanyInfo;
  logoUrl?: string | null; // data URL or absolute URL (png/jpeg/webp)
};

// ── Defaults ─────────────────────────────────────────────────────────────────
const defaultCompany: CompanyInfo = {
  name: "RAFI Inc.",
  tagline: "The Ramon Aboitiz Foundation Inc.",
  address: { street: "35 Eduardo Aboitiz St", city: "Cebu City", state: "Philippines", zip: "6000" },
  contact: { phone: "(09) 000-000-0000", email: "sampleemail@gmail.com" },
};

const fmtMoney = (n: number, currency = "PHP") =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(n || 0);

const fmtDate = (isoLike: string) =>
  new Date(isoLike).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

/** Normalize API rows into Finance shape. */
const normalizeRow = (r: any): Finance => ({
  finance_id: `${r.id ?? r.finance_id}`,
  counterparty: r.counterparty ?? r.donor_name ?? r.donor ?? r.name ?? "—",
  amount: Number(r.amount ?? r.total_amount ?? 0),
  date: r.date ?? r.donation_date ?? r.created_at ?? new Date().toISOString().slice(0, 10),
  inflow_source: r.inflow_source,
  spend_category: r.spend_category,
  purpose: r.description ?? r.notes ?? "—",
  transaction_type: String(r.transaction_type ?? r.donation_type ?? r.type ?? "UNKNOWN"),
});

/** Safer image loader (prevents "wrong PNG signature"). */
async function urlToImageData(
  url?: string | null
): Promise<{ dataUrl: string; format: "PNG" | "JPEG" | "WEBP" } | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;

    const blob = await res.blob();
    const mime = blob.type || "";
    if (!mime.startsWith("image/")) return null;

    const format = mime.includes("png") ? "PNG" : mime.includes("webp") ? "WEBP" : "JPEG";

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

    if (!/^data:image\//i.test(dataUrl)) return null;
    return { dataUrl, format };
  } catch {
    return null;
  }
}

// ── Optional headless fetch (no Filters type) ────────────────────────────────
/** Fetch donations directly by params; returns Finance[] already normalized. */
export async function fetchDonations(
  month: number,
  year: number,
  type: "cash" | "inkind"
): Promise<Finance[]> {
  if (!(month >= 1 && month <= 12) || !year) return [];
  const fn =
    type === "cash"
      ? getFundingProposalTotalCashDonations
      : getFundingProposalTotalInKindDonations;

  const raw = await fn(month, year);
  const list = Array.isArray(raw)
    ? raw
    : (raw as any)?.results ?? (raw as any)?.donations ?? (raw as any)?.data ?? [];
  if (!Array.isArray(list) || list.length === 0) return [];
  return list.map(normalizeRow);
}

// ── Core: Build jsPDF from rows, return Blob ─────────────────────────────────
export async function buildFinanceReportPDFBlob(
  rows: Finance[],
  {
    currency = "USD",
    reportTitle = "Donation Report",
    companyInfo = defaultCompany,
    logoUrl = null,
  }: ReportOptions = {}
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 15, rightMargin = 15, topMargin = 18, bottomMargin = 15;

  const logoObj = await urlToImageData(logoUrl);

  const drawHeader = () => {
    const y = 12;
    let x = leftMargin;

    if (logoObj) {
      const { dataUrl, format } = logoObj;
      const w = 12, h = 12;
      try {
        doc.addImage(dataUrl, format, leftMargin, y - 8, w, h);
        x += w + 4;
      } catch (e) {
        console.warn("Logo addImage failed, skipping:", e);
      }
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
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, leftMargin, y + 24);

    doc.setDrawColor(200);
    doc.line(leftMargin, y + 27, pageWidth - rightMargin, y + 27);
  };

  const drawFooter = () => {
    const y = pageHeight - 8;
    doc.setFontSize(8); doc.setTextColor(100);
    doc.text(`${companyInfo.name}  •  Confidential Document`, leftMargin, y);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - rightMargin, y, { align: "right" });
  };

  const totalAmount = rows.reduce((s, r) => s + (Number.isFinite(r.amount) ? r.amount : 0), 0);

  const head = [[
    "ID",
    "Counterparty",
    "Amount",
    "Date",
    "Category",
    "Description",
    "Transaction Type",
  ]];

  const body = rows.length
    ? rows.map(r => [
        String(r.finance_id),
        r.counterparty,
        fmtMoney(r.amount, currency),
        fmtDate(r.date),
        r.inflow_source || r.spend_category || "—",
        String(r.purpose ?? "—").length > 120
          ? String(r.purpose).slice(0, 117) + "..."
          : String(r.purpose ?? "—"),
        String(r.transaction_type || "").replace(/_/g, " "),
      ])
    : [["No Data Found", "", "", "", "", "", ""]];

  autoTable(doc, {
    head, body,
    startY: topMargin + 27 + 6,
    margin: { left: leftMargin, right: rightMargin, top: topMargin, bottom: bottomMargin },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [243, 244, 246], textColor: 0 },
    columnStyles: {
      2: { halign: "right" }, // Amount
      5: { cellWidth: 70 },   // Description
    } as any,
    didDrawPage: () => { drawHeader(); drawFooter(); },
  });

  const lastTable: any = (doc as any).lastAutoTable;
  const finalY: number = (lastTable?.finalY ?? topMargin + 40) as number;

  // Summary box
  let sumY = finalY + 8;
  const boxX = leftMargin;
  const boxW = pageWidth - leftMargin - rightMargin;
  const boxH = 22;
  if (sumY + boxH > pageHeight - bottomMargin) {
    doc.addPage();
    drawHeader(); drawFooter();
    sumY = topMargin + 36;
  }

  doc.setFillColor(249, 250, 251);
  doc.setDrawColor(220);
  doc.roundedRect(boxX, sumY, boxW, boxH, 2, 2, "FD");

  doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(30);
  doc.text("Summary", boxX + 4, sumY + 7);

  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60);
  doc.text(`Total Amount: ${fmtMoney(totalAmount, currency)}`, boxX + 4, sumY + 13);
  doc.text(`Total Records: ${rows.length}`, boxX + 4, sumY + 19);

  return doc.output("blob");
}

// ── Download/Preview (PDF) from rows ─────────────────────────────────────────
export async function downloadFinanceReportPDFFromRows(
  rows: Finance[],
  opts: ReportOptions = {}
) {
  const blob = await buildFinanceReportPDFBlob(rows, opts);
  const url = URL.createObjectURL(blob);
  const safeTitle = (opts.reportTitle ?? "Finance Report").replace(/\s+/g, "_").toLowerCase();
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safeTitle}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function previewPrintFinanceReportFromRows(
  rows: Finance[],
  opts: ReportOptions = {}
) {
  const blob = await buildFinanceReportPDFBlob(rows, opts);
  const url = URL.createObjectURL(blob);

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } finally {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(url);
      }
    }, 150);
  };
}

export async function previewPrintFinanceReportFromRowsUserGesture(
  rows: Finance[],
  opts: ReportOptions = {}
) {
  // 1) Open a tab immediately (user gesture preserved)
  const w = window.open("", "_blank");
  if (!w) {
    // Popup blocked: fallback to download
    const blob = await buildFinanceReportPDFBlob(rows, opts);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (opts.reportTitle ?? "Donation Report").replace(/\s+/g, "_").toLowerCase() + ".pdf";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  // 2) Build the PDF, then navigate the new tab to it and print
  const blob = await buildFinanceReportPDFBlob(rows, opts);
  const url = URL.createObjectURL(blob);
  w.location.href = url;

  // Give the PDF viewer a moment to load then print
  setTimeout(() => {
    try { w.focus(); w.print(); } catch {}
    // Clean up later (some viewers keep the blob alive)
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }, 350);
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW: HTML printing helpers (preserve page styles)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Print an already-rendered element (selector or HTMLElement),
 * copying all current <style> and <link rel="stylesheet"> tags
 * so CSS Modules / Tailwind styles apply in the print window.
 */
export function printFinanceHTMLReportFromExisting(
  target: string | HTMLElement,
  { title = "Finance Report", extraCss = "" }: { title?: string; extraCss?: string } = {}
) {
  const el: HTMLElement | null =
    typeof target === "string" ? (document.querySelector(target) as HTMLElement | null) : target;
  if (!el) return;

  const w = window.open("", "_blank");
  if (!w) return; // popup blocked

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map((node) => (node as HTMLElement).outerHTML)
    .join("\n");

  const printCss = `
    <style>
      @page { margin: 16mm; }
      @media print {
        html, body { background: #fff; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .no-print { display: none !important; }
        .page-break { break-after: page; }
      }
      ${extraCss || ""}
    </style>
  `;

  w.document.open();
  w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Print – ${title}</title>
  ${styles}
  ${printCss}
</head>
<body>
  ${el.outerHTML}
  <script>setTimeout(function(){ window.print(); }, 200);</script>
</body>
</html>`);
  w.document.close();
}

/**
 * Build & print a standalone HTML table from Finance[].
 * Uses a minimal inline print stylesheet (does NOT reuse page CSS).
 */
export function printFinanceHTMLReportFromRows(
  rows: Finance[],
  {
    title = "Finance Report",
    currency = "PHP",
  }: { title?: string; currency?: string } = {}
) {
  const w = window.open("", "_blank");
  if (!w) return; // popup blocked

  const css = `
    @page { margin: 16mm; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Inter, Arial; color:#111827; }
    h1 { font-size:18px; margin:0 0 8px; }
    .meta { color:#6b7280; font-size:12px; margin-bottom:12px; }
    table { width:100%; border-collapse: collapse; font-size:12px; }
    th, td { border:1px solid #e5e7eb; padding:6px 8px; vertical-align: middle; }
    th { background:#f9fafb; text-align:left; font-weight:600; }
    tr:nth-child(even) td { background:#fafafa; }
    .right { text-align:right; }
    .summary { margin-top:12px; padding:10px; border:1px solid #e5e7eb; background:#f7fafc; }
  `;

  const rowsHtml = rows.length
    ? rows.map(r => `
      <tr>
        <td>${String(r.finance_id)}</td>
        <td>${r.counterparty}</td>
        <td class="right">${new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(r.amount || 0)}</td>
        <td>${fmtDate(r.date)}</td>
        <td>${r.inflow_source || r.spend_category || "—"}</td>
        <td>${r.purpose ?? "—"}</td>
        <td>${String(r.transaction_type || "").replace(/_/g, " ")}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="8">No Data Found</td></tr>`;

  const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const totalFmt = new Intl.NumberFormat("en-PH", { style: "currency", currency }).format(total);

  w.document.open();
  w.document.write(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>${title}</title>
<style>${css}</style></head>
<body>
  <h1>${title}</h1>
  <div class="meta">Generated on: ${new Date().toLocaleDateString()}</div>
  <table>
    <thead><tr>
      <th>ID</th><th>Counterparty</th><th>Amount</th><th>Date</th>
      <th>Category</th><th>Description</th><th>Transaction Type</th>
    </tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="summary"><strong>Summary:</strong>
    Total Amount: ${totalFmt} • Total Records: ${rows.length}
  </div>
  <script>setTimeout(() => { window.print(); }, 250);</script>
</body></html>`);
  w.document.close();
}

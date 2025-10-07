import React, { useEffect, useState } from "react";
import { API } from "../../../API_Handler/Axio_API_Handler";
import styles from "../css/ShelterReportDashboard.module.scss";
import RAFI_Shield from "../../../../src/media/RAFI_Shield.png";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { message, Empty } from "antd";

type Shelter = {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  capacity: number;
  occupied: number;
  address?: string;
  barangay?: string;
};

type CompanyInfo = {
  name: string;
  tagline: string;
  address: { street: string; city: string; state: string; zip: string };
  contact: { phone: string; email: string };
};

const monthNames = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString("default", { month: "long" })
);

// Reverse geocode to get address & extract barangay
async function fetchAddress(lat: number, lng: number): Promise<{ fullAddress: string; barangay: string | null }> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    const json = await res.json();
    const fullAddress = json.display_name || "";
    const barangay = json.address?.hamlet || json.address?.suburb || json.address?.neighbourhood || json.address?.village || null;
    return { fullAddress, barangay };
  } catch {
    return { fullAddress: "", barangay: null };
  }
}

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

export default function ShelterReportDashboard({
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
  reportTitle = "Shelter Summary Report",
}: {
  companyInfo?: CompanyInfo;
  reportTitle?: string;
}) {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const monthLabel = monthNames[month - 1] ?? "—";

  useEffect(() => {
    async function fetchShelters() {
      setLoading(true);
      try {
        const response = await API.get("/lgu_profiling/manage_lgu/get_evacuation");
        const evacDataRaw = response.data.table_datas.flatMap((page: { row: any[] }) =>
          page.row.map((row: any) => {
            const cells = row.data;
            return {
              id: cells[0].text,
              name: cells[1].text,
              lat: parseFloat(cells[2].text),
              lng: parseFloat(cells[3].text),
              capacity: parseInt(cells[4].text, 10),
              occupied: parseInt(cells[5].text, 10),
            };
          })
        );

        const enriched = await Promise.all(
          evacDataRaw.map(async (shelter: { lat: number; lng: number }) => {
            const { fullAddress, barangay } = await fetchAddress(shelter.lat, shelter.lng);
            return {
              ...shelter,
              address: fullAddress,
              barangay,
            };
          })
        );

        setShelters(enriched);
      } catch (err) {
        setError("Failed to load shelter data.");
      } finally {
        setLoading(false);
      }
    }

    fetchShelters();
  }, []);

  // Calculate metrics
  const totalRegistered = shelters.length;
  const sheltersOccupiedCount = shelters.filter(s => s.occupied > 0).length;
  const totalCapacity = shelters.reduce((sum, s) => sum + s.capacity, 0);
  const totalOccupied = shelters.reduce((sum, s) => sum + s.occupied, 0);
  const availableCapacity = totalCapacity - totalOccupied;
  const availableCapacityPercent = totalCapacity ? ((availableCapacity / totalCapacity) * 100).toFixed(2) : "0.00";
  const uniqueBarangays = Array.from(new Set(shelters.map(s => s.barangay).filter(Boolean)));

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
        `Generated on: ${new Date().toLocaleDateString()}  •  Total Shelters: ${totalRegistered}`,
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

    const head = [["Shelter Name", "Barangay", "Capacity", "Occupied", "Available", "Utilization"]];
    const body = shelters.map((s) => [
      s.name,
      s.barangay || "N/A",
      String(s.capacity),
      String(s.occupied),
      String(s.capacity - s.occupied),
      `${s.capacity ? ((s.occupied / s.capacity) * 100).toFixed(1) : "0"}%`,
    ]);

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
    let sumY: number = (lastTable?.finalY ?? top + 40) + 8;
    const boxX = left, boxW = pageWidth - left - right, boxH = 32;
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
    doc.text(`Total Registered Shelters: ${totalRegistered}`, boxX + 4, sumY + 13);
    doc.text(`Shelters Occupied: ${sheltersOccupiedCount}`, boxX + 4, sumY + 19);
    doc.text(`Total Capacity: ${totalCapacity}`, boxX + 4, sumY + 25);
    doc.text(`Total Occupied: ${totalOccupied}`, boxX + 4 + 90, sumY + 13);
    doc.text(`Available Capacity: ${availableCapacity} (${availableCapacityPercent}%)`, boxX + 4 + 90, sumY + 19);
    doc.text(`Barangays: ${uniqueBarangays.length}`, boxX + 4 + 90, sumY + 25);

    doc.save(`shelter_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  if (loading) return <div>Loading…</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;

  return (
    <div className={styles.donationReport}>
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

            <div className={styles.printSection} style={{ gap: 8 }}>
              <button onClick={() => window.print()} className={styles.printButton}>Print Report</button>
              <button onClick={handleDownloadPDF} className={styles.printButton}>Download PDF</button>
            </div>

            <span>Total Shelters: {totalRegistered}</span>
          </div>
        </div>
      </div>

      <main className={styles.reportMain}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          {shelters.map((shelter) => {
            const available = shelter.capacity - shelter.occupied;
            const utilization = shelter.capacity ? ((shelter.occupied / shelter.capacity) * 100).toFixed(1) : "0";
            const isHighOccupancy = parseFloat(utilization) > 80;

            return (
              <div
                key={shelter.id}
                style={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              >
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  marginBottom: '12px',
                  color: '#1f2937'
                }}>
                  {shelter.name}
                </h3>

                <div style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  marginBottom: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  {shelter.address && (
                    <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {shelter.address}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Capacity:</span>
                    <span style={{ fontWeight: '600', fontSize: '16px', color: '#1f2937' }}>{shelter.capacity}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Occupied:</span>
                    <span style={{
                      fontWeight: '600',
                      fontSize: '16px',
                      color: isHighOccupancy ? '#ef4444' : '#10b981'
                    }}>
                      {shelter.occupied}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#6b7280', fontSize: '14px' }}>Available:</span>
                    <span style={{ fontWeight: '600', fontSize: '16px', color: '#1f2937' }}>{available}</span>
                  </div>

                  <div style={{
                    marginTop: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f3f4f6'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '13px', color: '#6b7280' }}>Utilization:</span>
                      <span style={{
                        fontWeight: '700',
                        fontSize: '18px',
                        color: isHighOccupancy ? '#ef4444' : '#10b981'
                      }}>
                        {utilization}%
                      </span>
                    </div>

                    <div style={{
                      width: '100%',
                      height: '8px',
                      background: '#f3f4f6',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${utilization}%`,
                        height: '100%',
                        background: isHighOccupancy
                          ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                          : 'linear-gradient(90deg, #10b981, #059669)',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {shelters.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            No shelter data available
          </div>
        )}

        <div className={styles.summarySection}>
          <h3 className={styles.summaryTitle}>Summary</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Total Registered Shelters:</p>
              <p className={`${styles.summaryValue} ${styles.totalAmount}`}>{totalRegistered}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Shelters Currently Occupied:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>{sheltersOccupiedCount}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Total Capacity:</p>
              <p className={`${styles.summaryValue} ${styles.totalAmount}`}>{totalCapacity}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Total Occupied:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>{totalOccupied}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Available Capacity:</p>
              <p className={`${styles.summaryValue} ${styles.totalAmount}`}>{availableCapacity}</p>
            </div>

            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Available Capacity %:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>{availableCapacityPercent}%</p>
            </div>




          </div>
        </div>
      </main>

      <div className={styles.printFooter}>
        <p>This report was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>{companyInfo.name} - Confidential Document</p>
      </div>
    </div>
  );
}

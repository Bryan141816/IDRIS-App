import { useEffect, useState } from "react";
import { API } from "../../../API_Handler/Axio_API_Handler";
import styles from "../css/ShelterReportDashboard.module.scss";
import RAFI_Shield from "../../../../src/media/RAFI_Shield.png";
import tableStyle from "./EvacuationReport.module.scss";

type CompanyInfo = {
  name: string;
  tagline: string;
  address: { street: string; city: string; state: string; zip: string };
  contact: { phone: string; email: string };
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
  interface EvacuationInfo {
    evacuation_name: string;
    barangay_name: string;
    occupied: number;
    capacity: number;
  }

  interface LGUEvacuation {
    lgu: string;
    evacuation_count: number;
    evacuation: EvacuationInfo[];

    summary: {
      total_capacity: number;
      total_occupied: number;
      largest_shelter: string;
      smallest_shelter: string;
    };
  }

  interface ReportData {
    scope: string;
    total_count: number;
    data: LGUEvacuation[];
  }
  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await API.get("/evacuation/get_reports");
        setReports(response.data);
      } catch (e: any) {
        console.error("Error fetching evacuation report");
      }
    };
    fetch();
  }, []);
  const [reports, setReports] = useState<ReportData | null>(null);
  return (
    <div className={styles.donationReport}>
      <div className={styles.reportHeader}>
        <div className={styles.horizontalflex}>
          <div className={styles.companyBranding}>
            <img
              src={RAFI_Shield}
              alt="rafi-shield"
              className={styles.companyLogo}
            />
            <div className={styles.companyTitle}>
              <h1 className={styles.companyName}>{companyInfo.name}</h1>
              <p className={styles.companyTagline}>{companyInfo.tagline}</p>
            </div>
          </div>

          <div className={styles.companyInfo}>
            <p className={styles.companyLegalName}>{companyInfo.name}</p>
            <p>{companyInfo.address.street}</p>
            <p>
              {companyInfo.address.city}, {companyInfo.address.state}{" "}
              {companyInfo.address.zip}
            </p>
            <p>Phone: {companyInfo.contact.phone}</p>
            <p>Email: {companyInfo.contact.email}</p>
          </div>
        </div>

        <div className={styles.reportInfo}>
          <h2 className={styles.reportTitle}>{reportTitle}</h2>
          <div className={styles.reportMetadata}>
            <span>
              Generated on: {new Date().toLocaleDateString()} • Total Shelters:{" "}
              {reports?.total_count} • Scope: {reports?.scope}
            </span>

            <div className={styles.printSection} style={{ gap: 8 }}>
              <button
                onClick={() => window.print()}
                className={styles.printButton}
              >
                Print Report
              </button>
            </div>

            <span style={{ marginLeft: 12, opacity: 0.8 }}></span>
          </div>
        </div>
      </div>

      <main className={styles.reportMain}>
        {reports && (
          <>
            <div className={tableStyle.table_container}>
              {reports.data.map((report) => (
                <div key={report.lgu}>
                  <h2 className={tableStyle.lgu_name}>{report.lgu}, Cebu</h2>
                  <table className={tableStyle.table}>
                    <thead className={tableStyle.thead}>
                      <tr>
                        <th className={tableStyle.th}>Shelter Name</th>
                        <th className={tableStyle.th}>Barangay</th>
                        <th className={tableStyle.th}>Capacity</th>
                        <th className={tableStyle.th}>Occupied</th>
                        <th className={tableStyle.th}>Vacant</th>
                        <th className={tableStyle.th}>Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.evacuation.map((eva, index) => (
                        <tr key={index}>
                          <td className={tableStyle.td}>
                            {eva.evacuation_name}
                          </td>
                          <td className={tableStyle.td}>{eva.barangay_name}</td>
                          <td className={tableStyle.td}>{eva.capacity}</td>
                          <td className={tableStyle.td}>{eva.occupied}</td>
                          <td className={tableStyle.td}>
                            {eva.capacity - eva.occupied}
                          </td>
                          <td className={tableStyle.td}>
                            {((eva.occupied / eva.capacity) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <h2>Summary</h2>
              {reports.data.map((item) => {
                const report = item.summary;
                return (
                  <div className={styles.summryContent}>
                    {reports.scope === "All LGU" && (
                      <h2 className={styles.summaryLabel}>{item.lgu}</h2>
                    )}
                    <div key={item.lgu} className={styles.summaryGrid2Column}>
                      <span className={styles.summaryLabel}>
                        • Total Number of Shelter: {item.evacuation_count}
                      </span>
                      <span className={styles.summaryLabel}>
                        • Total Shelter Capacity: {report.total_capacity ?? 0}
                      </span>
                      <span className={styles.summaryLabel}>
                        • Overall Capacity Utilization:{" "}
                        {(
                          ((report.total_occupied ?? 0) /
                            (report.total_capacity ?? 1)) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                      <span className={styles.summaryLabel}>
                        • Total Occupied and Vacant:{" "}
                        {report.total_occupied ?? 0}/
                        {reports.total_count - (report.total_occupied ?? 0)}
                      </span>
                      <span className={styles.summaryLabel}>
                        • Largest Shelter: {report.largest_shelter ?? ""}
                      </span>
                      {report.smallest_shelter !== report.largest_shelter && (
                        <span className={styles.summaryLabel}>
                          • Smallest Shelter: {report.smallest_shelter ?? ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
      <div className={styles.printFooter}>
        <p>
          This report was generated on {new Date().toLocaleDateString()} at{" "}
          {new Date().toLocaleTimeString()}
        </p>
        <p>{companyInfo.name} - Confidential Document</p>
      </div>
    </div>
  );
}

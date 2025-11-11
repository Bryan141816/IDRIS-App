import { useEffect, useState } from "react";
import { API } from "../../../../API_Handler/Axio_API_Handler";
import styles from "../../../lgu_profiling/css/ShelterReportDashboard.module.scss";
import RAFI_Shield from "../../../../media/RAFI_Shield.png";
import tableStyle from "../../../lgu_profiling/evacuationandshelter/EvacuationReport.module.scss";
import { formatDateTime } from "../../CommonFunctions";
type CompanyInfo = {
  name: string;
  tagline: string;
  address: { street: string; city: string; state: string; zip: string };
  contact: { phone: string; email: string };
};

export default function DistributionReport({
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
  const [period, setPeriod] = useState("monthly");
  type Summary = {
    most_requested_items: { item_name: string; total_quantity: number }[];
    lgus_covered: number;
    barangays_covered: number;
  };
  type DistributionReport = {
    total_distributed: number;
    data: DistributionRecord[];
    summary: Summary;
  };

  type DistributionRecord = {
    lgu_name: string;
    team_name: string;
    request_type: string;
    items: DistributedItem[];
    date_distributed: string; // ISO date string
    status: string;
  };

  type DistributedItem = {
    item_name: string;
    quantity: number;
  };
  useEffect(() => {
    const fetch = async () => {
      try {
        const response = await API.get(
          `/distribution_planning/get_report?period=${period}`,
        );
        setReports(response.data);
      } catch (e: any) {
        console.error("Error fetching evacuation report");
      }
    };
    fetch();
  }, [period]);
  function formatDistributedItems(items: DistributedItem[]): string {
    return items
      .map((item) => `${item.item_name} ${item.quantity}x`)
      .join(", ");
  }
  const [reports, setReports] = useState<DistributionReport | null>(null);
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
              Generated on: {new Date().toLocaleDateString()} • Total
              Distributed: {reports?.total_distributed}
            </span>

            <div className={styles.printSection} style={{ gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <label style={{ fontSize: "18px" }}>Period: </label>
                <select
                  value={period}
                  onChange={(e) => {
                    const { value } = e.target;
                    setPeriod(value);
                  }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
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
              <div>
                <table className={tableStyle.table}>
                  <thead className={tableStyle.thead}>
                    <tr>
                      <th className={tableStyle.th}>Delivery Location</th>
                      <th className={tableStyle.th}>Distribution Type</th>
                      <th className={tableStyle.th}>Items Delivered</th>
                      <th className={tableStyle.th}>Date Distributed</th>
                      <th className={tableStyle.th}>Distributed By</th>
                      <th className={tableStyle.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.data.map((data, index) => (
                      <tr key={index}>
                        <td className={tableStyle.td}>{data.lgu_name}</td>
                        <td className={tableStyle.td}>{data.request_type}</td>
                        <td className={tableStyle.td}>
                          {formatDistributedItems(data.items)}
                        </td>
                        <td className={tableStyle.td}>
                          {formatDateTime(data.date_distributed)}
                        </td>
                        <td className={tableStyle.td}>{data.team_name}</td>
                        <td className={tableStyle.th}>{data.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.summary}>
              <h2>Summary</h2>
              <div className={styles.summaryGrid2X2Column}>
                <span className={styles.summaryLabel}>
                  • Total Distributed: {reports.total_distributed}
                </span>
                <span className={styles.summaryLabel}>
                  • Total Deliveries for LGU: {reports.summary.lgus_covered}
                </span>
                <span className={styles.summaryLabel}>
                  • Total Deliveries for barangay:{" "}
                  {reports.summary.barangays_covered}
                </span>
                <span className={styles.summaryLabel}>
                  • Top 3 most request items:{" "}
                  {reports.summary.most_requested_items
                    .map((item) => `${item.item_name}: ${item.total_quantity}x`)
                    .join(", ")}
                </span>
              </div>
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

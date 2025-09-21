// src/components/tables/DataTable.tsx
import React from "react";
import styles from "./MainPage.module.scss";

/* ========== Types ========== */
export type AllocationItem = {
  allocation: string;
  inflow: number | string;
  outflow: number | string;
  net: number | string;
  pending_inflow: number | string;
  pending_outflow: number | string;
  denied: number | string;
};

export type FinanceData = {
  breakdown: {
    allocation: AllocationItem[];
  };
};

export type KPIs = {
  total_inflow: number | string;
  total_outflow: number | string;
  net_balance: number | string;
  pending_inflow: number | string;
  pending_outflow: number | string;
  denied_total: number | string;
};

type Props = {
  data: FinanceData;
  kpis: KPIs;
};

const DataTable: React.FC<Props> = ({ data, kpis }) => {
  const toNum = (v: number | string | null | undefined) => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
    return Number.isFinite(n) ? n : 0;
  };

  const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(toNum(value));

  // Optional: compute overall utilization (Outflow / Inflow)
  const totalInflow = toNum(kpis.total_inflow);
  const totalOutflow = toNum(kpis.total_outflow);
  const overallUtil =
    totalInflow > 0 ? ((totalOutflow / totalInflow) * 100).toFixed(1) : "0.0";

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Detailed Allocation Breakdown</h2>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr className={styles.tableHeadRow}>
              <th className={`${styles.th} ${styles.thLeft}`}>Allocation</th>
              <th className={`${styles.th} ${styles.thRight}`}>Inflow</th>
              <th className={`${styles.th} ${styles.thRight}`}>Outflow</th>
              <th className={`${styles.th} ${styles.thRight}`}>Net Balance</th>
              <th className={`${styles.th} ${styles.thRight}`}>Pending In</th>
              <th className={`${styles.th} ${styles.thRight}`}>Pending Out</th>
              <th className={`${styles.th} ${styles.thRight}`}>Denied</th>
              <th className={`${styles.th} ${styles.thRight}`}>Utilization</th>
            </tr>
          </thead>

          <tbody className={styles.tableBody}>
            {data.breakdown.allocation.map((item, index) => {
              const inflow = toNum(item.inflow);
              const outflow = toNum(item.outflow);
              const util = inflow > 0 ? (((inflow - outflow) / inflow) * 100).toFixed(1) : "0.0";

              return (
                <tr
                  key={`${item.allocation}-${index}`}
                  className={`${styles.row} ${index % 2 ? styles.rowAlt : ""}`}
                >
                  <td className={`${styles.cell} ${styles.cellLeft} ${styles.cellLabel}`}>
                    {item.allocation.replace(/_/g, " ")}
                  </td>

                  <td className={`${styles.cell} ${styles.cellRight} ${styles.cellGreen} ${styles.cellStrong}`}>
                    {formatCurrency(item.inflow)}
                  </td>

                  <td className={`${styles.cell} ${styles.cellRight} ${styles.cellRed} ${styles.cellStrong}`}>
                    {formatCurrency(item.outflow)}
                  </td>

                  <td className={`${styles.cell} ${styles.cellRight} ${styles.cellBlue} ${styles.cellBold}`}>
                    {formatCurrency(item.net)}
                  </td>

                  <td className={`${styles.cell} ${styles.cellRight} ${styles.cellAmber}`}>
                    {formatCurrency(item.pending_inflow)}
                  </td>

                  <td className={`${styles.cell} ${styles.cellRight} ${styles.cellOrange}`}>
                    {formatCurrency(item.pending_outflow)}
                  </td>

                  <td className={`${styles.cell} ${styles.cellRight} ${styles.cellDanger}`}>
                    {formatCurrency(item.denied)}
                  </td>

                  <td className={`${styles.cell} ${styles.cellRight} ${styles.cellUtil}`}>
                    {util}%
                  </td>
                </tr>
              );
            })}

            <tr className={`${styles.row} ${styles.totalsRow}`}>
              <td className={`${styles.cell} ${styles.totalsLabel}`}>TOTAL</td>

              <td className={`${styles.cell} ${styles.cellRight} ${styles.cellGreen}`}>
                {formatCurrency(kpis.total_inflow)}
              </td>

              <td className={`${styles.cell} ${styles.cellRight} ${styles.cellRed}`}>
                {formatCurrency(kpis.total_outflow)}
              </td>

              <td className={`${styles.cell} ${styles.cellRight} ${styles.cellBlue}`}>
                {formatCurrency(kpis.net_balance)}
              </td>

              <td className={`${styles.cell} ${styles.cellRight} ${styles.cellAmber}`}>
                {formatCurrency(kpis.pending_inflow)}
              </td>

              <td className={`${styles.cell} ${styles.cellRight} ${styles.cellOrange}`}>
                {formatCurrency(kpis.pending_outflow)}
              </td>

              <td className={`${styles.cell} ${styles.cellRight} ${styles.cellDanger}`}>
                {formatCurrency(kpis.denied_total)}
              </td>

              <td className={`${styles.cell} ${styles.cellRight} ${styles.cellUtil}`}>
                {overallUtil}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DataTable;

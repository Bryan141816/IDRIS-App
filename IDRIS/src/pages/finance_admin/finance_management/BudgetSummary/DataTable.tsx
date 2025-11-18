// src/components/tables/DataTable.tsx
import React from "react";
import styles from "./MainPage.module.scss";
import { formatCurrency } from "../../../helpers";

import { NestedAllocationItem } from "./types";

/* ========== Types ========== */
export type FinanceData = {
  breakdown: {
    allocation: NestedAllocationItem[];
  };
};

export type TableData = NestedAllocationItem[];

export type KPIs = {
  total_inflow: number | string;
  total_outflow: number | string;
  net_balance: number | string;
  // pending_inflow: number | string;
  // pending_outflow: number | string;
  // denied_total: number | string;
};

type Props = {
  tableData: TableData;
  kpis: KPIs;
};

const DataTable: React.FC<Props> = ({ tableData, kpis }) => {
  const toNum = (v: number | string | null | undefined) => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? "0"));
    return Number.isFinite(n) ? n : 0;
  };

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
              <th className={`${styles.th} ${styles.thRight}`}>Utilization</th>
            </tr>
          </thead>

          <tbody className={styles.tableBody}>
            {tableData.map((item, index) => {
              const inflow = toNum(item.inflow_total);
              const outflow = toNum(item.outflow_total);
              const util = inflow > 0 ? ((outflow / inflow) * 100).toFixed(1) : "0.0";

              return (
                <React.Fragment key={`${item.budget_for}-${index}`}>
                  <tr className={`${styles.row} ${index % 2 ? styles.rowAlt : ""}`}>
                    <td className={`${styles.cell} ${styles.cellLeft} ${styles.cellLabel}`}>
                      {item.budget_for.replace(/_/g, " ")}
                    </td>
                    <td className={`${styles.cell} ${styles.cellRight} ${styles.cellGreen} ${styles.cellStrong}`}>
                      {formatCurrency(item.inflow_total)}
                    </td>
                    <td className={`${styles.cell} ${styles.cellRight} ${styles.cellRed} ${styles.cellStrong}`}>
                      {formatCurrency(item.outflow_total)}
                    </td>
                    <td className={`${styles.cell} ${styles.cellRight} ${styles.cellBlue} ${styles.cellBold}`}>
                      {formatCurrency(item.net_total)}
                    </td>
                    <td className={`${styles.cell} ${styles.cellRight} ${styles.cellUtil}`}>
                      {util}%
                    </td>
                  </tr>
                  {/* Render child rows */}
                  {item.children?.map((child, childIndex) => (
                    <tr key={`${child.budget_for}-${childIndex}`} className={styles.childRow}>
                      <td className={`${styles.cell} ${styles.cellLeft} ${styles.cellLabel} ${styles.childCell}`}>
                        {child.budget_for.replace(/_/g, " ")}
                      </td>
                      <td className={`${styles.cell} ${styles.cellRight} ${styles.cellGreen}`}></td>
                      <td className={`${styles.cell} ${styles.cellRight} ${styles.cellRed}`}>
                        {formatCurrency(child.outflow_total)}
                      </td>
                      <td className={`${styles.cell} ${styles.cellRight} ${styles.cellBlue}`}></td>
                      <td className={`${styles.cell} ${styles.cellRight}`}></td>
                    </tr>
                  ))}
                </React.Fragment>
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

              {/* <td className={`${styles.cell} ${styles.cellRight} ${styles.cellAmber}`}>
                {formatCurrency(kpis.pending_inflow)}
              </td>

              <td className={`${styles.cell} ${styles.cellRight} ${styles.cellOrange}`}>
                {formatCurrency(kpis.pending_outflow)}
              </td>

              <td className={`${styles.cell} ${styles.cellRight} ${styles.cellDanger}`}>
                {formatCurrency(kpis.denied_total)}
              </td> */}

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

// src/components/ExecutiveSummary.tsx
import React from "react";
import { TrendingUp, TrendingDown, DollarSign, Clock, XCircle } from "lucide-react";
import KPICard from "./KPICard";
import styles from "./ExecutiveSummary.module.scss";

type Kpis = {
  total_inflow: number | string;
  total_outflow: number | string;
  net_balance: number | string;
  pending_inflow: number | string;
  pending_outflow: number | string;
  denied_total: number | string;
};

type Props = { kpis: Kpis };

const toNum = (v: number | string | null | undefined): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "0").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value: number | string | null | undefined): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(toNum(value));

const ExecutiveSummary: React.FC<Props> = ({ kpis }) => {
  // normalize once to numbers
  const k = {
    total_inflow: toNum(kpis.total_inflow),
    total_outflow: toNum(kpis.total_outflow),
    net_balance: toNum(kpis.net_balance),
    pending_inflow: toNum(kpis.pending_inflow),
    pending_outflow: toNum(kpis.pending_outflow),
    denied_total: toNum(kpis.denied_total),
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Executive Summary</h2>

      <div className={styles.kpiGrid}>
        <KPICard title="Total Inflow" value={formatCurrency(k.total_inflow)} icon={TrendingUp} color="green" />
        <KPICard title="Total Outflow" value={formatCurrency(k.total_outflow)} icon={TrendingDown} color="red" />
        <KPICard title="Net Balance" value={formatCurrency(k.net_balance)} icon={DollarSign} color="blue" />
        <KPICard title="Pending Inflow" value={formatCurrency(k.pending_inflow)} icon={Clock} color="yellow" />
        <KPICard title="Pending Outflow" value={formatCurrency(k.pending_outflow)} icon={Clock} color="orange" />
        <KPICard title="Denied Total" value={formatCurrency(k.denied_total)} icon={XCircle} color="red" />
      </div>

      <div className={styles.summaryBox}>
        <h3 className={styles.summaryTitle}>Key Performance Highlights</h3>

        <div className={styles.summaryGrid}>
          <div>
            <ul className={styles.highlightList}>
              <li>
                <span className={styles.dotGreen} />
                <span>
                  <strong>Positive Net Balance:</strong> {formatCurrency(k.net_balance)} (26.8% of total inflow)
                </span>
              </li>
              <li>
                <span className={styles.dotBlue} />
                <span>
                  <strong>GENERAL allocation</strong> shows highest net balance at {formatCurrency(151500)}
                </span>
              </li>
            </ul>
          </div>
          <div>
            <ul className={styles.highlightList}>
              <li>
                <span className={styles.dotYellow} />
                <span>
                  <strong>Pending Review:</strong> {formatCurrency(47000)} in pending transactions
                </span>
              </li>
              <li>
                <span className={styles.dotRed} />
                <span>
                  <strong>Denial Rate:</strong> 0.6% ({formatCurrency(k.denied_total)})
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExecutiveSummary;

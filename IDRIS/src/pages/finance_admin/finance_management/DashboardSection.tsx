import React from 'react';
import { InflowItem, OutflowItem, BudgetItem } from './FinanceManagement';

const fmt = (n: number | bigint) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(n);

const totalIn = (rows: InflowItem[]) =>
  rows
    .filter((r) => (r.status ?? '').toUpperCase() === 'RECEIVED')
    .reduce((s, r) => s + toNumber(r.amount), 0);

const totalOut = (rows: OutflowItem[]) =>
  rows
    .filter((r) => (r.status ?? '').toUpperCase() === 'PAID')
    .reduce((s, r) => s + toNumber(r.amount), 0);

const toNumber = (v: number | string | bigint | null | undefined): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  if (v == null) return 0;
  // strip currency symbols, commas, spaces
  const n = Number(String(v).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const toDecimal2 = (value: number | string | null | undefined): number => {
  if (value == null || value === '') return 0.00;

  const num = Number(value);
  if (isNaN(num)) return 0.00;

  return parseFloat(num.toFixed(2));
};

const StatsGrid: React.FC<{ inflows: InflowItem[]; outflows: OutflowItem[] }> = ({
  inflows,
  outflows,
}) => {
  const pending =
    inflows.filter((i) => i.status === 'PENDING').length +
    outflows.filter((o) => o.status === 'PENDING').length;
  return (
    <div className="stats-grid">
      <div className="stat-card inflow">
        <div className="stat-icon">💰</div>
        <div className="stat-info">
          <h3>{fmt(totalIn(inflows))}</h3>
          <p>Total Inflow</p>
        </div>
      </div>
      <div className="stat-card outflow">
        <div className="stat-icon">💸</div>
        <div className="stat-info">
          <h3>{fmt(totalOut((outflows)))}</h3>
          <p>Total Outflow</p>
        </div>
      </div>
      <div className="stat-card balance">
        <div className="stat-icon">💳</div>
        <div className="stat-info">
          <h3>{fmt(totalIn(inflows) - totalOut(outflows))}</h3>
          <p>Current Balance</p>
        </div>
      </div>
      <div className="stat-card pending">
        <div className="stat-icon">⏳</div>
        <div className="stat-info">
          <h3>{pending}</h3>
          <p>Pending Transactions</p>
        </div>
      </div>
    </div>
  );
};

const BudgetOverview: React.FC<{ data: BudgetItem[] }> = ({ data }) => (
  <div className="chart-container">
    <h3>Budget Overview</h3>
    <div className="budget-overview">
      {data.map((b, i) => (
        <div key={i} className="budget-item">
          <div className="budget-info">
            <span className="budget-category">{b.budget_for}</span>
            <span className="budget-amounts">
              {fmt(b.outflow_total)} / {fmt(b.inflow_total)}
            </span>
          </div>
          <div
            className="budget-bar"
            style={{
              background: (b.inflow_total === 0)
                ? "#e5e7eb"
                : "linear-gradient(90deg, #10b981, #34d399)",
            }}
          >
            <div
              className="budget-fill"
              style={{ width: `${toDecimal2(b.percentage_spent)}%` }}
            />
          </div>
          <div className="budget-percentage">{toDecimal2(b.percentage_spent)}% used</div>
        </div>
      ))}
    </div>
  </div>
);

const RecentTransactions: React.FC<{
  inflows: InflowItem[];
  outflows: OutflowItem[];
}> = ({ inflows, outflows }) => {
  const items: (InflowItem | OutflowItem)[] = [
    ...inflows.slice(0, 3).map(t => ({ ...t, kind: "inflow" as const })),
    ...outflows.slice(0, 2).map(t => ({ ...t, kind: "outflow" as const })),
  ];
  return (
    <div className="chart-container">
      <h3>Recent Transactions</h3>
      <div className="recent-transactions">
        {items.map((t: any, idx) => {
          const isIn = t.kind === 'inflow';
          return (
            <div
              key={idx}
              className={`transaction-item ${isIn ? 'inflow' : 'outflow'}`}
            >
              <div className="transaction-info">
                <strong>{isIn ? t.counterparty : t.counterparty}</strong>
                <span>{t.description}</span>
                <small>{new Date(t.date).toLocaleDateString()}</small>
              </div>
              <div
                className={`transaction-amount ${isIn ? 'positive' : 'negative'}`}
              >
                {isIn ? '+' : '-'}
                {fmt(t.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DashboardSection: React.FC<{
  inflows: InflowItem[];
  outflows: OutflowItem[];
  budgetData: BudgetItem[];

}> = ({ inflows, outflows, budgetData }) => {
  // 👇 log received outflows
  // console.log("Received OutflowItems:", outflows);

  return (
    <div className="dashboard-content">
      <StatsGrid inflows={inflows} outflows={outflows} />
      <div className="dashboard-grid">
        <BudgetOverview data={budgetData} />
        <RecentTransactions inflows={inflows} outflows={outflows} />
      </div>
    </div>
  );
};
export default DashboardSection;

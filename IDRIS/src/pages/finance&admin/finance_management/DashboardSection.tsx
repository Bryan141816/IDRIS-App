import React from 'react';

type InflowItem = { id: number; source: string; amount: number; category: string; date: string; status: string; description: string; };
type OutflowItem = { id: number; category: string; amount: number; date: string; vendor: string; status: string; description: string; };
type BudgetItem = { category: string; allocated: number; spent: number; remaining: number; percentage: number; };

const fmt = (n: number | bigint) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n);

const totalIn = (rows: InflowItem[]) => rows.filter(r => r.status === 'Received').reduce((s, r) => s + r.amount, 0);
const totalOut = (rows: OutflowItem[]) => rows.filter(r => r.status === 'Paid').reduce((s, r) => s + r.amount, 0);

const StatsGrid: React.FC<{ inflows: InflowItem[]; outflows: OutflowItem[]; }> = ({ inflows, outflows }) => {
  const pending = inflows.filter(i => i.status === 'Pending').length + outflows.filter(o => o.status === 'Pending').length;
  return (
    <div className="stats-grid">
      <div className="stat-card inflow"><div className="stat-icon">💰</div><div className="stat-info"><h3>{fmt(totalIn(inflows))}</h3><p>Total Inflow</p></div></div>
      <div className="stat-card outflow"><div className="stat-icon">💸</div><div className="stat-info"><h3>{fmt(totalOut(outflows))}</h3><p>Total Outflow</p></div></div>
      <div className="stat-card balance"><div className="stat-icon">💳</div><div className="stat-info"><h3>{fmt(totalIn(inflows) - totalOut(outflows))}</h3><p>Current Balance</p></div></div>
      <div className="stat-card pending"><div className="stat-icon">⏳</div><div className="stat-info"><h3>{pending}</h3><p>Pending Transactions</p></div></div>
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
            <span className="budget-category">{b.category}</span>
            <span className="budget-amounts">{fmt(b.spent)} / {fmt(b.allocated)}</span>
          </div>
          <div className="budget-bar"><div className="budget-fill" style={{ width: `${b.percentage}%` }} /></div>
          <div className="budget-percentage">{b.percentage}% used</div>
        </div>
      ))}
    </div>
  </div>
);

const RecentTransactions: React.FC<{ inflows: InflowItem[]; outflows: OutflowItem[] }> = ({ inflows, outflows }) => {
  const items: (InflowItem | OutflowItem)[] = [...inflows.slice(0, 3), ...outflows.slice(0, 2)];
  return (
    <div className="chart-container">
      <h3>Recent Transactions</h3>
      <div className="recent-transactions">
        {items.map((t: any, idx) => {
          const isIn = 'source' in t;
          return (
            <div key={idx} className={`transaction-item ${isIn ? 'inflow' : 'outflow'}`}>
              <div className="transaction-info">
                <strong>{isIn ? t.source : t.vendor}</strong>
                <span>{t.description}</span>
                <small>{new Date(t.date).toLocaleDateString()}</small>
              </div>
              <div className={`transaction-amount ${isIn ? 'positive' : 'negative'}`}>
                {isIn ? '+' : '-'}{fmt(t.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DashboardSection: React.FC<{ inflows: InflowItem[]; outflows: OutflowItem[]; budgetData: BudgetItem[]; }> = ({
  inflows, outflows, budgetData
}) => (
  <div className="dashboard-content">
    <StatsGrid inflows={inflows} outflows={outflows} />
    <div className="dashboard-grid">
      <BudgetOverview data={budgetData} />
      <RecentTransactions inflows={inflows} outflows={outflows} />
    </div>
  </div>
);

export default DashboardSection;

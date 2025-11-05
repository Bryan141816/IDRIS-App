import React, { useState } from 'react';
import { InflowItem, OutflowItem, BudgetItem } from './types';
import { formatCurrency, } from '../../helpers';
import { totalIn, totalOut, toDecimal2, strip_underscores } from './helpers';
import { Modal } from '../../../components/Page_Furniture/Modals';
import { ReportsExportsSection } from './ReportsExportSection';

const StatsGrid: React.FC<
  {
    inflows: InflowItem[];
    outflows: OutflowItem[],
    onOpenReportSelection: () => void,
    // onOpenGenerateReport: () => void
  }> = ({
    inflows,
    outflows,
    onOpenReportSelection,
    // onOpenGenerateReport,
  }) => {

    return (
      <div className="stats-grid">
        <div className="stat-card inflow" onClick={onOpenReportSelection}>
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <h3>Request Reports</h3>
          </div>
        </div>      <div className="stat-card inflow">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{formatCurrency(totalIn(inflows))}</h3>
            <p>Total Inflow</p>
          </div>
        </div>
        <div className="stat-card outflow">
          <div className="stat-icon">💸</div>
          <div className="stat-info">
            <h3>{formatCurrency(totalOut((outflows)))}</h3>
            <p>Total Outflow</p>
          </div>
        </div>
        <div className="stat-card balance">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <h3>{formatCurrency(totalIn(inflows) - totalOut(outflows))}</h3>
            <p>Current Balance</p>
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
            <span className="budget-category">{strip_underscores(b.budget_for)}</span>
            <span className="budget-amounts">
              {formatCurrency(b.outflow_total)} / {formatCurrency(b.inflow_total)}
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
                <span>{t.purpose}</span>
                <small>{new Date(t.date).toLocaleDateString()}</small>
              </div>
              <div
                className={`transaction-amount ${isIn ? 'positive' : 'negative'}`}
              >
                {isIn ? '+' : '-'}
                {formatCurrency(t.amount)}
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
  const [activeModal, setActiveModal] = useState<string>("");

  const closeModal = () => setActiveModal("");

  const openReportSelectionModal = () => {
    setActiveModal("report-selection")
  }

  return (
    <div className="dashboard-content">
      <StatsGrid inflows={inflows} outflows={outflows} onOpenReportSelection={openReportSelectionModal} />
      <div className="dashboard-grid">
        <BudgetOverview data={budgetData} />
        <RecentTransactions inflows={inflows} outflows={outflows} />
      </div>

      {(activeModal == "report-selection") &&
        <div className="modalOverlay" onClick={(e) => {
          if (e.target === e.currentTarget) {
            closeModal();
          }
        }}>
          <div id="report-selection">
            <ReportsExportsSection mode={(activeModal == "report-selection") ? "reports" : "exports"} />
          </div>
        </div>
      }
    </div>
  );
};
export default DashboardSection;



import React, { useEffect, useState } from 'react';
import './finance_management.scss';
import NavTabs from './NavTabs';
import DashboardSection from './DashboardSection';
import InflowsSection from './InflowsSection';
import OutflowsSection from './OutflowsSection';
import ReportsExportSection from './ReportsExportSection';
import { 
  getInflowFinanceRecords, 
  getOutflowFinanceRecords, 
  getBudgetAllocationSummary,
} from '../../../API_Handler/finance_management_handler';

type ActiveTab = 'dashboard' | 'inflows' | 'outflows' | 'reports' | 'exports';
export type InflowItem = {
  finance_id: string;
  counterparty: string;
  amount: number;
  budget_for: string;
  date: string;
  status: 'PENDING' | 'RECEIVED' | 'PROCESSING';
  description: string;
};

export type OutflowItem = {
  finance_id: string;
  counterparty: string;
  amount: number;
  budget_for: string;
  date: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  description: string;
};

export type BudgetItem = {
  budget_for: string;
  inflow_total: number;
  outflow_total: number;
  net_total: number;
  percentage_spent: number;
};

const FinanceAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Dummy data (replace with API later)
  const [fundInflows, setFundInFlows] =  useState<InflowItem[]>([]);

  const [fundOutflows, setFundOutFlows] = useState<OutflowItem[]>([]);
  ;

  // const financialReports = [
  //   {
  //     id: 1,
  //     name: 'Monthly Financial Summary - May 2024',
  //     type: 'Monthly Report',
  //     period: 'May 2024',
  //     generated: '2024-05-31',
  //     status: 'Generated' as const,
  //   },
  // ];

  const [budgetData, setBudgetData] = useState<BudgetItem[]>([]);

  useEffect(() => {
    const fetchAllInflows = async () => {
      try {
        const inflows = await getInflowFinanceRecords();
  
        if (inflows != null) {
          setFundInFlows(inflows);
        } else {
          console.error("Invalid response format:", inflows);
        }
      } catch (error) {
        console.error("Failed to fetch finance summary:", error);
      }
    };

    const fetchAllOutflows = async () => {
      try {
        const outflows = await getOutflowFinanceRecords();
  
        if (outflows != null) {
          setFundOutFlows(outflows);
        } else {
          console.error("Invalid response format:", outflows);
        }
      } catch (error) {
        console.error("Failed to fetch finance summary:", error);
      }
    };

    const fetchFinanceSummary = async () => {
      try {
        const summary = await getBudgetAllocationSummary();
    
        if (summary != null) {
          console.log("Budget allocation:", summary);
          setBudgetData(summary);
        } else {
          console.error("Invalid response format:", summary);
        }
      } catch (error) {
        console.error("Failed to fetch finance summary:", error);
      }
    };
    
    fetchAllInflows();
    fetchAllOutflows();
    fetchFinanceSummary();
  }, []);
  
  return (
    <div className="financial-management">
      <h3 className="public-feed-title">Financial Management System</h3>

      <NavTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="finance-management-active-section">
        {activeTab === 'dashboard' && (
          <DashboardSection
            inflows={fundInflows}
            outflows={fundOutflows}
            budgetData={budgetData}
          />
        )}

        {activeTab === 'inflows' && <InflowsSection inflows={fundInflows} />}

        {activeTab === 'outflows' && <OutflowsSection outflows={fundOutflows} />}

        {activeTab === 'reports' && (
          <ReportsExportSection mode="reports"/>
        )}

        {activeTab === 'exports' && <ReportsExportSection mode="exports" />}
      </div>
    </div>
  );
};

export default FinanceAdmin;

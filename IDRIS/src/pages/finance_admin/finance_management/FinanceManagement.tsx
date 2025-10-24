import React, { useEffect, useState } from 'react';
import './finance_management.scss';
import NavTabs from './NavTabs';
import DashboardSection from './DashboardSection';
import InflowsSection from './InflowsSection';
import OutflowsSection from './OutflowsSection';
import ReportsExportSection from './ReportsExportSection';
import {
  type InflowItem,
  type OutflowItem,
  type BudgetItem
} from './types';
import { 
  getInflowFinanceRecords, 
  getOutflowFinanceRecords, 
  getBudgetAllocationSummary,
} from '../../../API_Handler/finance_management_handler';

type ActiveTab = 'dashboard' | 'inflows' | 'outflows' | 'reports' | 'exports';

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

  const fetchAllData = async () => {
    try {
      const [inflows, outflows, summary] = await Promise.all([
        getInflowFinanceRecords(),
        getOutflowFinanceRecords(),
        getBudgetAllocationSummary(),
      ]);

      if (inflows) {
        setFundInFlows(inflows);
      } else {
        console.error("Invalid response format for inflows:", inflows);
      }

      if (outflows) {
        setFundOutFlows(outflows);
      } else {
        console.error("Invalid response format for outflows:", outflows);
      }

      if (summary) {
        console.log("Budget allocation:", summary);
        setBudgetData(summary);
      } else {
        console.error("Invalid response format for summary:", summary);
      }
    } catch (error) {
      console.error("Failed to fetch finance data:", error);
    }
  };

  useEffect(() => {
    fetchAllData();
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

        {activeTab === 'inflows' && <InflowsSection inflows={fundInflows} refetchData={fetchAllData} />}

        {activeTab === 'outflows' && <OutflowsSection outflows={fundOutflows} refetchData={fetchAllData} />}

        {activeTab === 'reports' && (
          <ReportsExportSection mode="reports"/>
        )}

        {activeTab === 'exports' && <ReportsExportSection mode="exports" />}
      </div>
    </div>
  );
};

export default FinanceAdmin;

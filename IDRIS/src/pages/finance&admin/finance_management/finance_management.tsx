import React, { useState } from 'react';
import './finance_management.scss';

import NavTabs from './NavTabs';
import DashboardSection from './DashboardSection';
import InflowsSection from './InflowsSection';
import OutflowsSection from './OutflowsSection';
import ReportsExportsSection from './Reports';

type ActiveTab = 'dashboard' | 'inflows' | 'outflows' | 'reports' | 'exports';

const FinanceAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Dummy data (replace with API later)
  const fundInflows = [
    { id: 1, source: 'Government', amount: 500000, date: '2024-05-15', category: 'Grant', status: 'Received' as const, description: 'Emergency Response Fund' },
    { id: 2, source: 'Private Donation - RAFI Corp', amount: 150000, date: '2024-05-20', category: 'Donation', status: 'Received' as const, description: 'Disaster Relief Support' },
    { id: 3, source: 'International Aid - UN', amount: 750000, date: '2024-05-25', category: 'International Aid', status: 'Pending' as const, description: 'Humanitarian Assistance'},
    { id: 4, source: 'Community Fundraising', amount: 75000, date: '2024-05-28', category: 'Fundraising', status: 'Received' as const, description: 'Local Community Support' }
  ];

  const fundOutflows = [
    { id: 1, category: 'Emergency Supplies', amount: 125000, date: '2024-05-16', vendor: 'Medical Supply Co.', status: 'Paid' as const, description: 'Medical kits and first aid supplies' },
    { id: 2, category: 'Food & Water', amount: 200000, date: '2024-05-18', vendor: 'Food Distribution Inc.', status: 'Paid' as const, description: 'Emergency food packages' },
    { id: 3, category: 'Transportation', amount: 50000, date: '2024-05-22', vendor: 'Logistics Express', status: 'Pending' as const, description: 'Distribution vehicle rental' },
    { id: 4, category: 'Equipment', amount: 85000, date: '2024-05-24', vendor: 'Safety Equipment Ltd.', status: 'Approved' as const, description: 'Communication and safety gear' }
  ];

  const financialReports = [
    { id: 1, name: 'Monthly Financial Summary - May 2024', type: 'Monthly Report', period: 'May 2024', generated: '2024-05-31', status: 'Generated' as const },
    { id: 2, name: 'Quarterly Expenditure Report - Q2 2024', type: 'Quarterly Report', period: 'Q2 2024', generated: '2024-05-30', status: 'Draft' as const },
    { id: 3, name: 'Donor Fund Utilization Report', type: 'Special Report', period: 'Jan-May 2024', generated: '2024-05-29', status: 'Generated' as const }
  ];

  const budgetData = [
    { category: 'Emergency Supplies', allocated: 300000, spent: 125000, remaining: 175000, percentage: 42 },
    { category: 'Food & Water', allocated: 400000, spent: 200000, remaining: 200000, percentage: 50 },
    { category: 'Transportation', allocated: 150000, spent: 50000, remaining: 100000, percentage: 33 },
    { category: 'Equipment', allocated: 200000, spent: 85000, remaining: 115000, percentage: 43 },
    { category: 'Administrative', allocated: 100000, spent: 25000, remaining: 75000, percentage: 25 }
  ];

  return (
    <div className="financial-management">
      <h3 className="public-feed-title">Financial Management System</h3>

      <NavTabs activeTab={activeTab} onChange={setActiveTab} />

      <div className="finance-management-active-section">
        {activeTab === 'dashboard' && (
          <DashboardSection inflows={fundInflows} outflows={fundOutflows} budgetData={budgetData} />
        )}

        {activeTab === 'inflows' && (
          <InflowsSection inflows={fundInflows} />
        )}

        {activeTab === 'outflows' && (
          <OutflowsSection outflows={fundOutflows} />
        )}

        {activeTab === 'reports' && (
          <ReportsExportsSection mode="reports" reports={financialReports} />
        )}

        {activeTab === 'exports' && (
          <ReportsExportsSection mode="exports" />
        )}
      </div>
    </div>
  );
};

export default FinanceAdmin;

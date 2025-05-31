import React, { useState } from 'react';
import './finance_management.scss';


const FinanceAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  interface InflowItem {
    source: string;
    amount: number;
    category: string;
    date: string;
    status: string;
    description: string;
  }

  const [selectedItem, setSelectedItem] = useState<InflowItem | null>(null);


  // Sample financial data
  const fundInflows = [
    {
      id: 1,
      source: 'Government Grant',
      amount: 500000,
      date: '2024-05-15',
      category: 'Grant',
      status: 'Received',
      description: 'Emergency Response Fund'
    },
    {
      id: 2,
      source: 'Private Donation - RAFI Corp',
      amount: 150000,
      date: '2024-05-20',
      category: 'Donation',
      status: 'Received',
      description: 'Disaster Relief Support'
    },
    {
      id: 3,
      source: 'International Aid - UN',
      amount: 750000,
      date: '2024-05-25',
      category: 'International Aid',
      status: 'Pending',
      description: 'Humanitarian Assistance'
    },
    {
      id: 4,
      source: 'Community Fundraising',
      amount: 75000,
      date: '2024-05-28',
      category: 'Fundraising',
      status: 'Received',
      description: 'Local Community Support'
    }
  ];


  const fundOutflows = [
    {
      id: 1,
      category: 'Emergency Supplies',
      amount: 125000,
      date: '2024-05-16',
      vendor: 'Medical Supply Co.',
      status: 'Paid',
      description: 'Medical kits and first aid supplies'
    },
    {
      id: 2,
      category: 'Food & Water',
      amount: 200000,
      date: '2024-05-18',
      vendor: 'Food Distribution Inc.',
      status: 'Paid',
      description: 'Emergency food packages'
    },
    {
      id: 3,
      category: 'Transportation',
      amount: 50000,
      date: '2024-05-22',
      vendor: 'Logistics Express',
      status: 'Pending',
      description: 'Distribution vehicle rental'
    },
    {
      id: 4,
      category: 'Equipment',
      amount: 85000,
      date: '2024-05-24',
      vendor: 'Safety Equipment Ltd.',
      status: 'Approved',
      description: 'Communication and safety gear'
    }
  ];


  const financialReports = [
    {
      id: 1,
      name: 'Monthly Financial Summary - May 2024',
      type: 'Monthly Report',
      period: 'May 2024',
      generated: '2024-05-31',
      status: 'Generated'
    },
    {
      id: 2,
      name: 'Quarterly Expenditure Report - Q2 2024',
      type: 'Quarterly Report',
      period: 'Q2 2024',
      generated: '2024-05-30',
      status: 'Draft'
    },
    {
      id: 3,
      name: 'Donor Fund Utilization Report',
      type: 'Special Report',
      period: 'Jan-May 2024',
      generated: '2024-05-29',
      status: 'Generated'
    }
  ];


  const budgetData = [
    {
      category: 'Emergency Supplies',
      allocated: 300000,
      spent: 125000,
      remaining: 175000,
      percentage: 42
    },
    {
      category: 'Food & Water',
      allocated: 400000,
      spent: 200000,
      remaining: 200000,
      percentage: 50
    },
    {
      category: 'Transportation',
      allocated: 150000,
      spent: 50000,
      remaining: 100000,
      percentage: 33
    },
    {
      category: 'Equipment',
      allocated: 200000,
      spent: 85000,
      remaining: 115000,
      percentage: 43
    },
    {
      category: 'Administrative',
      allocated: 100000,
      spent: 25000,
      remaining: 75000,
      percentage: 25
    }
  ];


  const getTotalInflow = () => {
    return fundInflows.filter(f => f.status === 'Received').reduce((sum, f) => sum + f.amount, 0);
  };


  const getTotalOutflow = () => {
    return fundOutflows.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  };


  const getBalance = () => {
    return getTotalInflow() - getTotalOutflow();
  };


  const formatCurrency = (amount: number | bigint) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };


  const openModal = (type: React.SetStateAction<string>, item: any = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
  };

  const renderModal = () => {
    if (!showModal) return null;


    const getModalContent = () => {
      switch (modalType) {
        case 'add-inflow':
        case 'edit-inflow':
          return (
            <div className="modal-content">
              <h3>{modalType === 'add-inflow' ? 'Record New Inflow' : 'Edit Inflow'}</h3>
              <div className="form-group">
                <label>Source</label>
                <input type="text" placeholder="Enter funding source" defaultValue={selectedItem?.source || ''} />
              </div>
              <div className="form-group">
                <label>Amount (PHP)</label>
                <input type="number" placeholder="Enter amount" defaultValue={selectedItem?.amount || ''} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select defaultValue={selectedItem?.category || ''}>
                  <option>Select category</option>
                  <option>Grant</option>
                  <option>Donation</option>
                  <option>International Aid</option>
                  <option>Fundraising</option>
                  <option>Government Fund</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date Received</label>
                <input type="date" defaultValue={selectedItem?.date || ''} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select defaultValue={selectedItem?.status || 'Pending'}>
                  <option>Pending</option>
                  <option>Received</option>
                  <option>Processing</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Enter description" defaultValue={selectedItem?.description || ''}></textarea>
              </div>
            </div>
          );
        case 'add-outflow':
        case 'edit-outflow':
          return (
            <div className="modal-content">
              <h3>{modalType === 'add-outflow' ? 'Record New Expense' : 'Edit Expense'}</h3>
              <div className="form-group">
                <label>Category</label>
                <select defaultValue={selectedItem?.category || ''}>
                  <option>Select category</option>
                  <option>Emergency Supplies</option>
                  <option>Food & Water</option>
                  <option>Transportation</option>
                  <option>Equipment</option>
                  <option>Administrative</option>
                  <option>Personnel</option>
                </select>
              </div>
              <div className="form-group">
                <label>Amount (PHP)</label>
                <input type="number" placeholder="Enter amount" defaultValue={selectedItem?.amount || ''} />
              </div>
              <div className="form-group">
                <label>Vendor/Supplier</label>
                <input type="text" placeholder="Enter vendor name" defaultValue={selectedItem && 'vendor' in selectedItem ? (selectedItem.vendor as string) : ''} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" defaultValue={selectedItem?.date || ''} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select defaultValue={selectedItem?.status || 'Pending'}>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Paid</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Enter description" defaultValue={selectedItem?.description || ''}></textarea>
              </div>
            </div>
          );
        case 'generate-report':
          return (
            <div className="modal-content">
              <h3>Generate Financial Report</h3>
              <div className="form-group">
                <label>Report Type</label>
                <select>
                  <option>Monthly Summary</option>
                  <option>Quarterly Report</option>
                  <option>Annual Report</option>
                  <option>Donor Report</option>
                  <option>Expense Analysis</option>
                  <option>Budget vs Actual</option>
                </select>
              </div>
              <div className="form-group">
                <label>Period</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="date" placeholder="From" />
                  <input type="date" placeholder="To" />
                </div>
              </div>
              <div className="form-group">
                <label>Include Sections</label>
                <div className="checkbox-group">
                  <label><input type="checkbox" defaultChecked /> Income Summary</label>
                  <label><input type="checkbox" defaultChecked /> Expense Breakdown</label>
                  <label><input type="checkbox" defaultChecked /> Budget Analysis</label>
                  <label><input type="checkbox" /> Compliance Notes</label>
                </div>
              </div>
            </div>
          );
        case 'export-logs':
          return (
            <div className="modal-content">
              <h3>Export Financial Logs</h3>
              <div className="form-group">
                <label>Export Type</label>
                <select>
                  <option>Complete Financial Log</option>
                  <option>Inflows Only</option>
                  <option>Outflows Only</option>
                  <option>Budget Summary</option>
                </select>
              </div>
              <div className="form-group">
                <label>Format</label>
                <select>
                  <option>Excel (.xlsx)</option>
                  <option>PDF Report</option>
                  <option>CSV Data</option>
                  <option>JSON Data</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date Range</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="date" placeholder="From" />
                  <input type="date" placeholder="To" />
                </div>
              </div>
              <div className="form-group">
                <label>Additional Options</label>
                <div className="checkbox-group">
                  <label><input type="checkbox" /> Include attachments</label>
                  <label><input type="checkbox" /> Add audit trail</label>
                  <label><input type="checkbox" /> Include pending transactions</label>
                </div>
              </div>
            </div>
          );
        default:
          return (
            <div className="modal-content">
              <h3>Feature: {modalType}</h3>
              <p>This functionality is being developed...</p>
            </div>
          );
      }
    };


    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <button className="close-btn" onClick={closeModal}>×</button>
          </div>
          {getModalContent()}
          <div className="modal-actions">
            <button className="secondary-btn" onClick={closeModal}>Cancel</button>
            <button className="primary-btn">
              {modalType.includes('export') ? 'Export' : modalType.includes('generate') ? 'Generate' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="financial-management">
      <h3 className="public-feed-title">Financial Management System</h3>


      <div className="navigation">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === 'inflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('inflows')}
        >
          💰 Fund Inflows
        </button>
        <button
          className={`nav-btn ${activeTab === 'outflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('outflows')}
        >
          💸 Fund Outflows
        </button>
        <button
          className={`nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📋 Reports & Audits
        </button>
        <button
          className={`nav-btn ${activeTab === 'exports' ? 'active' : ''}`}
          onClick={() => setActiveTab('exports')}
        >
          📤 Export Logs
        </button>
      </div>


      <div className="finance-management-active-section">
        {activeTab === 'dashboard' && <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card inflow">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <h3>{formatCurrency(getTotalInflow())}</h3>
                <p>Total Inflow</p>
              </div>
            </div>
            <div className="stat-card outflow">
              <div className="stat-icon">💸</div>
              <div className="stat-info">
                <h3>{formatCurrency(getTotalOutflow())}</h3>
                <p>Total Outflow</p>
              </div>
            </div>
            <div className="stat-card balance">
              <div className="stat-icon">💳</div>
              <div className="stat-info">
                <h3>{formatCurrency(getBalance())}</h3>
                <p>Current Balance</p>
              </div>
            </div>
            <div className="stat-card pending">
              <div className="stat-icon">⏳</div>
              <div className="stat-info">
                <h3>{fundInflows.filter(f => f.status === 'Pending').length + fundOutflows.filter(f => f.status === 'Pending').length}</h3>
                <p>Pending Transactions</p>
              </div>
            </div>
          </div>


          <div className="dashboard-grid">
            <div className="chart-container">
              <h3>Budget Overview</h3>
              <div className="budget-overview">
                {budgetData.map((budget, index) => (
                  <div key={index} className="budget-item">
                    <div className="budget-info">
                      <span className="budget-category">{budget.category}</span>
                      <span className="budget-amounts">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.allocated)}
                      </span>
                    </div>
                    <div className="budget-bar">
                      <div
                        className="budget-fill"
                        style={{ width: `${budget.percentage}%` }}
                      ></div>
                    </div>
                    <div className="budget-percentage">{budget.percentage}% used</div>
                  </div>
                ))}
              </div>
            </div>


            <div className="chart-container">
              <h3>Recent Transactions</h3>
              <div className="recent-transactions">
                {[...fundInflows.slice(0, 3), ...fundOutflows.slice(0, 2)].map((transaction, index) => (
                  <div key={index} className={`transaction-item ${'source' in transaction ? 'inflow' : 'outflow'}`}>
                    <div className="transaction-info">
                      <strong>{'source' in transaction ? transaction.source : transaction.vendor}</strong>
                      <span>{transaction.description}</span>
                      <small>{new Date(transaction.date).toLocaleDateString()}</small>
                    </div>
                    <div className={`transaction-amount ${'source' in transaction ? 'positive' : 'negative'}`}>
                      {'source' in transaction ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>}
        {activeTab === 'inflows' && <div className="inflows-content">
          <div className="section-header">
            <h2>Track Inflow of Funds (Donations, Grants)</h2>
            <button className="primary-btn" onClick={() => openModal('add-inflow')}>
              + Record Inflow
            </button>
          </div>


          <div className="inflows-table">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fundInflows.map(inflow => (
                  <tr key={inflow.id}>
                    <td>{inflow.source}</td>
                    <td className="amount positive">{formatCurrency(inflow.amount)}</td>
                    <td>{inflow.category}</td>
                    <td>{new Date(inflow.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${inflow.status.toLowerCase()}`}>
                        {inflow.status}
                      </span>
                    </td>
                    <td>{inflow.description}</td>
                    <td>
                      <button className="action-btn" onClick={() => openModal('edit-inflow', inflow)}>
                        Edit
                      </button>
                      <button className="action-btn" onClick={() => openModal('view-inflow', inflow)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}
        {activeTab === 'outflows' && <div className="outflows-content">
          <div className="section-header">
            <h2>Track Outflow of Funds (Purchases and Expenses)</h2>
            <button className="primary-btn" onClick={() => openModal('add-outflow')}>
              + Record Expense
            </button>
          </div>


          <div className="outflows-table">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fundOutflows.map(outflow => (
                  <tr key={outflow.id}>
                    <td>{outflow.category}</td>
                    <td className="amount negative">{formatCurrency(outflow.amount)}</td>
                    <td>{outflow.vendor}</td>
                    <td>{new Date(outflow.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${outflow.status.toLowerCase()}`}>
                        {outflow.status}
                      </span>
                    </td>
                    <td>{outflow.description}</td>
                    <td>
                      <button className="action-btn" onClick={() => openModal('edit-outflow', outflow)}>
                        Edit
                      </button>
                      <button className="action-btn" onClick={() => openModal('view-outflow', outflow)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}
        {activeTab === 'report' && <div className="reports-content">
          <div className="section-header">
            <h2>Review Financial Reports</h2>
            <div className="header-actions">
              <button className="secondary-btn" onClick={() => openModal('generate-budget')}>
                📊 Generate Budget Summary
              </button>
              <button className="primary-btn" onClick={() => openModal('generate-report')}>
                + Generate Report
              </button>
            </div>
          </div>


          <div className="reports-grid">
            {financialReports.map(report => (
              <div key={report.id} className="report-card">
                <div className="report-header">
                  <h3>{report.name}</h3>
                  <span className={`status-badge ${report.status.toLowerCase()}`}>
                    {report.status}
                  </span>
                </div>
                <div className="report-details">
                  <div className="detail-row">
                    <span>Type:</span>
                    <span>{report.type}</span>
                  </div>
                  <div className="detail-row">
                    <span>Period:</span>
                    <span>{report.period}</span>
                  </div>
                  <div className="detail-row">
                    <span>Generated:</span>
                    <span>{new Date(report.generated).toLocaleDateString()}</span>
                  </div>
                  <div className="report-actions">
                    <button className="action-btn" onClick={() => openModal('view-report', report)}>
                      View
                    </button>
                    <button className="action-btn" onClick={() => openModal('export-report', report)}>
                      Export
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>


          <div className="audit-section">
            <h3>Generate Budget Summaries and Audits</h3>
            <div className="audit-actions">
              <button className="audit-btn" onClick={() => openModal('monthly-audit')}>
                📈 Monthly Audit
              </button>
              <button className="audit-btn" onClick={() => openModal('quarterly-audit')}>
                📊 Quarterly Review
              </button>
              <button className="audit-btn" onClick={() => openModal('annual-audit')}>
                📋 Annual Summary
              </button>
              <button className="audit-btn" onClick={() => openModal('compliance-audit')}>
                ✅ Compliance Audit
              </button>
            </div>
          </div>
        </div>}
        { activeTab === 'exports' && <div className="exports-content">
          <div className="section-header">
            <h2>Export Financial Logs</h2>
            <button className="primary-btn" onClick={() => openModal('export-logs')}>
              📤 Export Data
            </button>
          </div>


          <div className="export-options">
            <div className="export-card">
              <div className="export-icon">📊</div>
              <h3>Complete Financial Log</h3>
              <p>Export all inflows, outflows, and transactions</p>
              <button className="export-btn" onClick={() => openModal('export-complete')}>
                Export Complete Log
              </button>
            </div>


            <div className="export-card">
              <div className="export-icon">💰</div>
              <h3>Inflow Summary</h3>
              <p>Export donations, grants, and income sources</p>
              <button className="export-btn" onClick={() => openModal('export-inflows')}>
                Export Inflows
              </button>
            </div>


            <div className="export-card">
              <div className="export-icon">💸</div>
              <h3>Expense Report</h3>
              <p>Export all expenditures and purchases</p>
              <button className="export-btn" onClick={() => openModal('export-outflows')}>
                Export Expenses
              </button>
            </div>


            <div className="export-card">
              <div className="export-icon">📈</div>
              <h3>Budget Analysis</h3>
              <p>Export budget vs actual spending analysis</p>
              <button className="export-btn" onClick={() => openModal('export-budget')}>
                Export Budget Report
              </button>
            </div>
          </div>
        </div> }
      </div>


      {renderModal()}
    </div>
  );
};


export default FinanceAdmin;

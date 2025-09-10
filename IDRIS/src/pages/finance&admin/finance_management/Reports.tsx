import React, { useState } from 'react';

type ReportItem = {
  id: number;
  name: string;
  type: string;
  period: string;
  generated: string;
  status: 'Generated' | 'Draft';
};

type Mode = 'reports' | 'exports';

const GenerateReportModal: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header"><button className="close-btn" onClick={onClose}>×</button></div>
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
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={onClose}>Generate</button>
        </div>
      </div>
    </div>
  );
};

const ExportModal: React.FC<{
  open: boolean;
  preset?: 'Complete Financial Log' | 'Inflows Only' | 'Outflows Only' | 'Budget Summary';
  onClose: () => void;
}> = ({ open, preset = 'Complete Financial Log', onClose }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header"><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-content">
          <h3>Export Financial Logs</h3>
          <div className="form-group">
            <label>Export Type</label>
            <select defaultValue={preset}>
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
        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          <button className="primary-btn" onClick={onClose}>Export</button>
        </div>
      </div>
    </div>
  );
};

const ReportsView: React.FC<{
  reports: ReportItem[];
  onOpenGenerate: () => void;
  onOpenExport: (preset?: ExportModalProps['preset']) => void;
}> = ({ reports, onOpenGenerate, onOpenExport }) => (
  <div className="reports-content">
    <div className="section-header">
      <h2>Review Financial Reports</h2>
      <div className="header-actions">
        <button className="secondary-btn" onClick={onOpenGenerate}>📊 Generate Budget Summary</button>
        <button className="primary-btn" onClick={onOpenGenerate}>+ Generate Report</button>
      </div>
    </div>

    <div className="reports-grid">
      {reports.map(r => (
        <div key={r.id} className="report-card">
          <div className="report-header">
            <h3>{r.name}</h3>
            <span className={`status-badge ${r.status.toLowerCase()}`}>{r.status}</span>
          </div>
          <div className="report-details">
            <div className="detail-row"><span>Type:</span><span>{r.type}</span></div>
            <div className="detail-row"><span>Period:</span><span>{r.period}</span></div>
            <div className="detail-row"><span>Generated:</span><span>{new Date(r.generated).toLocaleDateString()}</span></div>
            <div className="report-actions">
              <button className="action-btn" onClick={() => onOpenGenerate()}>View</button>
              <button className="action-btn" onClick={() => onOpenExport('Complete Financial Log')}>Export</button>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div className="audit-section">
      <h3>Generate Budget Summaries and Audits</h3>
      <div className="audit-actions">
        <button className="audit-btn" onClick={onOpenGenerate}>📈 Monthly Audit</button>
        <button className="audit-btn" onClick={onOpenGenerate}>📊 Quarterly Review</button>
        <button className="audit-btn" onClick={onOpenGenerate}>📋 Annual Summary</button>
        <button className="audit-btn" onClick={onOpenGenerate}>✅ Compliance Audit</button>
      </div>
    </div>
  </div>
);

type ExportModalProps = React.ComponentProps<typeof ExportModal>;

const ExportsView: React.FC<{ onOpen: (preset?: ExportModalProps['preset']) => void; }> = ({ onOpen }) => (
  <div className="exports-content">
    <div className="section-header">
      <h2>Export Financial Logs</h2>
      <button className="primary-btn" onClick={() => onOpen('Complete Financial Log')}>📤 Export Data</button>
    </div>

    <div className="export-options">
      <div className="export-card">
        <div className="export-icon">📊</div>
        <h3>Complete Financial Log</h3>
        <p>Export all inflows, outflows, and transactions</p>
        <button className="export-btn" onClick={() => onOpen('Complete Financial Log')}>Export Complete Log</button>
      </div>

      <div className="export-card">
        <div className="export-icon">💰</div>
        <h3>Inflow Summary</h3>
        <p>Export donations, grants, and income sources</p>
        <button className="export-btn" onClick={() => onOpen('Inflows Only')}>Export Inflows</button>
      </div>

      <div className="export-card">
        <div className="export-icon">💸</div>
        <h3>Expense Report</h3>
        <p>Export all expenditures and purchases</p>
        <button className="export-btn" onClick={() => onOpen('Outflows Only')}>Export Expenses</button>
      </div>

      <div className="export-card">
        <div className="export-icon">📈</div>
        <h3>Budget Analysis</h3>
        <p>Export budget vs actual spending analysis</p>
        <button className="export-btn" onClick={() => onOpen('Budget Summary')}>Export Budget Report</button>
      </div>
    </div>
  </div>
);

const ReportsExportsSection: React.FC<{ mode: Mode; reports?: ReportItem[] }> = ({ mode, reports = [] }) => {
  const [openGen, setOpenGen] = useState(false);
  const [openExport, setOpenExport] = useState<{ open: boolean; preset?: ExportModalProps['preset'] }>({ open: false });

  return (
    <>
      {mode === 'reports' ? (
        <ReportsView
          reports={reports}
          onOpenGenerate={() => setOpenGen(true)}
          onOpenExport={(preset) => setOpenExport({ open: true, preset })}
        />
      ) : (
        <ExportsView onOpen={(preset) => setOpenExport({ open: true, preset })} />
      )}

      <GenerateReportModal open={openGen} onClose={() => setOpenGen(false)} />
      <ExportModal open={openExport.open} preset={openExport.preset} onClose={() => setOpenExport({ open: false })} />
    </> 
  );
};

export default ReportsExportsSection;

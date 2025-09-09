import React, { useState } from 'react';

type OutflowItem = {
  id: number;
  category: string;
  amount: number;
  date: string;
  vendor: string;
  status: 'Pending' | 'Approved' | 'Paid' | 'Cancelled';
  description: string;
};

const fmt = (n: number | bigint) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n);

const OutflowModal: React.FC<{
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  initial?: Partial<OutflowItem>;
  onClose: () => void;
  onSave?: (values: OutflowItem | Partial<OutflowItem>) => void;
}> = ({ open, mode, initial, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<OutflowItem>>(initial || {});
  if (!open) return null;

  const readOnly = mode === 'view';

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header"><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="modal-content">
          <h3>{mode === 'add' ? 'Record New Expense' : mode === 'edit' ? 'Edit Expense' : 'View Expense'}</h3>

          <div className="form-group">
            <label>Category</label>
            <select disabled={readOnly} defaultValue={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })}>
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
            <input disabled={readOnly} type="number" placeholder="Enter amount"
              defaultValue={form.amount || 0} onChange={e => setForm({ ...form, amount: +e.target.value })}/>
          </div>

          <div className="form-group">
            <label>Vendor/Supplier</label>
            <input disabled={readOnly} type="text" placeholder="Enter vendor name"
              defaultValue={form.vendor || ''} onChange={e => setForm({ ...form, vendor: e.target.value })}/>
          </div>

          <div className="form-group">
            <label>Date</label>
            <input disabled={readOnly} type="date" defaultValue={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })}/>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select disabled={readOnly} defaultValue={form.status || 'Pending'} onChange={e => setForm({ ...form, status: e.target.value as OutflowItem['status'] })}>
              <option>Pending</option>
              <option>Approved</option>
              <option>Paid</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea disabled={readOnly} placeholder="Enter description" defaultValue={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })}/>
          </div>
        </div>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onClose}>Cancel</button>
          {mode !== 'view' && <button className="primary-btn" onClick={() => onSave?.(form)}>Save</button>}
        </div>
      </div>
    </div>
  );
};

const OutflowsSection: React.FC<{ outflows: OutflowItem[] }> = ({ outflows }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selected, setSelected] = useState<OutflowItem | undefined>();

  const open = (mode: 'add' | 'edit' | 'view', row?: OutflowItem) => {
    setModalMode(mode);
    setSelected(row);
    setModalOpen(true);
  };

  return (
    <div className="outflows-content">
      <div className="section-header">
        <h2>Track Outflow of Funds (Purchases and Expenses)</h2>
        <button className="primary-btn" onClick={() => open('add')}>+ Record Expense</button>
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
            {outflows.map(row => (
              <tr key={row.id}>
                <td>{row.category}</td>
                <td className="amount negative">{fmt(row.amount)}</td>
                <td>{row.vendor}</td>
                <td>{new Date(row.date).toLocaleDateString()}</td>
                <td><span className={`status-badge ${row.status.toLowerCase()}`}>{row.status}</span></td>
                <td>{row.description}</td>
                <td>
                  <button className="action-btn" onClick={() => open('edit', row)}>Edit</button>
                  <button className="action-btn" onClick={() => open('view', row)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OutflowModal
        open={modalOpen}
        mode={modalMode}
        initial={selected}
        onClose={() => setModalOpen(false)}
        onSave={() => setModalOpen(false)}
      />
    </div>
  );
};

export default OutflowsSection;

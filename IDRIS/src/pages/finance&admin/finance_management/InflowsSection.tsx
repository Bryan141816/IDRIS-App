import React, { useState } from 'react';
import Swal from "sweetalert2";
import { createInflowFinanceRecord } from '../../../API_Handler/finance_management_handler';

export enum TransactionType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
}

type InflowItem = {
  id: number;
  source: string;
  // source: string; // keep if you still use it elsewhere
  amount: number;
  category: string;
  date: string;
  status: 'Pending' | 'Received' | 'Processing';
  description: string;
  budget_for: string;
};

const fmt = (n: number | bigint) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n);

const InflowModal: React.FC<{
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  initial?: Partial<InflowItem>;
  onClose: () => void;
  onSave?: (values: InflowItem | Partial<InflowItem>) => void;
}> = ({ open, mode, initial, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<InflowItem>>(initial || {});
  const readOnly = mode === 'view';
  if (!open) return null;

  const validate = () => {
    const errs: string[] = [];
    if (!form.source?.trim()) errs.push('Source is required.');
    if (form.amount == null || Number(form.amount) <= 0) errs.push('Amount must be greater than 0.');
    if (!form.category) errs.push('Category is required.');
    if (!form.date) errs.push('Date is required.');
    if(!form.budget_for) errs.push('Budget allocation is required.');
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    const errors = validate();
    if (errors.length) {
      await Swal.fire({
        icon: 'warning',
        title: 'Check the form',
        text: errors.join(' '),
        confirmButtonText: 'OK',
      });
      return;
    }

    // Normalize inflow transaction type -> backend enum
    const normalizeTransactionType = (type: string | null | undefined) => {
      if (type === "Inflow" || type === "INFLOW") return "INFLOW";
      if (type === "Outflow" || type === "OUTFLOW") return "OUTFLOW";
      return "INFLOW"; // fallback default
    };

    // Normalize record status -> backend enum
    const normalizeRecordStatus = (status: string | null | undefined) => {
      if (status === "Pending" || status === "PENDING") return "PENDING";
      if (status === "Approved" || status === "APPROVED") return "APPROVED";
      if (status === "Rejected" || status === "REJECTED") return "REJECTED";
      return "PENDING"; // fallback default
    };

    const normalizeBudgetAllocationName = (input: string | null | undefined) => {
      if (!input) return "GENERAL";
      const s = input.trim().toUpperCase().replace(/&/g, "AND");
    
      if (s.startsWith("EMERGENCY")) return "EMERGENCY";
      if (s.includes("FOOD") || s.includes("WATER")) return "FOOD AND WATER";
      if (s.startsWith("TRANSPO") || s.includes("TRANSPORT")) return "TRANSPORTATION";
      if (s.startsWith("EQUIP")) return "EQUIPMENT";
      if (s.startsWith("ADMIN")) return "ADMINISTRATIVE";
      if (s === "GENERAL") return "GENERAL";
    
      return "GENERAL";
    };

    const dt = new Date(form.date!);

    // Build FormData for multipart/form-data submit
    const fd = new FormData();
    fd.append('source', form.source!);
    fd.append('transaction_type', normalizeTransactionType("INFLOW"));
    fd.append('amount', String(Number(form.amount)));
    fd.append('category', form.category!);
    fd.append('date', form.date!); // yyyy-mm-dd
    fd.append('status', normalizeRecordStatus(form.status ?? 'PENDING'));
    if (form.description) fd.append('description', form.description);
    fd.append('budget_for', normalizeBudgetAllocationName(form.budget_for));

    console.log([...fd.entries()]);
    try {
      Swal.fire({
        title: 'Saving inflow…',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const created = await createInflowFinanceRecord(fd); // posts multipart/form-data

      await Swal.fire({
        icon: 'success',
        title: 'Inflow saved',
        text: 'The inflow record has been created successfully.',
        confirmButtonText: 'Great!',
      });

      onSave?.(created);
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'An unexpected error occurred while creating the inflow record.';

      await Swal.fire({
        icon: 'error',
        title: 'Failed to save inflow',
        text: message,
        confirmButtonText: 'OK',
      });
    } finally {
      Swal.close();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* FORM WRAPPER */}
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <h3>{mode === 'add' ? 'Record New Inflow' : mode === 'edit' ? 'Edit Inflow' : 'View Inflow'}</h3>

            <div className="form-group">
              <label htmlFor="">Budget For</label>
              <select
                disabled={readOnly}
                onChange={e => setForm({ ...form, budget_for: e.target.value })}
              >
                <option value="" disabled>Select category</option>
                <option>Emergency Supplies</option>
                <option>Food & Water</option>
                <option>Transportation</option>
                <option>Equipment</option>
                <option>Administrative</option>
                <option>Donations</option>
                <option>General Expenses</option>
              </select>
            </div>

            <div className="form-group">
              <label>Source</label>
              <input
                disabled={readOnly}
                type="text"
                placeholder="Enter funding source"
                defaultValue={form.source || ''}
                onChange={e => setForm({ ...form, source: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Amount (PHP)</label>
              <input
                disabled={readOnly}
                type="number"
                placeholder="Enter amount"
                min={0}
                defaultValue={form.amount ?? ''}
                onChange={e => setForm({ ...form, amount: +e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                disabled={readOnly}
                defaultValue={form.category || ''}
                onChange={e => setForm({ ...form, category: e.target.value })}
              >
                <option value="" disabled>Select category</option>
                <option>Grant</option>
                <option>Donation</option>
                <option>International Aid</option>
                <option>Fundraising</option>
                <option>Government Fund</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date Received</label>
              <input
                disabled={readOnly}
                type="date"
                defaultValue={form.date || ''}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                disabled={readOnly}
                defaultValue={form.status || 'Pending'}
                onChange={e => setForm({ ...form, status: e.target.value as InflowItem['status'] })}
              >
                <option>PENDING</option>
                <option>RECEIVED</option>
                <option>PAID</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                disabled={readOnly}
                placeholder="Enter description"
                defaultValue={form.description || ''}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            {mode !== 'view' && <button type="submit" className="primary-btn">Save</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

const InflowsSection: React.FC<{ inflows: InflowItem[] }> = ({ inflows }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selected, setSelected] = useState<InflowItem | undefined>();

  const open = (mode: 'add' | 'edit' | 'view', row?: InflowItem) => {
    setModalMode(mode);
    setSelected(row);
    setModalOpen(true);
  };

  return (
    <div className="inflows-content">
      <div className="section-header">
        <h2>Track Inflow of Funds (Donations, Grants)</h2>
        <button className="primary-btn" onClick={() => open('add')}>+ Record Inflow</button>
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
            {inflows.map((row, index) => (
              <tr key={index}>
                <td>{row.source}</td>
                <td className="amount positive">{fmt(row.amount)}</td>
                <td>{row.category}</td>
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

      <InflowModal
        open={modalOpen}
        mode={modalMode}
        initial={selected}
        onClose={() => setModalOpen(false)}
        onSave={() => setModalOpen(false)} // still closes after success
      />
    </div>
  );
};

export default InflowsSection;

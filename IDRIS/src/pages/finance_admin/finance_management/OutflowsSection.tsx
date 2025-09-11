import React, { useState } from 'react';
import Swal from "sweetalert2";
import { createOutflowFinanceRecord } from '../../../API_Handler/finance_management_handler';
import { OutflowItem } from './FinanceManagement';


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

  const validate = () => {
    const errs: string[] = [];
    if (!form.counterparty?.trim()) errs.push('Vendor is required.');
    if (form.amount == null || Number(form.amount) <= 0) errs.push('Amount must be greater than 0.');
    if (!form.budget_for) errs.push('Category is required.');
    if (!form.date) errs.push('Date is required.');
    if (!form.budget_for) errs.push('Budget allocation is required.');
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

    // Normalize outflow transaction type -> backend enum
    const normalizeTransactionType = (type: string | null | undefined) => {
      if (type === "Outflow" || type === "OUTFLOW") return "OUTFLOW";
      return "OUTFLOW"; // fallback default
    };

    // Normalize record status -> backend enum
    const normalizeRecordStatus = (status: string | null | undefined) => {
      if (status === "Pending" || status === "PENDING") return "PENDING";
      if (status === "Approved" || status === "APPROVED") return "APPROVED";
      if (status === "Paid" || status === "PAID") return "PAID";
      if (status === "Cancelled" || status === "CANCELLED") return "CANCELLED";
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
    fd.append('counterparty', form.counterparty!);
    fd.append('transaction_type', normalizeTransactionType("OUTFLOW"));
    fd.append('amount', String(Number(form.amount)));
    fd.append('category', form.budget_for!);
    fd.append('date', form.date!); // yyyy-mm-dd
    fd.append('status', normalizeRecordStatus(form.status ?? 'PENDING'));
    if (form.description) fd.append('description', form.description);
    fd.append('budget_for', normalizeBudgetAllocationName(form.budget_for));

    console.log([...fd.entries()]);
    try {
      Swal.fire({
        title: 'Saving outflow…',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const created = await createOutflowFinanceRecord(fd); // posts multipart/form-data

      await Swal.fire({
        icon: 'success',
        title: 'Outflow saved',
        text: 'The outflow record has been created successfully.',
        confirmButtonText: 'Great!',
      });

      onSave?.(created);
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'An unexpected error occurred while creating the outflow record.';

      await Swal.fire({
        icon: 'error',
        title: 'Failed to save outflow',
        text: message,
        confirmButtonText: 'OK',
      });
    } finally {
      Swal.close();
    }
  };


  const readOnly = mode === 'view';
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header"><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-content">
            <h3>{mode === 'add' ? 'Record New Expense' : mode === 'edit' ? 'Edit Expense' : 'View Expense'}</h3>

            <div className="form-group">
              <label htmlFor="">Budget For</label>
              <select
                disabled={readOnly}
                value={form.budget_for || ""}
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
              <label>Amount (PHP)</label>
              <input disabled={readOnly} type="number" placeholder="Enter amount"
                defaultValue={form.amount || 0} onChange={e => setForm({ ...form, amount: +e.target.value })} />
            </div>

            <div className="form-group">
              <label>Vendor/Supplier</label>
              <input disabled={readOnly} type="text" placeholder="Enter vendor name"
                defaultValue={form.counterparty || ''} onChange={e => setForm({ ...form, counterparty: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Date</label>
              <input disabled={readOnly} type="date" defaultValue={form.date || ''} onChange={e => setForm({ ...form, date: e.target.value })} />
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
              <textarea disabled={readOnly} placeholder="Enter description" defaultValue={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>

          <div className="modal-actions">
            <button className="secondary-btn" onClick={onClose}>Cancel</button>
            {mode !== 'view' && <button className="primary-btn" type='submit'>Save</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

const OutflowsSection: React.FC<{ outflows?: OutflowItem[] }> = ({ outflows }) => {
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
            {outflows?.map((row, index) => (
              <tr key={index}>
                {/* <input type="hidden" value={row.finance_id} /> */}
                <td>{row.budget_for}</td>
                <td className="amount negative">{fmt(row.amount)}</td>
                <td>{row.counterparty}</td>
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

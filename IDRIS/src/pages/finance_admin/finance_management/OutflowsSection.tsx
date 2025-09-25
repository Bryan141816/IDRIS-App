import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  createOutflowFinanceRecord,
  UpdateReportData, // make sure this exists in your API handler
} from '../../../API_Handler/finance_management_handler';
import { OutflowItem } from './FinanceManagement';
import {
  toDateInput,
  normalizeBudgetAllocationName,
  validate,
  formatCurrency,
  withSwal,
} from './helpers';

export const normalizeRecordStatus = (status: string | null | undefined) => {
  const s = (status || "").toUpperCase();
  if (s === "PENDING") return "PENDING";
  if (s === "PAID") return "PAID";
  if (s === "APPROVED") return "APPROVED";
  if (s === "DENIED") return "DENIED";
  if (s === "RECONCILED") return "RECONCILED";
  
  return "PENDING";
};

const buildFormData = (form: Partial<OutflowItem>, isUpdate = false) => {
  const fd = new FormData();
  if (isUpdate) fd.append('finance_id', String((form as any).finance_id));
  fd.append('counterparty', form.counterparty!);
  fd.append('transaction_type', 'OUTFLOW');
  fd.append('amount', String(Number(form.amount)));
  fd.append('date', String(form.date)); // "YYYY-MM-DD"
  fd.append('status', normalizeRecordStatus(form.status));
  if (form.description) fd.append('description', form.description);
  fd.append('budget_for', normalizeBudgetAllocationName(form.budget_for));
  return fd;
};

// ---------- Modal ----------
const OutflowModal: React.FC<{
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  initial?: Partial<OutflowItem>;
  onClose: () => void;
  onSave?: (values: OutflowItem | Partial<OutflowItem>) => void;
}> = ({ open, mode, initial, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<OutflowItem>>(initial || {});
  const readOnly = mode === 'view';

  useEffect(() => {
    if (open) {
      setForm({
        ...initial,
        finance_id: (initial as any)?.finance_id,     // keep id for update
        date: toDateInput(initial?.date as any),
      });
    }
  }, [open, initial]);

  if (!open) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const errors = validate(form);
    if (errors.length) {
      await Swal.fire({ icon: 'warning', title: 'Check the form', text: errors.join(' ') });
      return;
    }
    const fd = buildFormData(form);
    const created = await withSwal('Saving expense…', () => createOutflowFinanceRecord(fd));
    onSave?.(created);
    onClose();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const fd = new FormData();
    fd.append('finance_id', String((form as any).finance_id));
    fd.append('status', normalizeRecordStatus(form.status));
    console.log(fd);

    const updated = await withSwal('Updating expense…', () => UpdateReportData(fd));
    onSave?.(updated);
    onClose();
  };

  const onSubmit = mode === 'edit' ? handleUpdate : handleCreate;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header"><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={onSubmit}>
          <div className="modal-content">
            <h3>{mode === 'add' ? 'Record New Expense' : mode === 'edit' ? 'Edit Expense' : 'View Expense'}</h3>

            {mode != "edit" &&
              <div className="form-group">
                <label>Budget For</label>
                <select
                  disabled={readOnly}
                  value={form.budget_for || ''}
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
            }

            {mode != "edit" &&
              <div className="form-group">
                <label>Amount (PHP)</label>
                <input
                  disabled={readOnly}
                  type="number"
                  min={0}
                  placeholder="Enter amount"
                  value={form.amount ?? ''}
                  onChange={e => setForm({ ...form, amount: +e.target.value })}
                />
              </div>
            }

            {mode != "edit" &&
              <div className="form-group">
                <label>Vendor/Supplier</label>
                <input
                  disabled={readOnly}
                  type="text"
                  placeholder="Enter vendor name"
                  value={form.counterparty || ''}
                  onChange={e => setForm({ ...form, counterparty: e.target.value })}
                />
              </div>
            }

            {mode != "edit" &&
              <div className="form-group">
                <label>Date</label>
                <input
                  disabled={readOnly}
                  type="date"
                  value={form.date || ''}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
            }

            <div className="form-group">
              <label>Status</label>
              <select
                disabled={readOnly}
                value={form.status || 'PENDING'}
                onChange={e => setForm({ ...form, status: e.target.value as OutflowItem['status'] })}
              >
                <option value="PENDING">PENDING</option>
                <option value="PAID">PAID</option>
                <option value="APPROVED">APPROVED</option>
                <option value="DENIED">DENIED</option>
                <option value="RECONCILED">RECONCILED</option>
              </select>
            </div>

            {mode != "edit" &&
              <div className="form-group">
                <label>Description</label>
                <textarea
                  disabled={readOnly}
                  placeholder="Enter description"
                  value={form.description || ''}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            }
          </div>

          <div className="modal-actions">
            <button className="secondary-btn" type="button" onClick={onClose}>Cancel</button>
            {mode !== 'view' && (
              <button className="primary-btn" type="submit">
                {mode === 'edit' ? 'Update' : 'Save'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------- Section (local rows + refresh on save) ----------
const OutflowsSection: React.FC<{ outflows?: OutflowItem[] }> = ({ outflows = [] }) => {
  const [rows, setRows] = useState<OutflowItem[]>(outflows);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selected, setSelected] = useState<OutflowItem | undefined>();

  useEffect(() => { setRows(outflows); }, [outflows]);

  const open = (mode: 'add' | 'edit' | 'view', row?: OutflowItem) => {
    setModalMode(mode);
    setSelected(row);
    setModalOpen(true);
  };

  // same upsert pattern as InflowSection
  const upsertRow = (item: OutflowItem) => {
    setRows(prev => {
      const idx = prev.findIndex(r => String((r as any).finance_id) === String((item as any).finance_id));
      if (idx >= 0) {
        const copy = prev.slice();
        copy[idx] = { ...prev[idx], ...item };
        return copy;
      }
      return [item, ...prev];
    });
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
            {rows.map((row, index) => (
              <tr key={(row as any).finance_id ?? index}>
                <td>{row.budget_for}</td>
                <td className="amount negative">{formatCurrency(row.amount)}</td>
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
        onSave={(saved) => {
          setModalOpen(false);
          upsertRow(saved as OutflowItem);
        }}
      />
    </div>
  );
};

export default OutflowsSection;

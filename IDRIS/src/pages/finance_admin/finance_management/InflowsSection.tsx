import React, { useState, useEffect } from 'react';
import Swal from "sweetalert2";
import { createInflowFinanceRecord, UpdateReportData } from '../../../API_Handler/finance_management_handler';
import { InflowItem } from './FinanceManagement';

export enum TransactionType {
  INFLOW = 'INFLOW',
  OUTFLOW = 'OUTFLOW',
}

const fmt = (n: number | bigint) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 }).format(n);

// ---- helpers -----------------------------------------------------
const toDateInput = (value?: string | Date | number | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const tzOffset = d.getTimezoneOffset() * 60000;
  const local = new Date(d.getTime() - tzOffset);
  return local.toISOString().slice(0, 10);
};

const normalizeTransactionType = (_: string | null | undefined) => "INFLOW";

const normalizeRecordStatus = (status: string | null | undefined) => {
  const s = (status || "").toUpperCase();
  if (s === "PENDING") return "PENDING";
  if (s === "RECEIVED") return "RECEIVED";
  return "PENDING";
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

const validate = (form: Partial<InflowItem>) => {
  const errs: string[] = [];
  if (!form.counterparty?.trim()) errs.push('Source is required.');
  if (form.amount == null || Number(form.amount) <= 0) errs.push('Amount must be greater than 0.');
  if (!form.budget_for) errs.push('Category is required.');
  if (!form.date) errs.push('Date is required.');
  if (!form.budget_for) errs.push('Budget allocation is required.');
  return errs;
};

const buildFormData = (form: Partial<InflowItem>, isUpdate = false) => {
  const fd = new FormData();
  if (isUpdate) { fd.append("finance_id", String(form.finance_id)); }
  fd.append('counterparty', form.counterparty!);
  fd.append('transaction_type', normalizeTransactionType("INFLOW"));
  fd.append('amount', String(Number(form.amount)));
  fd.append('date', form.date!); // "YYYY-MM-DD"
  fd.append('status', normalizeRecordStatus(form.status ?? 'PENDING'));
  if (form.description) fd.append('description', form.description);
  fd.append('budget_for', normalizeBudgetAllocationName(form.budget_for));
  return fd;
};

const withSwal = async <T,>(loadingTitle: string, task: () => Promise<T>) => {
  try {
    // show loading
    void Swal.fire({
      title: loadingTitle,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      showConfirmButton: false,
    });

    const result = await task();

    // switch to success (clear spinner first)
    Swal.hideLoading();
    await Swal.fire({
      icon: 'success',
      title: 'Success',
      text: 'Operation completed.',
      confirmButtonText: 'Great!',
      allowOutsideClick: true,
      showConfirmButton: true,
    });

    return result;
  } catch (error: any) {
    const message =
      error?.response?.data?.detail ||
      error?.message ||
      'An unexpected error occurred.';

    Swal.hideLoading();
    await Swal.fire({
      icon: 'error',
      title: 'Operation failed',
      text: message,
      confirmButtonText: 'OK',
      allowOutsideClick: true,
      showConfirmButton: true,
    });

    throw error;
  }
  // IMPORTANT: no 'finally Swal.close()' here
};


// ---- Modal -------------------------------------------------------
const InflowModal: React.FC<{
  open: boolean;
  mode: 'add' | 'edit' | 'view';
  initial?: Partial<InflowItem>;
  onClose: () => void;
  onSave?: (values: InflowItem | Partial<InflowItem>) => void;
}> = ({ open, mode, initial, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<InflowItem>>(initial || {});
  const readOnly = mode === 'view';

  useEffect(() => {
    if (open) {
      setForm({
        ...initial,
        date: toDateInput(initial?.date as any),
      });
    }
  }, [open, initial]);

  if (!open) return null;

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    const errors = validate(form);
    if (errors.length) {
      await Swal.fire({ icon: 'warning', title: 'Check the form', text: errors.join(' '), confirmButtonText: 'OK' });
      return;
    }

    const fd = buildFormData(form);
    const created = await withSwal('Saving inflow…', () => createInflowFinanceRecord(fd));
    onSave?.(created);
    onClose();
  };

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate(form);
    if (errors.length) {
      await Swal.fire({ icon: 'warning', title: 'Check the form', text: errors.join(' '), confirmButtonText: 'OK' });
      return;
    }

    const fd = buildFormData(form , true);

    console.log(fd);
    const updated = await withSwal('Updating inflow…', () => UpdateReportData(fd));

    onSave?.(updated);
    onClose();
  };

  const onSubmit = mode === 'edit' ? submitUpdate : submitCreate;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-content">
            <h3>
              {mode === 'add' ? 'Record New Inflow' : mode === 'edit' ? 'Edit Inflow' : 'View Inflow'}
            </h3>

            <div className="form-group">
              <label>Budget For</label>
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
              <label>Source</label>
              <input
                disabled={readOnly}
                type="text"
                placeholder="Enter funding source"
                value={form.counterparty || ""}
                onChange={e => setForm({ ...form, counterparty: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Amount (PHP)</label>
              <input
                disabled={readOnly}
                type="number"
                min={0}
                placeholder="Enter amount"
                value={form.amount ?? ""}
                onChange={e => setForm({ ...form, amount: +e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Date Received</label>
              <input
                disabled={readOnly}
                type="date"
                value={form.date || ""}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                disabled={readOnly}
                value={form.status || "PENDING"}
                onChange={e => setForm({ ...form, status: e.target.value as InflowItem['status'] })}
              >
                <option value="PENDING">PENDING</option>
                <option value="RECEIVED">RECEIVED</option>
              </select>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                disabled={readOnly}
                placeholder="Enter description"
                value={form.description || ""}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            {mode !== 'view' && (
              <button type="submit" className="primary-btn">
                {mode === 'edit' ? 'Update' : 'Save'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Section -----------------------------------------------------
const InflowsSection: React.FC<{ inflows?: InflowItem[] }> = ({ inflows = [] }) => {
  const [rows, setRows] = useState<InflowItem[]>(inflows);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selected, setSelected] = useState<InflowItem | undefined>();

  useEffect(() => {
    setRows(inflows);
  }, [inflows]);

  const open = (mode: 'add' | 'edit' | 'view', row?: InflowItem) => {
    setModalMode(mode);
    setSelected(row);
    setModalOpen(true);
  };

  // Merge helper (replace by finance_id or push if new)
  const upsertRow = (item: InflowItem) => {
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
            {rows?.map((row, index) => (
              <tr key={index}>
                <td>{row.counterparty}</td>
                <td className="amount positive">{fmt(row.amount)}</td>
                <td>{row.budget_for}</td>
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
        onSave={(saved) => {
            setModalOpen(false)
            upsertRow(saved as InflowItem)
          }
        }
      />
    </div>
  );
};

export default InflowsSection;

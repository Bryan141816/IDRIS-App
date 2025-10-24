import React, { useState, useEffect } from 'react';
import { createInflowFinanceRecord, UpdateReportData } from '../../../API_Handler/finance_management_handler';
import { FilterModal } from './FilterModal';
import Swal from "sweetalert2";
import { formatCurrency } from '../../helpers';
import {
  type InflowItem
} from './types';
import {
  toDateInput,
  normalizeTransactionType,
  normalizeBudgetAllocationName,
  validate,
  budgetOptions,
} from './helpers';

import {
  withSwal
} from '../../withSwal';

// CAN'T BE IN HELPER BECAUSE OF STATUS DIFFERENCE
export const normalizeRecordStatus = (status: string | null | undefined) => {
  const s = (status || "").toUpperCase();
  if (s === "PENDING") return "PENDING";
  if (s === "RECEIVED") return "RECEIVED";
  return "PENDING";
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

  console.log("received inflow: ", form?.budget_for)

  useEffect(() => {
    if (open) {
      setForm({
        ...initial,
        budget_for:
          initial?.budget_for == null
            ? undefined
            : String((initial as any).budget_for),
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
    console.log(fd);
    try {
      const created = await withSwal('Saving inflow…', () => createInflowFinanceRecord(fd));
      onSave?.(created);
      onClose();
    } catch (err) {
      // withSwal already showed an error modal; optionally log
      console.error('createInflowFinanceRecord error:', err);
      // do not close any modal here — withSwal handled modals
    }
  };

  const submitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validate(form);
    if (errors.length) {
      await Swal.fire({ icon: 'warning', title: 'Check the form', text: errors.join(' '), confirmButtonText: 'OK' });
      return;
    }
    console.log(form);
    const fd = buildFormData(form, true);

    try {
      const updated = await withSwal('Updating inflow…', () => UpdateReportData(fd));
      onSave?.(updated);
      onClose();
    } catch (err) {
      // don't close modal here (withSwal handled modals)
    }
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

            {/* {mode != "edit" && */}
            <div className="form-group">
              <label>Budget For</label>
              <select
                disabled={readOnly}
                value={String(form.budget_for ?? "")}
                onChange={e =>
                  setForm({
                    ...form,
                    budget_for: e.target.value as InflowItem["budget_for"],
                  })
                }
              >
                <option value="" disabled>
                  Select category
                </option>
                {budgetOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {/* } */}

            {mode != "edit" &&
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
            }

            {mode != "edit" &&
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
            }

            {mode != "edit" &&
              <div className="form-group">
                <label>Date Received</label>
                <input
                  disabled={readOnly}
                  type="date"
                  value={form.date || ""}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
            }

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

            {mode != "edit" &&
              <div className="form-group">
                <label>Description</label>
                <textarea
                  disabled={readOnly}
                  placeholder="Enter description"
                  value={form.description || ""}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
            }
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
const InflowsSection: React.FC<{ inflows?: InflowItem[], refetchData?: () => void }> = ({ inflows = [], refetchData }) => {
  const [rows, setRows] = useState<InflowItem[]>(inflows);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selected, setSelected] = useState<InflowItem | undefined>();
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => {
    setRows(inflows);
  }, [inflows]);

  const open = (mode: 'add' | 'edit' | 'view', row?: InflowItem) => {
    setModalMode(mode);
    console.log("row: ", row);
    setSelected(row);
    console.log("after row:", selected?.budget_for);
    setModalOpen(true);
  };

  const handleApplyFilters = (filters: { from?: string; to?: string }) => {
    if (filters.from && filters.to) {
      const fromDate = new Date(filters.from).getTime();
      const toDate = new Date(filters.to).getTime();
      const filtered = inflows.filter(item => {
        const itemDate = new Date(item.date).getTime();
        return itemDate >= fromDate && itemDate <= toDate;
      });
      setRows(filtered);
    } else {
      setRows(inflows);
    }
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
        <div className='title-btn-container'>
          <button className="secondary-btn" onClick={() => setFilterModalOpen(true)}>Filter</button>
          <button className="primary-btn" onClick={() => open('add')}>+ Record Inflow</button>
        </div>
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
                <td className="amount positive">{formatCurrency(row.amount)}</td>
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
          upsertRow(saved as InflowItem);
          if (refetchData) {
            refetchData();
          }
        }}
      />
      <FilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default InflowsSection;

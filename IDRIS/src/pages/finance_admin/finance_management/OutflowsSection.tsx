import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
  createOutflowFinanceRecord,
  UpdateReportData, // still available if you use it elsewhere
} from '../../../API_Handler/finance_management_handler';
import { OutflowItem, InflowItem, BudgetItem } from './types';
import { FilterModal } from './FilterModal';
import { formatCurrency } from '../../helpers';
import {
  toDateInput,
  validate,
  spendCategoryOptions,
  inflowSourceOptions,
  getAttachmentSrc,
} from './helpers';

import { withSwal } from '../../withSwal';

const buildFormData = (form: Partial<OutflowItem>, isUpdate = false) => {
  const fd = new FormData();
  if (isUpdate) fd.append('finance_id', String((form as any).finance_id));
  fd.append('counterparty', form.counterparty!);
  fd.append('transaction_type', 'OUTFLOW');
  fd.append('amount', String(Number(form.amount)));
  fd.append('date', String(form.date)); // "YYYY-MM-DD"
  if (form.purpose) fd.append('purpose', form.purpose);
  fd.append('spend_category', form.spend_category!);
  if (form.inflow_source) fd.append('inflow_source', form.inflow_source);
  if (form.attachment instanceof File) {
    fd.append('attachment', form.attachment);
  }
  return fd;
};

// ---------- Modal ----------
const OutflowModal: React.FC<{
  open: boolean;
  mode: 'add' | 'view';            // <-- no 'edit'
  initial?: Partial<OutflowItem>;
  inflows: InflowItem[];
  budgetData: BudgetItem[];
  onClose: () => void;
  onSave?: (values: OutflowItem | Partial<OutflowItem>) => void;
}> = ({ open, mode, initial, inflows, budgetData, onClose, onSave }) => {
  const [form, setForm] = useState<Partial<OutflowItem>>(initial || {});
  const [amountLimit, setAmountLimit] = useState<number>(0);
  const readOnly = mode === 'view';
  const hasSource = Boolean(form.inflow_source);
  const [wasClamped, setWasClamped] = useState(false);
  const lastClampRef = React.useRef(0);

  useEffect(() => {
    if (open) {
      setForm({
        ...initial,
        finance_id: (initial as any)?.finance_id,
        date: toDateInput(initial?.date as any),
      });
    }
  }, [open, initial]);

  useEffect(() => {
    const match = budgetData.find(x => x.budget_for === form.inflow_source);
    const limit = match?.inflow_total ?? 0;
    setAmountLimit(limit);

    let clampedNow = false;

    setForm(prev => {
      if (!form.inflow_source) {
        if ((prev.amount ?? 0) !== 0) {
          clampedNow = true;
        }
        return { ...prev, amount: 0 };
      }

      const current = prev.amount ?? 0;
      if (current > limit) {
        clampedNow = true;
        return { ...prev, amount: limit };
      }
      return prev;
    });

    if (clampedNow && Date.now() - lastClampRef.current > 400) {
      lastClampRef.current = Date.now();
      setWasClamped(true);
      Swal.fire({
        icon: 'info',
        title: 'Amount adjusted',
        text: `Amount was reduced to the maximum available (${formatCurrency(limit)}).`,
        timer: 1800,
        showConfirmButton: false,
      });
    } else if (!clampedNow) {
      setWasClamped(false);
    }
  }, [form.inflow_source, budgetData, form.amount]);

  useEffect(() => {
    let objectUrl = '';
    if (form.attachment instanceof File) {
      objectUrl = URL.createObjectURL(form.attachment);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [form.attachment]);

  if (!open) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    const errors = validate(form);
    if (errors.length) {
      await Swal.fire({ icon: 'warning', title: 'Check the form', text: errors.join(' ') });
      return;
    }

    if (form.inflow_source) {
      const budget = budgetData.find(b => b.budget_for === form.inflow_source);
      if (budget && form.amount && form.amount > budget.inflow_total) {
        await Swal.fire({ icon: 'warning', title: 'Invalid amount', text: 'Outflow amount cannot be greater than the total inflow for this category.' });
        return;
      }
    } else {
      await Swal.fire({ icon: 'warning', title: 'Invalid amount', text: 'Select an Inflow source first.' });
      return;
    }

    const fd = buildFormData(form);
    const created = await withSwal('Saving expense…', () => createOutflowFinanceRecord(fd));
    onSave?.(created);
    onClose();
  };

  const onSubmit = mode === 'add' ? handleCreate : undefined;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header"><button className="close-btn" onClick={onClose}>×</button></div>
        <form onSubmit={onSubmit}>
          <div className="modal-content">
            <h3>
              {mode === 'add' ? 'Record New Expense' : 'View Attachment'}
            </h3>

            {/* ADD mode: full form */}
            {mode === 'add' && (
              <>
                <div className="form-group">
                  <label>Spend Category</label>
                  <select
                    disabled={readOnly}
                    value={form.spend_category || ''}
                    onChange={e => setForm({ ...form, spend_category: e.target.value as OutflowItem['spend_category'] })}
                  >
                    <option value="" disabled>Select category</option>
                    {spendCategoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Inflow Source</label>
                  <select
                    disabled={readOnly}
                    value={form.inflow_source || ''}
                    onChange={e => setForm({ ...form, inflow_source: e.target.value as InflowItem['inflow_source'] })}
                  >
                    <option value="" disabled>Select source</option>
                    {inflowSourceOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount (PHP):</label>
                  <input
                    disabled={readOnly}
                    type="text"
                    min={0}
                    placeholder="Enter amount"
                    value={form.amount ?? ''}
                    onChange={e => setForm({ ...form, amount: hasSource ? +e.target.value : 0 })}
                  />
                  <span
                    role="status"
                    aria-live="polite"
                    className={`hint ${wasClamped ? 'warning' : ''}`}
                  >
                    {form.inflow_source
                      ? wasClamped
                        ? `Amount adjusted to max: ${formatCurrency(amountLimit)}`
                        : `Max for this source: ${formatCurrency(amountLimit)}`
                      : 'Amount stays 0 until a source is selected.'}
                  </span>
                </div>

                <div className="form-group">
                  <label>Vendor / Counterparty</label>
                  <input
                    disabled={readOnly}
                    type="text"
                    placeholder="Enter vendor name"
                    value={form.counterparty || ''}
                    onChange={e => setForm({ ...form, counterparty: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Date Spent</label>
                  <input
                    disabled={readOnly}
                    type="date"
                    value={form.date || ''}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description / Remarks</label>
                  <textarea
                    disabled={readOnly}
                    placeholder="Enter description"
                    value={form.purpose || ''}
                    onChange={e => setForm({ ...form, purpose: e.target.value })}
                  />
                </div>
              </>
            )}

            {/* ATTACHMENT: view-only shows preview; add shows file input */}
            <div className="form-group">
              <label>Attachment</label>

              {mode === 'view' ? (
                form.attachment ? (
                  <div className="attachment-preview">
                    <img
                      src={getAttachmentSrc(form.attachment)}
                      alt="Attachment preview"
                      style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }}
                    />
                    <a
                      href={getAttachmentSrc(form.attachment)}
                      target="_blank"
                      rel="noreferrer"
                      className="download-link"
                      style={{ display: 'inline-block', marginTop: 8 }}
                    >
                      Open full size
                    </a>
                  </div>
                ) : (
                  <span>No attachment</span>
                )
              ) : (
                <input
                  disabled={readOnly}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm({ ...form, attachment: e.target.files?.[0] || null })
                  }
                />
              )}
            </div>
          </div>

          <div className="modal-actions">
            <button className="secondary-btn" type="button" onClick={onClose}>Cancel</button>
            {mode !== 'view' && (
              <button className="primary-btn" type="submit">Save</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

// ---------- Section (local rows + refresh on save) ----------
const OutflowsSection: React.FC<{
  outflows?: OutflowItem[],
  inflows?: InflowItem[],
  budgetData?: BudgetItem[],
  refetchData?: () => void
}> = ({ outflows = [], inflows = [], budgetData = [], refetchData }) => {
  const [rows, setRows] = useState<OutflowItem[]>(outflows);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view'>('add');   // <-- no 'edit'
  const [selected, setSelected] = useState<OutflowItem | undefined>();
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  useEffect(() => { setRows(outflows); }, [outflows]);

  const open = (mode: 'add' | 'view', row?: OutflowItem) => {
    setModalMode(mode);
    setSelected(row);
    setModalOpen(true);
  };

  const handleApplyFilters = (filters: { from?: string; to?: string }) => {
    if (filters.from && filters.to) {
      const fromDate = new Date(filters.from).getTime();
      const toDate = new Date(filters.to).getTime();
      const filtered = outflows.filter(item => {
        const itemDate = new Date(item.date).getTime();
        return itemDate >= fromDate && itemDate <= toDate;
      });
      setRows(filtered);
    } else {
      setRows(outflows);
    }
  };

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
        <div className='title-btn-container'>
          <button className="secondary-btn" onClick={() => setFilterModalOpen(true)}>Filter</button>
          <button className="primary-btn" onClick={() => open('add')}>+ Record Expense</button>
        </div>
      </div>

      <div className="outflows-table">
        <table>
          <thead>
            <tr>
              <th>Spend Category</th>
              <th>Amount</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={(row as any).finance_id ?? index}>
                <td>{row.spend_category}</td>
                <td className="amount negative">{formatCurrency(row.amount)}</td>
                <td>{row.counterparty}</td>
                <td>{new Date(row.date).toLocaleDateString()}</td>
                <td>{row.purpose}</td>
                <td>
                  {/* Only view (attachment) */}
                  <button className="action-btn" onClick={() => open('view', row)}>View Attachment</button>
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
        inflows={inflows}
        budgetData={budgetData}
        onClose={() => setModalOpen(false)}
        onSave={(saved) => {
          setModalOpen(false);
          if (saved) upsertRow(saved as OutflowItem);
          if (refetchData) refetchData();
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

export default OutflowsSection;

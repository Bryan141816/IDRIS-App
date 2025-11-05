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
  validate,
  inflowSourceOptions,
  strip_underscores,
  normalizeInflowType,
  getAttachmentSrc,
} from './helpers';

import {
  withSwal
} from '../../withSwal';

const buildFormData = (form: Partial<InflowItem>, isUpdate = false) => {
  const fd = new FormData();
  if (isUpdate && form.finance_id != null) fd.append("finance_id", String(form.finance_id));
  if (form.counterparty) fd.append('counterparty', form.counterparty);
  fd.append('transaction_type', normalizeTransactionType("INFLOW"));
  fd.append('amount', String(Number(form.amount ?? 0)));
  if (form.date) fd.append('date', String(form.date)); // "YYYY-MM-DD"
  if (form.purpose) fd.append('purpose', form.purpose);
  if (form.inflow_source) fd.append('inflow_source', form.inflow_source);
  if (form.inflow_type) fd.append('inflow_type', form.inflow_type);
  if (form.attachment instanceof File) {
    fd.append('attachment', form.attachment);
  }
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

  useEffect(() => {
    if (open) {
      setForm({
        ...initial,
        inflow_source:
          initial?.inflow_source == null
            ? undefined
            : (initial.inflow_source as InflowItem["inflow_source"]),
        inflow_type: normalizeInflowType(initial?.inflow_type as any), // ← add this
        date: toDateInput(initial?.date as any),
      });
    }
  }, [open, initial]);

  const [previewSrc, setPreviewSrc] = useState<string>('');
  useEffect(() => {
    const src = getAttachmentSrc?.(form.attachment) ?? '';
    setPreviewSrc(src);
    return () => {
      if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
    };
  }, [form.attachment]);

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

            {/* ========= VIEW-ONLY: show just the attachment ========== */}
            {mode === 'view' ? (
              <div className="form-group">
                <label>Attachment</label>
                {form.attachment ? (
                  <div className="attachment-preview">
                    <img
                      src={previewSrc}
                      alt="Attachment preview"
                      style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }}
                    />
                    {previewSrc && (
                      <a
                        href={previewSrc}
                        target="_blank"
                        rel="noreferrer"
                        className="download-link"
                        style={{ display: 'inline-block', marginTop: 8 }}
                      >
                        Open full size
                      </a>
                    )}
                  </div>
                ) : (
                  <span>No attachment</span>
                )}
              </div>
            ) : (
              /* ========= ADD/EDIT: original fields ========= */
              <>
                <div className="form-group">
                  <label>Inflow Source</label>
                  <select
                    disabled={readOnly}
                    value={String(form.inflow_source ?? "")}
                    onChange={e =>
                      setForm({
                        ...form,
                        inflow_source: e.target.value as InflowItem["inflow_source"],
                      })
                    }
                  >
                    <option value="" disabled>Select source</option>
                    {inflowSourceOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* <div className="form-group">
                  <label>Payee (recipient)</label>
                  <input
                    disabled={readOnly}
                    type="text"
                    placeholder="Enter funding source"
                    value={form.counterparty || ""}
                    onChange={e => setForm({ ...form, counterparty: e.target.value })}
                  />
                </div> */}

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
                  <label>Remarks / Description</label>
                  <textarea
                    disabled={readOnly}
                    placeholder="Enter purpose"
                    value={form.purpose || ""}
                    onChange={e => setForm({ ...form, purpose: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Method</label>
                  <select
                    disabled={readOnly}
                    value={form.inflow_type || ""}
                    onChange={(e) =>
                      setForm({ ...form, inflow_type: e.target.value })
                    }
                  >
                    <option value="" disabled>Select type</option>
                    <option value="CASH">Cash</option>
                    <option value="CHECK">Check</option>
                  </select>
                </div>

                {/* Attachment input ONLY for add/edit */}
                <div className="form-group">
                  <label>Attachment</label>
                  <input
                    disabled={readOnly}
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setForm({ ...form, attachment: e.target.files?.[0] || undefined })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-btn" onClick={onClose}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </button>
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
    setSelected(row);
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
              <th>Inflow Source</th>
              <th>Amount</th>
              {/* <th>Source</th> */}
              <th>Date</th>
              <th>Purpose</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((row, index) => (
              <tr key={index}>
                <td>{strip_underscores(row.inflow_source)}</td>
                <td className="amount positive">{formatCurrency(row.amount)}</td>
                {/* <td>{row.counterparty}</td> */}
                <td>{new Date(row.date).toLocaleDateString()}</td>
                <td>{row.purpose}</td>
                <td>
                  {/* <button className="action-btn" onClick={() => open('edit', row)}>Edit</button> */}
                  <button className="action-btn" onClick={() => open('view', row)}>View Attachment</button>
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

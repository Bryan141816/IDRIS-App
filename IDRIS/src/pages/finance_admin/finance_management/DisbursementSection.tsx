import React, { useState } from "react";

const BUDGET_SOURCES = [
  "Government Grants and Funds",
  "Private Sector Contributions",
  "Community-Based Initiatives",
  "Monetary Donations",
];

interface Item {
  id: number;
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
  vendor: string;
}

interface RequestData {
  id: number;
  title: string;
  status: "pending" | "approved";
  dateRequested: string;
  budgetSource: string;
  items: Item[];
}

const INITIAL_DATA: RequestData[] = [
  {
    id: 1001,
    title: "IT Equipment",
    status: "pending",
    dateRequested: "10/22/2025",
    budgetSource: BUDGET_SOURCES[0],
    items: [
      { id: 1, name: "Mouse", qty: 10, unit: "pcs", unitCost: 0, vendor: "" },
      { id: 2, name: "Keyboard", qty: 5, unit: "pcs", unitCost: 0, vendor: "" },
    ],
  }
];

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`status-badge ${status.toLowerCase()}`}>{status.toUpperCase()}</span>
);

const DisbursementSection: React.FC = () => {
  const [requests, setRequests] = useState(INITIAL_DATA);
  const [showModal, setShowModal] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [form, setForm] = useState({
    dateOfPayment: "",
    budgetSource: BUDGET_SOURCES[0],
    items: INITIAL_DATA[0].items.map(i => ({ ...i })),
    remarks: "",
    attachment: undefined as File | undefined,
  });

  const handleDisburseClick = (idx: number) => {
    setSelectedIdx(idx);
    setForm({
      dateOfPayment: "",
      budgetSource: requests[idx].budgetSource,
      items: requests[idx].items.map(i => ({ ...i, unitCost: 0, vendor: "" })),
      remarks: "",
      attachment: undefined,
    });
    setShowModal(true);
  };

  const onItemChange = (idx: number, field: string, value: string | number) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) =>
        i !== idx
          ? item
          : { ...item, [field]: value, unitCost: field === "unitCost" ? Number(value) : item.unitCost }
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIdx === null) return;
    setRequests(reqs =>
      reqs.map((r, i) =>
        i === selectedIdx ? { ...r, status: "approved" } : r
      )
    );
    setShowModal(false);
  };

  return (
    <div className="disbursement-section">
      <div className="section-header">
        <h2>Disbursement</h2>
      </div>
      <div className="outflows-table">
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Title</th>
              <th>Date Requested</th>
              <th>Status</th>
              <th>Budget Source</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((row, idx) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.title}</td>
                <td>{row.dateRequested}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
                <td>{row.budgetSource}</td>
                <td>
                  <button
                    className="action-btn"
                    onClick={() => handleDisburseClick(idx)}
                    disabled={row.status === "approved"}
                  >
                    Disburse
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && selectedIdx !== null && (
        <div className="modal-overlay">
          <div className="modal compact-modal">
            <div className="modal-header">
              <button className="close-btn" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-content compact-content">
              <h3>Disburse Request #{requests[selectedIdx].id}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <label>Request Title</label>
                  <input disabled value={requests[selectedIdx].title} />
                </div>
                <div className="form-row">
                  <label>Date of Payment</label>
                  <input
                    type="date"
                    value={form.dateOfPayment}
                    onChange={e => setForm(f => ({ ...f, dateOfPayment: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Budget Source</label>
                  <select
                    value={form.budgetSource}
                    onChange={e => setForm(f => ({ ...f, budgetSource: e.target.value }))}
                    required
                  >
                    {BUDGET_SOURCES.map(bs => (
                      <option key={bs} value={bs}>{bs}</option>
                    ))}
                  </select>
                </div>
                <label>Items</label>
                <table className="modal-items-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Qty</th>
                      <th>Unit</th>
                      <th>Unit Cost</th>
                      <th>Total Cost</th>
                      <th>Vendor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.qty}</td>
                        <td>{item.unit}</td>
                        <td>
                          <input
                            type="number"
                            value={item.unitCost}
                            min="0"
                            onChange={e => onItemChange(idx, "unitCost", Number(e.target.value))}
                            required
                          />
                        </td>
                        <td className="amount">
                          ₱{(item.unitCost * item.qty).toLocaleString()}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.vendor}
                            onChange={e => onItemChange(idx, "vendor", e.target.value)}
                            required
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="form-row">
                  <label>Attachments (Receipts)</label>
                  <input
                  required
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={e =>
                      e.target.files && setForm(f => ({ ...f, attachment: e.target.files![0] }))
                    }
                  />
                  {form.attachment && <span>{form.attachment.name}</span>}
                </div>
                <div className="form-row">
                  <label>Remarks</label>
                  <textarea
                    value={form.remarks}
                    onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="modal-actions">
                  <button type="submit" className="primary-btn">Disburse</button>
                  <button type="button" className="secondary-btn" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisbursementSection;

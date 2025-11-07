import React, { useState, useEffect } from "react";
import { getDisbursements, updateDisbursement } from "../../../API_Handler/finance_disbursement_handler";

const BUDGET_SOURCES = [
  "Government Grants and Funds",
  "Private Sector Contributions",
  "Community-Based Initiatives",
  "Monetary Donations",
];

interface Item {
  item_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  vendor: string;
}

interface DisbursementData {
  disbursement_id: string;
  disbursement_name: string;
  status: "pending" | "approved";
  date_created: string;
  origin_name: string;
  items: Item[];
}

interface FormState {
  dateOfPayment: string;
  budgetSource: string;
  items: Item[];
  remarks: string;
  attachment?: File;
}

const StatusBadge = ({ status }: { status:string }) => (
  <span className={`status-badge ${status.toLowerCase()}`}>{status.toUpperCase()}</span>
);

const DisbursementSection: React.FC = () => {
  const [requests, setRequests] = useState<DisbursementData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({
    dateOfPayment: "",
    budgetSource: BUDGET_SOURCES[0],
    items: [],            // now typed as Item[]
    remarks: "",
    attachment: undefined,
  });
  
  const fetchDisbursements = async () => {
    try {
      const data = await getDisbursements();
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch disbursements:", error);
    }
  };

  useEffect(() => {
    fetchDisbursements();
  }, []);


  const handleDisburseClick = (idx: number) => {
    setSelectedIdx(idx);
    setForm({
      dateOfPayment: "",
      budgetSource: requests[idx].origin_name,
      items: requests[idx].items.map(i => ({ ...i, unitCost: 0, vendor: "" })), // Item[]
      remarks: "",
      attachment: undefined,
    });
    setShowModal(true);
  };

  const onItemChange = <K extends keyof Item>(idx: number, field: K, value: Item[K]) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIdx === null || !form.attachment) return;

    const disbursementToUpdate = requests[selectedIdx];
    
    const formData = new FormData();
    formData.append("disbursementId", disbursementToUpdate.disbursement_id);
    formData.append("status", "approved");
    formData.append("remarks", form.remarks);
    formData.append("attachment", form.attachment);
    formData.append("dateOfPayment", form.dateOfPayment);
    formData.append("budgetSource", form.budgetSource);
    
    // Serialize the items array to a JSON string
    const itemsData = form.items.map(item => ({
      item_id: item.item_id,
      unit_cost: item.unit_cost,
      vendor: item.vendor,
    }));
    formData.append("items", JSON.stringify(itemsData));

    try {
      await updateDisbursement(disbursementToUpdate.disbursement_id, formData);
      setShowModal(false);
      fetchDisbursements();
    } catch (error) {
      console.error("Failed to update disbursement:", error);
    }
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
              <tr key={row.disbursement_id}>
                <td>{row.disbursement_id}</td>
                <td>{row.disbursement_name}</td>
                <td>{row.date_created}</td>
                <td>
                  <StatusBadge status={row.status} />
                </td>
                <td>{row.origin_name}</td>
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
              <h3>Disburse Request #{requests[selectedIdx].disbursement_id}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <label>Request Title</label>
                  <input disabled value={requests[selectedIdx].disbursement_name} />
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
                      <tr key={item.item_id}>
                        <td>{item.item_name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td>
                          <input
                            type="number"
                            value={item.unit_cost}
                            min="0"
                            onChange={e => onItemChange(idx, "unit_cost", Number(e.target.value))}
                            required
                          />
                        </td>
                        <td className="amount">
                          ₱{(item.unit_cost * item.quantity).toLocaleString()}
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

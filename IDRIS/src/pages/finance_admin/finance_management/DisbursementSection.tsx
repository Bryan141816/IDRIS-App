import React, { useState, useEffect } from "react";
import MultiSelect from "./MultiSelect";
import {
  getDisbursements,
  updateDisbursement,
  getDisbursement,
} from "../../../API_Handler/finance_disbursement_handler";
import { Disbursement as DisbursementType, DisbursementItem, BudgetItem } from "./types";
import { getAttachmentSrc, toDateInputValue } from "./helpers";
import { formatCurrency } from "../../helpers";
import Swal from "sweetalert2";

interface FormState {
  origin_name: string;
  date_updated: string;
  budgetSource: string[];
  items: DisbursementItem[];
  remarks: string;
  attachment?: File | string;
}

type DisbursementSectionProps = {
  budgetData?: BudgetItem[];
  refetchData: () => Promise<void>;
};

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`status-badge ${status.toLowerCase()}`}>
    {status.toUpperCase()}
  </span>
);

const DisbursementSection: React.FC<{ 
  budgetData?: BudgetItem[],
  refetchData?: () => void
}> = ({ budgetData = [], refetchData }) => {
  const [requests, setRequests] = useState<DisbursementType[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [form, setForm] = useState<FormState>({
    origin_name: "",
    date_updated: "",
    budgetSource: [],
    items: [],
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
  const [availableAmount, setAvailableAmount] = useState(0);

  const handleDisburseClick = (idx: number) => {
    setSelectedIdx(idx);
    const disbursement = requests[idx];
    console.log("selected disbursement", disbursement);

    if (disbursement.status.toLocaleLowerCase() === "approved") {
      setForm({
        origin_name: disbursement.origin_name || "",
        date_updated: disbursement.date_updated || "",
        budgetSource: disbursement.budgetSource ? [disbursement.budgetSource] : [],
        items: disbursement.items.map(item => ({
          ...item,
          unit_cost:
            typeof item.unit_cost === "number"
              ? item.unit_cost
              : parseFloat(item.unit_cost),
        })),
        remarks: disbursement.remarks || "",
        attachment: disbursement.attachment,
      });
      setIsReadOnly(true);
    } else {
      setForm({
        origin_name: disbursement.origin_name,
        date_updated: "",
        budgetSource: [],
        items: disbursement.items.map((i) => ({
          ...i,
          unit_cost: 0,
          vendor: "",
        })),
        remarks: "",
        attachment: undefined,
      });
      setIsReadOnly(false);
    }
    setShowModal(true);
  };

  useEffect(() => {
    const selectedSources = form.budgetSource;
    const total = budgetData
      .filter(b => selectedSources.includes(b.budget_for))
      .reduce((acc, b) => acc + b.net_total, 0);
    setAvailableAmount(total);
  }, [form.budgetSource, budgetData]);

  const onItemChange = <K extends keyof DisbursementItem>(idx: number, field: K, value: DisbursementItem[K]) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === idx ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleBudgetSourceChange = (selected: string[]) => {
    setForm(f => ({ ...f, budgetSource: selected }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIdx === null || !form.attachment) return;

    const totalCost = form.items.reduce((acc, item) => acc + item.unit_cost * item.quantity, 0);
    if (totalCost > availableAmount) {
      Swal.fire({
        icon: 'error',
        title: 'Exceeds Budget',
        text: `The total cost of items (₱${totalCost.toLocaleString()}) exceeds the available amount (₱${availableAmount.toLocaleString()}).`,
      });
      return;
    }

    const disbursementToUpdate = requests[selectedIdx];

    const formData = new FormData();
    formData.append("disbursementId", disbursementToUpdate.disbursement_id);
    formData.append("status", "approved");
    formData.append("remarks", form.remarks);
    formData.append("attachment", form.attachment);
    formData.append("date_updated", form.date_updated);
    formData.append("budgetSource", JSON.stringify(form.budgetSource));

    // Serialize the items array to a JSON string
    const itemsData = form.items.map((item) => ({
      item_id: item.item_id,
      unit_cost: item.unit_cost,
      vendor: item.vendor,
    }));
    formData.append("items", JSON.stringify(itemsData));

    try {
      await updateDisbursement(disbursementToUpdate.disbursement_id, formData);
      setShowModal(false);
      await Promise.allSettled([
        fetchDisbursements(),
        Promise.resolve().then(() => refetchData?.())
      ]);
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
              <th>Origin Name</th>
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
                    {row.status.toLocaleLowerCase() === "approved"
                      ? "View Attachment"
                      : "Disburse"}
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
              <h3>
                {isReadOnly ? "View Disbursement" : "Disburse Request"} #
                {requests[selectedIdx].disbursement_id}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <label>Request Title</label>
                  <input
                    disabled
                    value={requests[selectedIdx].disbursement_name}
                  />
                </div>
                <div className="form-row">
                  <label>Date of Payment</label>
                  <input
                    type="date"
                    value={toDateInputValue(form.date_updated)}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date_updated: e.target.value }))
                    }
                    required
                    disabled={isReadOnly}
                  />
                </div>
                <div className="form-row">
                  <label>Origin Name</label>
                  <input disabled value={requests[selectedIdx].origin_name} />
                </div>
                <div className="form-row">
                  <label>Budget Source</label>
                  <MultiSelect
                    options={budgetData.map(b => ({ value: b.budget_for, label: b.budget_for }))}
                    selected={form.budgetSource}
                    onChange={handleBudgetSourceChange}
                    isDisabled={isReadOnly}
                  />
                </div>
                <div className="form-row available-amount">
                  <label>Available Amount:</label>
                  <span>{formatCurrency(availableAmount)}</span>
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
                            onChange={(e) =>
                              onItemChange(
                                idx,
                                "unit_cost",
                                Number(e.target.value),
                              )
                            }
                            required
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="amount">
                          ₱{(item.unit_cost * item.quantity).toLocaleString()}
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.vendor}
                            onChange={(e) =>
                              onItemChange(idx, "vendor", e.target.value)
                            }
                            required
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="form-row">
                  <label>Attachments (Receipts)</label>
                  {!isReadOnly && (
                    <input
                      required={!isReadOnly}
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) =>
                        e.target.files &&
                        setForm((f) => ({
                          ...f,
                          attachment: e.target.files![0],
                        }))
                      }
                      disabled={isReadOnly}
                    />
                  )}
                  {form.attachment && typeof form.attachment === "object" ? (
                    <span>{form.attachment.name}</span>
                  ) : form.attachment && typeof form.attachment === "string" ? (
                    isReadOnly ? (
                      <div>
                        {form.attachment.endsWith(".pdf") ? (
                          <iframe
                            src={getAttachmentSrc(form.attachment)}
                            width="100%"
                            height="500px"
                          />
                        ) : (
                          <img
                            src={getAttachmentSrc(form.attachment)}
                            alt="Attachment"
                            style={{ maxWidth: "100%" }}
                          />
                        )}
                      </div>
                    ) : (
                      <a
                        href={getAttachmentSrc(form.attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Attachment
                      </a>
                    )
                  ) : null}
                </div>
                <div className="form-row">
                  <label>Remarks</label>
                  <textarea
                    value={form.remarks}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, remarks: e.target.value }))
                    }
                    rows={2}
                    disabled={isReadOnly}
                  />
                </div>
                <div className="modal-actions">
                  {isReadOnly ? (
                    <button
                      type="button"
                      className="secondary-btn"
                      onClick={() => setShowModal(false)}
                    >
                      Close
                    </button>
                  ) : (
                    <>
                      <button type="submit" className="primary-btn">
                        Disburse
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setShowModal(false)}
                      >
                        Cancel
                      </button>
                    </>
                  )}
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

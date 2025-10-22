import React, { useEffect, useMemo, useState } from "react";
import './DonorDashboard.scss';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { DonorAggregates, fetchMyDonations, getDonorAggregates_legacy } from '../../../API_Handler/donations_donation_handler';

// Types
type DonationType = "CASH" | "INKIND";
type DonationStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
type DonationFrequency = "ONE_TIME" | "MONTHLY" | "QUARTERLY" | "YEARLY";

interface DonationCash {
  cash_id: number;
  amount: string | number | null;
  payment_method?: string | null;
}

interface DonationInKind {
  inkind_id: number;
  item_description?: string | null;
  description?: string | null;
  quantity?: string | null;
  estimated_value?: string | number | null;
}

export interface DonationRow {
  donation_id: number;
  donor_id: number;
  donation_date: string;
  donation_type: DonationType;
  status: DonationStatus;
  frequency: DonationFrequency;
  next_donation_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
  cash?: DonationCash | null;
  inkind?: DonationInKind | null;
  proposal_id?: number | null;
  proposal?: {
    title: string;
  } | null;
}

interface FetchParams {
  userId?: number;
  from?: string;
  to?: string;
  status?: DonationStatus;
  type?: DonationType;
}

// Utilities
const currency = (v?: number | string | null) => {
  if (v === undefined || v === null || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "PHP", maximumFractionDigits: 2 });
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

const statusColor: Record<DonationStatus, string> = {
  PENDING: "#fcb814",
  COMPLETED: "#10b981",
  FAILED: "#ef4444",
  CANCELLED: "#6b7280",
};

const typeColor: Record<DonationType, string> = {
  CASH: "#749AB6",
  INKIND: "#fcb814",
};


export const DonorDashboard: React.FC = () => {
  const toISODate = (d?: string | Date | null): string | undefined => {
    if (!d) return undefined;
    const date = d instanceof Date ? d : new Date(d);
    if (isNaN(date.getTime())) return undefined;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // State
  const _date = new Date();
  const [date_from, setDateFrom] = useState<string | null | undefined>(toISODate(new Date(_date.getFullYear(), 0, 1)) ?? null);
  const [date_to, setDateTo] = useState<string | null | undefined>(toISODate(_date) ?? null);
  const [status, setStatus] = useState<DonationStatus | "ALL">("ALL");
  const [dtype, setDtype] = useState<DonationType | "ALL">("ALL");
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [selectedDonation, setSelectedDonation] = useState<DonationRow | null>(null);
  const [sortField, setSortField] = useState<string>('donation_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Data
  const [donorData, setDonorData] = useState<DonorAggregates>();

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const from = toISODate(date_from);
      const to = toISODate(date_to);

      // Fetch aggregates
      const aggData = await getDonorAggregates_legacy(from, to);
      setDonorData(aggData);

      // Fetch donation history
      const donationRows = await handlefetchMyDonations({
        from,
        to,
        status: status === "ALL" ? undefined : status,
        type: dtype === "ALL" ? undefined : dtype,
      });
      setRows(donationRows);

    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? "Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void reload();
  }, [status, dtype, date_from, date_to]);

  async function handlefetchMyDonations(params: FetchParams): Promise<DonationRow[]> {
    try {
      const response = await fetchMyDonations(params.from, params.to, params.status, params.type, 50, page);
      if (!response) {
        throw new Error("Failed to fetch donations");
      }
      return response;
    } catch (error) {
      console.error("An error occurred while fetching donations:", error);
      return [];
    }
  }

  // Aggregations
  const totals = useMemo(() => {
    let totalCash = 0;
    let totalInKind = 0;
    let recActive = 0;
    let completed = 0;

    rows.forEach((r) => {
      if (r.status === "COMPLETED") completed += 1;
      if (r.frequency !== "ONE_TIME" && r.is_active) recActive += 1;

      if (r.donation_type === "CASH" && r.cash?.amount) {
        const amt = Number(r.cash.amount);
        if (!Number.isNaN(amt)) totalCash += amt;
      }
      if (r.donation_type === "INKIND" && r.inkind?.estimated_value) {
        const val = Number(r.inkind.estimated_value);
        if (!Number.isNaN(val)) totalInKind += val;
      }
    });

    return { totalCash, totalInKind, recActive, completed };
  }, [rows]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortField) {
        case 'donation_date':
          aVal = new Date(a.donation_date).getTime();
          bVal = new Date(b.donation_date).getTime();
          break;
        case 'amount':
          aVal = a.donation_type === "CASH" ? Number(a.cash?.amount || 0) : Number(a.inkind?.estimated_value || 0);
          bVal = b.donation_type === "CASH" ? Number(b.cash?.amount || 0) : Number(b.inkind?.estimated_value || 0);
          break;
        default:
          aVal = (a as any)[sortField] || '';
          bVal = (b as any)[sortField] || '';
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }, [rows, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const onExportCsv = () => {
    const headers = ["Donation ID","Date","Type","Amount/Value","Status","Frequency"]; 
    const body = rows.map((r) => [
      r.donation_id,
      new Date(r.donation_date).toISOString(),
      r.donation_type,
      r.donation_type === "CASH" ? r.cash?.amount ?? "" : r.inkind?.estimated_value ?? "",
      r.status,
      r.frequency,
    ]);

    const csv = [headers, ...body].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `donations.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  if (loading) {
    return (
      <div className="donor-dashboard">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your donation history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h2 className="dashboard-title">Donor Dashboard</h2>
          <p className="dashboard-subtitle">Track your donations, view impact, and download your receipts.</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-content">
            <h3 className="stat-title">Total Cash Donated</h3>
            <p className="stat-value">{currency(totals.totalCash)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3 className="stat-title">In‑kind (est. value)</h3>
            <p className="stat-value">{currency(totals.totalInKind)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3 className="stat-title">Completed Donations</h3>
            <p className="stat-value">{totals.completed}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-content">
            <h3 className="stat-title">Active Recurring</h3>
            <p className="stat-value">{totals.recActive}</p>
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="table-container">
        <div className="table-header">
          <div className="filter-controls">
            <div className="filter-group">
              <label>From:</label>
              <input
                type="date"
                value={date_from || ''}
                onChange={(e) => setDateFrom(e.target.value || null)}
                className="date-input"
              />
            </div>
            <div className="filter-group">
              <label>To:</label>
              <input
                type="date"
                value={date_to || ''}
                onChange={(e) => setDateTo(e.target.value || null)}
                className="date-input"
              />
            </div>
            <div className="filter-group">
              <label>Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="filter-select"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Type:</label>
              <select
                value={dtype}
                onChange={(e) => setDtype(e.target.value as any)}
                className="filter-select"
              >
                <option value="ALL">All types</option>
                <option value="CASH">Cash</option>
                <option value="INKIND">In-kind</option>
              </select>
            </div>
          </div>
          <div className="action-buttons">
            <button className="export-btn" onClick={onExportCsv}>
              📄 Export CSV
            </button>
            <button className="refresh-btn" onClick={reload}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="error-state">
            <p>Error: {error}</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="donations-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('donation_date')} className="sortable">
                    Date {sortField === 'donation_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('donation_type')} className="sortable">
                    Type {sortField === 'donation_type' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('amount')} className="sortable">
                    Amount/Value {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('status')} className="sortable">
                    Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Frequency</th>
                  <th>Proposal Title</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.donation_id} onClick={() => setSelectedDonation(row)}>
                    <td>{fmtDate(row.donation_date)}</td>
                    <td>
                      <span className={`type-tag ${row.donation_type.toLowerCase()}`}>
                        {row.donation_type === "CASH" ? "Cash" : "In-kind"}
                      </span>
                    </td>
                    <td className="amount-cell">
                      {currency(row.donation_type === "CASH" ? row.cash?.amount : row.inkind?.estimated_value)}
                    </td>
                    <td>
                      <span className={`status-tag ${row.status.toLowerCase()}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>{row.frequency === "ONE_TIME" ? "One-time" : row.frequency.charAt(0) + row.frequency.slice(1).toLowerCase()}</td>
                    <td>
                      {row.proposal ? (
                        <a href={`/proposals/${row.proposal_id}`} onClick={(e) => e.stopPropagation()}>
                          {row.proposal.title}
                        </a>
                      ) : "—"}
                    </td>
                    <td>
                      <div className="action-buttons-cell">
                        <button
                          className="view-btn"
                          onClick={(e) => { e.stopPropagation(); setSelectedDonation(row); }}
                          title="View details"
                        >
                          👁️
                        </button>
                        <button
                          className="download-btn"
                          disabled={row.status !== "COMPLETED"}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/donation/receipt/${row.donation_id}`, '_blank');
                          }}
                          title="Download receipt"
                        >
                          📥
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedRows.length === 0 && (
              <div className="empty-state">
                <p>No donations found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedDonation && (
        <div className="modal-overlay" onClick={() => setSelectedDonation(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Donation Details</h3>
              <button className="close-btn" onClick={() => setSelectedDonation(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Donation ID:</label>
                  <span>{selectedDonation.donation_id}</span>
                </div>
                <div className="detail-item">
                  <label>Date:</label>
                  <span>{fmtDate(selectedDonation.donation_date)}</span>
                </div>
                <div className="detail-item">
                  <label>Type:</label>
                  <span className={`type-tag ${selectedDonation.donation_type.toLowerCase()}`}>
                    {selectedDonation.donation_type === "CASH" ? "Cash" : "In-kind"}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status-tag ${selectedDonation.status.toLowerCase()}`}>
                    {selectedDonation.status}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Frequency:</label>
                  <span>{selectedDonation.frequency === "ONE_TIME" ? "One-time" : selectedDonation.frequency}</span>
                </div>
                {selectedDonation.donation_type === "CASH" && selectedDonation.cash && (
                  <>
                    <div className="detail-item">
                      <label>Amount:</label>
                      <span>{currency(selectedDonation.cash.amount)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Payment Method:</label>
                      <span>{selectedDonation.cash.payment_method || "—"}</span>
                    </div>
                  </>
                )}
                {selectedDonation.donation_type === "INKIND" && selectedDonation.inkind && (
                  <>
                    <div className="detail-item">
                      <label>Item Description:</label>
                      <span>{selectedDonation.inkind.item_description || "—"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Quantity:</label>
                      <span>{selectedDonation.inkind.quantity || "—"}</span>
                    </div>
                    <div className="detail-item">
                      <label>Estimated Value:</label>
                      <span>{currency(selectedDonation.inkind.estimated_value)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Description:</label>
                      <span>{selectedDonation.inkind.description || "—"}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

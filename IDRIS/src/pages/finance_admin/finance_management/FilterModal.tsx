import React, { useState, useEffect } from 'react';

type FilterType = "All Time" | "Monthly" | "Yearly" | "Custom Range";

type FilterModalProps = {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: { from?: string; to?: string }) => void;
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
const months = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
];

export const FilterModal: React.FC<FilterModalProps> = ({ open, onClose, onApplyFilters }) => {
  const [filterType, setFilterType] = useState<FilterType>("All Time");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  if (!open) return null;

  const handleApply = () => {
    let from: string | undefined;
    let to: string | undefined;

    switch (filterType) {
      case "Monthly":
        from = new Date(selectedYear, selectedMonth - 1, 1).toISOString().slice(0, 10);
        to = new Date(selectedYear, selectedMonth, 0).toISOString().slice(0, 10);
        break;
      case "Yearly":
        from = new Date(selectedYear, 0, 1).toISOString().slice(0, 10);
        to = new Date(selectedYear, 11, 31).toISOString().slice(0, 10);
        break;
      case "Custom Range":
        from = fromDate;
        to = toDate;
        break;
      case "All Time":
      default:
        from = undefined;
        to = undefined;
        break;
    }
    onApplyFilters({ from, to });
    onClose();
  };

  const handleFilterTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as FilterType;
    setFilterType(newType);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <h3>Filter Options</h3>
          <div className="form-group">
            <label>Filter by</label>
            <select value={filterType} onChange={handleFilterTypeChange}>
              <option>All Time</option>
              <option>Monthly</option>
              <option>Yearly</option>
              <option>Custom Range</option>
            </select>
          </div>

          {filterType === "Monthly" && (
            <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {filterType === "Yearly" && (
            <div className="form-group">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {filterType === "Custom Range" && (
            <>
              <div className="form-group">
                <label>From</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>To</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
              </div>
            </>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
          <button type="button" className="primary-btn" onClick={handleApply}>Apply Filters</button>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from "react";
import { Modal, Button, Select } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs"; // Import dayjs instead of moment

const { Option } = Select;

interface TransparencyReportFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (month: number, year: number | null, donationType: string) => void; // Include donationType in submission
}

const TransparencyReportForm: React.FC<TransparencyReportFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const currentYear = dayjs().year(); // Get the current year

  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(currentYear); // Set current year as default
  const [selectedDonationType, setSelectedDonationType] = useState("cash"); // Default to "cash"

  // Handle month change
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  // Handle year change
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleFormSubmit = () => {
    if (selectedMonth && selectedYear && selectedDonationType) {
      onSubmit(selectedMonth, selectedYear, selectedDonationType); // Submit the selected month, year, and donation type
      onClose(); // Close modal after submit
    }
  };

  const startYear = currentYear - 59;  // 59 years ago (you can adjust this if needed)
  const endYear = currentYear;  // Current year

  // Handle donation type change
  const handleDonationTypeChange = (value: string) => {
    setSelectedDonationType(value);
  };

  return (
    <Modal
      title="Request Transparency Report"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={400}
    >
      <div className="modal-content">
        {/* Month Selection */}
        <div className="modal-field">
          <label htmlFor="month">Select Month</label>
          <Select
            id="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            style={{ width: "100%" }}
          >
            {Array.from({ length: 12 }, (_, index) => (
              <Option key={index} value={index + 1}>
                {dayjs().month(index).format("MMMM")} {/* Use dayjs() to get month names */}
              </Option>
            ))}
          </Select>
        </div>

        {/* Year Selection */}
        <div className="modal-field">
          <label htmlFor="year">Select Year</label>
          <Select
            id="year"
            value={selectedYear} // The default selected value is set to `selectedYear`
            onChange={handleYearChange}
            style={{ width: "100%" }}
          >
            {/* Display years from 59 years ago to current year */}
            {Array.from({ length: endYear - startYear + 1 }, (_, index) => (
              <Option key={startYear + index} value={startYear + index}>
                {startYear + index} {/* Display year options */}
              </Option>
            ))}
          </Select>
        </div>

        {/* Donation Type Selection */}
        <div className="modal-field">
          <label htmlFor="donation-type">Select Donation Type:</label>
          <Select
            id="donation-type"
            value={selectedDonationType} // The default selected value is set to `selectedDonationType`
            onChange={handleDonationTypeChange} // Handler for when the user selects a new donation type
            style={{ width: "100%" }}
          >
            <Option value="cash">Cash</Option>
            <Option value="inkind">In-kind</Option>
          </Select>
        </div>

        {/* Footer with Close and Submit buttons */}
        <div className="modal-button-container" style={{ marginTop: 20 }}>
          <Button onClick={onClose} icon={<CloseOutlined />} style={{ marginRight: 10 }}>
            Close
          </Button>
          <Button
            type="primary"
            disabled={!selectedMonth || !selectedYear || !selectedDonationType}  // Disable submit if any of these are missing
            onClick={handleFormSubmit}
          >
            Submit
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default TransparencyReportForm;
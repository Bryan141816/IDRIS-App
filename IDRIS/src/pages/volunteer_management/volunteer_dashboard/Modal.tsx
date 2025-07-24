import React, { useState, ChangeEvent } from 'react';
import { DatePicker, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import type { RangePickerProps } from 'antd/es/date-picker';
import Swal from 'sweetalert2';
import './css/Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  programTitle: string;
  description: string;
  dateRange: [Dayjs | null, Dayjs | null] | null;
  status: 'Ongoing' | 'Completed';
}

type RangeValue = [Dayjs | null, Dayjs | null] | null;

const { RangePicker } = DatePicker;

const showAlert = (): void => {
  Swal.fire({
    title: 'Created Successfully',
    icon: 'success',
    confirmButtonColor: '#749AB6',
    width: '380px',
    customClass: {
      popup: 'custom-height-modal',
      title: 'custom-swal-title',
      htmlContainer: 'custom-swal-text',
      confirmButton: 'custom-swal-button',
      icon: 'custom-swal-icon',
    },
  });
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    programTitle: '',
    description: '',
    dateRange: null,
    status: 'Ongoing',
  });

  if (!isOpen) return null;

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange: RangePickerProps['onChange'] = (dates) => {
    setFormData((prev) => ({
      ...prev,
      dateRange: dates as RangeValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // You can add validation here
    if (!formData.programTitle.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Please enter a program title',
        icon: 'error',
        confirmButtonColor: '#749AB6',
      });
      return;
    }

    // Process form data here
    console.log('Form submitted:', formData);

    showAlert();

    // Reset form after successful submission
    setFormData({
      programTitle: '',
      description: '',
      dateRange: null,
      status: 'Ongoing',
    });

    // Close modal after submission
    onClose();
  };

  const handleCancel = (): void => {
    // Reset form when canceling
    setFormData({
      programTitle: '',
      description: '',
      dateRange: null,
      status: 'Ongoing',
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Add Program</h3>
          <button
            onClick={handleCancel}
            className="close-btn"
            type="button"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="programTitle">Program Title</label>
            <input
              id="programTitle"
              name="programTitle"
              type="text"
              placeholder="Enter program title"
              value={formData.programTitle}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Enter description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
          <div className="form-group">
            <label>Date Range</label>
            <RangePicker
              style={{ width: '100%' }}
              value={formData.dateRange}
              onChange={handleDateChange}
              format="YYYY-MM-DD"
            />
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="save"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;

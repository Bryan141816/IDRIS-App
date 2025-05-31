import React, { useState } from 'react';
import { DatePicker, Space } from 'antd';
import Swal from 'sweetalert2';
import './css/Modal.css'; // Add custom styles for modal here

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const { RangePicker } = DatePicker;

const showAlert = () => {
    Swal.fire({
        title: 'Created Successfully',
        icon: 'success',
        confirmButtonColor: '#749AB6', // Change OK button color (e.g. blue)
        width: '380px', // Resize the modal
        customClass: {
            popup: 'custom-height-modal',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-text',
            confirmButton: 'custom-swal-button',
            icon: 'custom-swal-icon',
          },
      });

}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault(); // Prevent form from submitting and reloading
      showAlert();
    };

    return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Program</h3>
              <button onClick={onClose} className="close-btn">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Program Title</label>
                <input type="text" placeholder="Enter program title" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Enter description" />
              </div>
              <RangePicker style={{ width: '360px' }} />
              <div className="form-group">
                <label>Status</label>
                <select>
                  <option>Ongoing</option>
                  <option>Completed</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={onClose} className="cancel">Cancel</button>
                <button type="submit" className="save">Save</button>
              </div>
            </form>
          </div>
        </div>
      );
    };

export default Modal;

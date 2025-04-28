import React, { useState } from 'react';
import './css/VolunteerModal.css'; // Add custom styles for modal here

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const VolunteerModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Program</h3>
              <button onClick={onClose} className="close-btn">×</button>
            </div>
              <div className="modal-action">
                <button type="button" onClick={onClose} className="cancel-btn">As an Individual</button>
                <button type="submit" className="save-btn">As an Organization</button>
              </div>
          </div>
        </div>
      );
    };

export default VolunteerModal;

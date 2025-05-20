import React, { useState } from 'react';
import './css/VolunteerModal.css'; // Add custom styles for modal here
import { useNavigate } from 'react-router-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}


const VolunteerModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {

    const navigate = useNavigate();
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Program</h3>
              <button onClick={onClose} className="close-btn" >×</button>
            </div>
              <div className="modal-action">
                <button type="button" onClick={() => navigate('/volunteer_management/individual_form')} className="cancel-btn"><img src="/src/pages/volunteer_management/volunteer_dashboard/images/individual.png" className="button-icon"/>As an Individual</button>
                <button type="submit" className="save-btn" onClick={() => navigate('/volunteer_management/organization_form')}><img src="/src/pages/volunteer_management/volunteer_dashboard/images/group.png" className="org-icon"/>As an Organization</button>
              </div>
          </div>
        </div>
      );
    };

export default VolunteerModal;

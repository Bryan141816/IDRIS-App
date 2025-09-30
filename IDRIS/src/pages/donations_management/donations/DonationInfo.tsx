import React from 'react';
import { PhilippinePesoIcon, User } from 'lucide-react';
import './DonationInfo.scss';
import { formatCurrency } from '../helpers';

interface DonorDonationFormProps {
  donationKind: string;
  setDonationKind: (type: string) => void;
  donationFrequency: string;
  setDonationFrequency: (frequency: string) => void;
  formData: {
    amount: string;
    description: string;
  };
  handleInputChange: (field: string, value: string) => void;
  errors: any;
}

const DonorDonationForm: React.FC<DonorDonationFormProps> = ({
  donationKind,
  setDonationKind,
  donationFrequency,
  setDonationFrequency,
  formData,
  handleInputChange,
  errors
}) => {
  return (
    <div className="donor-form">
      <div className="donor-form__content">
        
        {/* Volunteer Info */}
        <div className="volunteer-info">
          <div className="volunteer-info__avatar">
            <User className="volunteer-info__icon" />
          </div>
          <div className="volunteer-info__details">
            <h3 className="volunteer-info__name">Volunteer name</h3>
            <p className="volunteer-info__role">Role Assigned (Volunteer ID)</p>
          </div>
        </div>

        {/* Donation Frequency */}
        <div className="form-group">
          <label className="form-group__label">Donation Frequency:</label>
          <div className="button-group">
            {['One-time', 'Monthly', 'Yearly'].map((freq) => (
              <button
                key={freq}
                onClick={() => setDonationFrequency(freq)}
                className={`button-group__item ${
                  donationFrequency === freq ? 'button-group__item--active-blue' : ''
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>

        {/* Donation Type */}
        <div className="form-group">
          <label className="form-group__label">Donation Type:</label>
          <div className="button-group">
            {['In-Kind', 'Cash', 'Volunteer Time'].map((kind) => (
              <button
                key={kind}
                onClick={() => setDonationKind(kind)}
                className={`button-group__item ${
                  donationKind === kind ? 'button-group__item--active-green' : ''
                }`}
              >
                {kind}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-group__label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`form-group__textarea ${errors.description ? 'input-error' : ''}`}
            rows={4}
            placeholder="Enter donation description..."
          />
          {errors.description && <p className="error-message">{errors.description}</p>}
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-group__label">Amount</label>
          <div className="input-with-icon">
            <PhilippinePesoIcon className="input-with-icon__icon" />
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className={`input-with-icon__input ${errors.amount ? 'input-error' : ''}`}
              placeholder="0.00"
            />
          </div>
          {errors.amount && <p className="error-message">{errors.amount}</p>}
        </div>
      </div>
    </div>
  );
};

export default DonorDonationForm;
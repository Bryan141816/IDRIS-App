import React, { useState } from 'react';
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

  const [activeAmount, setActiveAmount] = useState<string>("0");

  const [isCustom, setIsCustom] = useState<boolean>(true);

  const handleCustomAmount = (_iscustom: boolean, amount: string = "0") => {
    if (_iscustom) {
      handleInputChange('amount', '');
      setIsCustom(true);
    } else {
      handleInputChange('amount', amount)
      setIsCustom(false);
    }
    setActiveAmount(amount);
  }

  const formatAmount = (value: number | string) => {
    if (!value) return "";
    return Number(value).toLocaleString("en-US");
  };

  return (
    <div className="donor-form">
      <div className="donor-form__content">
        {/* Donation Frequency */}
        <div className="form-group">
          <label className="form-group__label">Donation Frequency:</label>
          <div className="button-group">
            {['One-time', 'Monthly', 'Yearly'].map((freq) => (
              <button
                key={freq}
                onClick={() => setDonationFrequency(freq)}
                className={`button-group__item ${donationFrequency === freq ? 'button-group__item--active-blue' : ''
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
                className={`button-group__item ${donationKind === kind ? 'button-group__item--active-green' : ''
                  }`}
              >
                {kind}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-group__label">Message:</label>
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
          <label className="form-group__label">Amount:</label>
          <div className='selectable-amount-container'>
            <button
              className={`selectable-amount-item ${activeAmount === '1000' ? "active" : ""}`}
              value={1000}
              onClick={(e) => handleCustomAmount(false, e.currentTarget.value)}
            >{formatCurrency(1000)}
            </button>

            <button
              className={`selectable-amount-item ${activeAmount === '5000' ? "active" : ""}`}
              value={5000}
              onClick={(e) => handleCustomAmount(false, e.currentTarget.value)}
            >{formatCurrency(5000)}
            </button>

            <button
              className={`selectable-amount-item ${activeAmount === '10000' ? "active" : ""}`}
              value={10000}
              onClick={(e) => handleCustomAmount(false, e.currentTarget.value)}
            >{formatCurrency(10000)}
            </button>

            <button
              className={`selectable-amount-item ${activeAmount === '0' ? "active" : ""}`}
              onClick={() => handleCustomAmount(true)}
            >Custom
            </button>
          </div>
          <div className="input-with-icon">
            <PhilippinePesoIcon className="input-with-icon__icon" />
            <input
              type="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={formatAmount(formData.amount)}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className={`input-with-icon__input ${errors.amount ? 'input-error' : ''}`}
              placeholder="0.00"
              disabled={!isCustom}
            />
          </div>
          {errors.amount && <p className="error-message">{errors.amount}</p>}
        </div>
      </div>
    </div>
  );
};

export default DonorDonationForm;
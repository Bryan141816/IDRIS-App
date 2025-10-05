import React, { useState, useEffect } from 'react';
import { PhilippinePesoIcon } from 'lucide-react';
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
  selectedItems: { [key: string]: number };
  setSelectedItems: (items: { [key: string]: number }) => void;
  otherDescription: string;
  setOtherDescription: (description: string) => void;
}

const DonorDonationForm: React.FC<DonorDonationFormProps> = ({
  donationKind,
  setDonationKind,
  donationFrequency,
  setDonationFrequency,
  formData,
  handleInputChange,
  errors,
  selectedItems,
  setSelectedItems,
  otherDescription,
  setOtherDescription,
}) => {
  const [activeAmount, setActiveAmount] = useState<string>("0");
  const [isCustom, setIsCustom] = useState<boolean>(true);
  const [showOtherInput, setShowOtherInput] = useState<boolean>(false);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const newSelectedItems = { ...selectedItems };

    if (checked) {
      newSelectedItems[name] = 1;
    } else {
      delete newSelectedItems[name];
    }
    setSelectedItems(newSelectedItems);

    if (name === 'Other') {
      setShowOtherInput(checked);
      if (!checked) {
        setOtherDescription('');
      }
    }
  };

  const handleQuantityChange = (item: string, quantity: string) => {
    const numQuantity = parseInt(quantity, 10);
    if (!isNaN(numQuantity) && numQuantity > 0) {
      setSelectedItems({
        ...selectedItems,
        [item]: numQuantity,
      });
    }
  };

  useEffect(() => {
    // Reset selections when switching away from in-kind
    if (donationKind !== 'In-Kind (Goods or Services)') {
      setSelectedItems({});
      setOtherDescription('');
      setShowOtherInput(false);
    }
  }, [donationKind, setSelectedItems, setOtherDescription]);

  const handleCustomAmount = (_iscustom: boolean, amount: string = "0") => {
    if (_iscustom) {
      handleInputChange('amount', '');
      setIsCustom(true);
    } else {
      handleInputChange('amount', amount);
      setIsCustom(false);
    }
    setActiveAmount(amount);
  };

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
            {['Cash', 'In-Kind (Goods or Services)'].map((kind) => (
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
        {donationKind === 'In-Kind (Goods or Services)' ? (
          <div className="form-group">
            <label className="form-group__label">What are you donating?</label>
            <small className="form-group__helper-text">
              Select all items that apply. Quantity
            </small>
            <div className="checkbox-group">
              {['Clothing', 'Food', 'School supplies', 'Electronics', 'Furniture', 'Volunteer time / Services', 'Other'].map((item) => (
                <div
                  key={item}
                  className={`checkbox-item ${item in selectedItems ? 'checked' : ''}`}
                >
                  <input
                    type="checkbox"
                    id={item}
                    name={item}
                    checked={item in selectedItems}
                    onChange={handleCheckboxChange}
                  />
                  <label htmlFor={item}>{item}</label>
                  {item in selectedItems && (
                    <input
                      type="number"
                      min="1"
                      value={selectedItems[item]}
                      onChange={(e) => handleQuantityChange(item, e.target.value)}
                      className="quantity-input"
                    />
                  )}
                </div>))}
            </div>
            {showOtherInput && (
              <div className="form-group">
                <label htmlFor="other-description" className="form-group__label">Other — describe</label>
                <input
                  type="text"
                  id="other-description"
                  value={otherDescription}
                  onChange={(e) => setOtherDescription(e.target.value)}
                  className={`form-group__input ${errors.otherDescription ? 'input-error' : ''}`}
                  placeholder="Describe other item(s) (this will be added to the description)"
                />
                <small className="form-group__helper-text">This text is appended to the selected items and sent as the donation description.</small>
                {errors.otherDescription && <p className="error-message">{errors.otherDescription}</p>}
              </div>
            )}
          </div>
        ) : (
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
        )}

        {/* Amount */}
        <div className="form-group">
          <label className="form-group__label">{donationKind === 'Cash' ? "Amount:" : "Estimated value:"}</label>
          {donationKind === 'Cash' && (
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
          )}
          <div className="input-with-icon">
            <PhilippinePesoIcon className="input-with-icon__icon" />
            <input
              type="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={formatAmount(formData.amount)}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              className={`input-with-icon__input ${errors.amount ? 'input-error' : ''}`}
              placeholder={donationKind === 'Cash' ? "Enter amount (PHP)" : "Enter estimated value (PHP)"}
              disabled={donationKind === 'Cash' && !isCustom}
            />
          </div>
          {donationKind === 'In-Kind (Goods or Services)' && (
            <small className="form-group__helper-text" style={{ fontStyle: "italic", marginTop: "5px", display: "block" }}>
              For in-kind donations, enter the estimated monetary value. This helps with reporting — actual items are described below.
            </small>
          )}
          {errors.amount && <p className="error-message">{errors.amount}</p>}
        </div>
      </div>
    </div>
  );
};

export default DonorDonationForm;
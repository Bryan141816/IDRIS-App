import React from 'react';
import { CreditCard } from 'lucide-react';
import './payment_method.scss';

interface PaymentFormProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  formData: {
    cardHolderName: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
  };
  handleInputChange: (field: string, value: string) => void;
  onCancel: () => void;
  onNext: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  paymentMethod,
  setPaymentMethod,
  formData,
  handleInputChange,
  onCancel,
  onNext
}) => {
  return (
    <div className="payment-form">
      <div className="payment-form__content">
        
        <h2 className="payment-form__title">Payment</h2>
        
        {/* Payment Method Selection */}
        <div className="payment-methods">
          <label className="payment-methods__label">Choose Payment Method</label>
          <div className="payment-methods__grid">
            
            {/* Visa */}
            <button
              onClick={() => setPaymentMethod('visa')}
              className={`payment-method ${
                paymentMethod === 'visa' ? 'payment-method--active' : ''
              }`}
            >
              <div className="payment-method__card payment-method__card--visa">
                VISA
              </div>
              <p className="payment-method__label">VISA</p>
            </button>

            {/* PayPal */}
            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`payment-method ${
                paymentMethod === 'paypal' ? 'payment-method--active' : ''
              }`}
            >
              <div className="payment-method__card payment-method__card--paypal">
                PayPal
              </div>
              <p className="payment-method__label">PayPal</p>
            </button>

            {/* GCash */}
            <button
              onClick={() => setPaymentMethod('gcash')}
              className={`payment-method ${
                paymentMethod === 'gcash' ? 'payment-method--active' : ''
              }`}
            >
              <div className="payment-method__card payment-method__card--gcash">
                <span>G</span>
              </div>
              <p className="payment-method__label">GCash</p>
            </button>

            {/* Add New */}
            <button
              onClick={() => setPaymentMethod('add')}
              className={`payment-method ${
                paymentMethod === 'add' ? 'payment-method--active' : ''
              }`}
            >
              <div className="payment-method__card payment-method__card--add">
                <span>+</span>
              </div>
              <p className="payment-method__label">Add</p>
            </button>
          </div>
        </div>

        {/* Credit Card Information */}
        {(paymentMethod === 'visa' || paymentMethod === 'add') && (
          <div className="credit-card-form">
            <h3 className="credit-card-form__title">Credit Card Information</h3>
            
            {/* Card Holder Name */}
            <div className="form-field">
              <label className="form-field__label">Card Holder Name</label>
              <input
                type="text"
                value={formData.cardHolderName}
                onChange={(e) => handleInputChange('cardHolderName', e.target.value)}
                className="form-field__input"
                placeholder="Enter card holder name"
              />
            </div>

            {/* Card Number */}
            <div className="form-field">
              <label className="form-field__label">Card Number</label>
              <div className="input-with-icon">
                <CreditCard className="input-with-icon__icon" />
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  className="input-with-icon__input"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
            </div>

            {/* Expiry Date and CVV */}
            <div className="form-field-group">
              <div className="form-field">
                <label className="form-field__label">Expiry Date</label>
                <input
                  type="text"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className="form-field__input"
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="form-field">
                <label className="form-field__label">CVV</label>
                <input
                  type="text"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  className="form-field__input"
                  placeholder="123"
                  maxLength={4}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            onClick={onCancel}
            className="action-buttons__button action-buttons__button--cancel"
          >
            ← Cancel
          </button>
          <button 
            onClick={onNext}
            className="action-buttons__button action-buttons__button--next"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );    
};

export default PaymentForm;
import React from 'react';
import { CreditCard } from 'lucide-react';
import './PaymentMethod.scss';

interface PaymentFormProps {
  donationKind: string;
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
  errors: any;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  donationKind,
  paymentMethod,
  setPaymentMethod,
  formData,
  handleInputChange,
  onCancel,
  onNext,
  errors
}) => {
  const isCashDonation = donationKind !== 'In-Kind (Goods or Services)';

  return (
    <div className="payment-form">
      { !isCashDonation &&
        <div className="payment-form__content">
          <h2 className="payment-form__title">{isCashDonation ? '' : 'Delivery Method'}</h2>

          {/* Payment Method Selection */}
          <div className="payment-methods">
            <label className="payment-methods__label">
              {isCashDonation ? '' : 'Choose Delivery Option'}
            </label>
            <div className="payment-methods__grid">
              {isCashDonation ? (
                <>
                  {/* PayMongo */}
                  <button
                    onClick={() => setPaymentMethod('paymongo')}
                    className={`payment-method ${paymentMethod === 'paymongo' ? 'payment-method--active' : ''
                      }`}
                  >
                    <div className="payment-method__card payment-method__card--paymongo">
                      <span>PayMongo</span>
                    </div>
                    <p className="payment-method__label">PayMongo</p>
                  </button>

                  {/* Visa */}
                  <button
                    onClick={() => setPaymentMethod('visa')}
                    className={`payment-method payment-method__hidden ${paymentMethod === 'visa' ? 'payment-method--active' : ''
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
                    className={`payment-method payment-method__hidden ${paymentMethod === 'paypal' ? 'payment-method--active' : ''
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
                    className={`payment-method payment-method__hidden ${paymentMethod === 'gcash' ? 'payment-method--active' : ''
                      }`}
                  >
                    <div className="payment-method__card payment-method__card--gcash">
                      <span>G</span>
                    </div>
                    <p className="payment-method__label">GCash</p>
                  </button>
                </>
              ) : (
                <>
                  {/* Delivery */}
                  <button
                    onClick={() => setPaymentMethod('delivery')}
                    className={`payment-method ${paymentMethod === 'delivery' ? 'payment-method--active' : ''}`}
                  >
                    <div className="payment-method__card payment-method__card--delivery">
                      <span>Delivery</span>
                    </div>
                    <p className="payment-method__label">Delivery</p>
                  </button>

                  {/* Pickup */}
                  <button
                    onClick={() => setPaymentMethod('pickup')}
                    className={`payment-method ${paymentMethod === 'pickup' ? 'payment-method--active' : ''}`}
                  >
                    <div className="payment-method__card payment-method__card--pickup">
                      <span>Pickup</span>
                    </div>
                    <p className="payment-method__label">Pickup</p>
                  </button>
                </>
              )}
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
                  className={`form-field__input ${errors.cardHolderName ? 'input-error' : ''}`}
                  placeholder="Enter card holder name"
                />
                {errors.cardHolderName && <p className="error-message">{errors.cardHolderName}</p>}
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
                    className={`input-with-icon__input ${errors.cardNumber ? 'input-error' : ''}`}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                {errors.cardNumber && <p className="error-message">{errors.cardNumber}</p>}
              </div>

              {/* Expiry Date and CVV */}
              <div className="form-field-group">
                <div className="form-field">
                  <label className="form-field__label">Expiry Date</label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    className={`form-field__input ${errors.expiryDate ? 'input-error' : ''}`}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                  {errors.expiryDate && <p className="error-message">{errors.expiryDate}</p>}
                </div>
                <div className="form-field">
                  <label className="form-field__label">CVV</label>
                  <input
                    type="text"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    className={`form-field__input ${errors.cvv ? 'input-error' : ''}`}
                    placeholder="123"
                    maxLength={4}
                  />
                  {errors.cvv && <p className="error-message">{errors.cvv}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      }
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
  );
};

export default PaymentForm;
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
  otherDescription: any[];
  setOtherDescription: (description: any[]) => void;
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
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const inKindCategories = {
    'Food Items': ['Canned Goods', 'Instant Noodles', 'Rice', 'Bottled Water', 'Coffee and Tea', 'Milk'],
    'Hygiene and Sanitation': ['Soap', 'Shampoo', 'Toothbrush', 'Toothpaste', 'Sanitary Napkins', 'Diapers'],
    'Shelter Materials': ['Tents', 'Tarpaulins', 'Blankets', 'Sleeping Mats', 'Ropes', 'Plywood'],
    'Medical Supplies': ['First Aid Kits', 'Bandages', 'Antiseptic Wipes', 'Pain Relievers', 'Vitamins', 'Face Masks'],
    'Clothing/Apparel': ['Shirts', 'Pants', 'Dresses', 'Jackets'],
    'Footwear': ['Slippers', 'Shoes'],
    'Blankets': ['Warm Blankets', 'Shelter']
  };

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
      if (checked) {
        setOtherDescription([{ id: 1, description: '', quantity: 1, isInitial: true }]);
      } else {
        setOtherDescription([]);
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

  const handleUpdateOtherItem = (id: number, field: string, value: string) => {
    const updatedItems = otherDescription.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    setOtherDescription(updatedItems);
  };

  const handleSaveOtherItem = (id: number) => {
    const updatedItems = otherDescription.map(item =>
      item.id === id ? { ...item, isInitial: false } : item
    );
    setOtherDescription(updatedItems);
  };

  const handleEditOtherItem = (id: number) => {
    const updatedItems = otherDescription.map(item =>
      item.id === id ? { ...item, isInitial: true } : item
    );
    setOtherDescription(updatedItems);
  };

  const handleAddOtherItem = () => {
    const newItem = {
      id: Date.now() + Math.random(),
      description: '',
      quantity: 1,
      isInitial: true,
    };
    setOtherDescription([...otherDescription, newItem]);
  };

  const handleDeleteOtherItem = (id: number) => {
    const updatedItems = otherDescription.filter(item => item.id !== id);
    setOtherDescription(updatedItems);
  };

  useEffect(() => {
    // Reset selections when switching away from in-kind
    if (donationKind !== 'In-Kind (Goods or Services)') {
      setSelectedItems({});
      setOtherDescription([]);
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
              Select all items that apply. ( Quantity indicates boxes or packs per item. )
            </small>
            <div className="in-kind-categories">
              {Object.entries(inKindCategories).map(([category, items]) => (
                <div key={category} className="category-group">
                  <button
                    type="button"
                    className="category-header"
                    onClick={() => setOpenCategory(openCategory === category ? null : category)}
                  >
                    {category}
                  </button>
                  {openCategory === category && (
                    <div className="checkbox-group">
                      {items.map((item) => {
                        const compositeKey = `${category}: ${item}`;
                        return (
                          <div
                            key={compositeKey}
                            className={`checkbox-item ${compositeKey in selectedItems ? 'checked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              id={compositeKey}
                              name={compositeKey}
                              checked={compositeKey in selectedItems}
                              onChange={handleCheckboxChange}
                            />
                            <label htmlFor={compositeKey}>{item}</label>
                            {compositeKey in selectedItems && (
                              <input
                                type="number"
                                min="1"
                                value={selectedItems[compositeKey]}
                                onChange={(e) => handleQuantityChange(compositeKey, e.target.value)}
                                className="quantity-input"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="Other"
                  name="Other"
                  checked={"Other" in selectedItems}
                  onChange={handleCheckboxChange}
                />
                <label htmlFor="Other">Other</label>
              </div>

            </div>
            {otherDescription.length > 0 && (
              <div className="other-items-container">
                {otherDescription.map((item) => (
                  <div key={item.id} className="other-item">
                    {item.isInitial ? (
                      <>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateOtherItem(item.id, 'description', e.target.value)}
                          className="form-group__input"
                          placeholder="Describe other item"
                        />
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateOtherItem(item.id, 'quantity', e.target.value)}
                          className="quantity-input"
                        />
                        <button onClick={() => handleSaveOtherItem(item.id)} className="button-small">Add</button>
                      </>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={item.description}
                          className="form-group__input"
                          disabled
                        />
                        <input
                          type="number"
                          value={item.quantity}
                          className="quantity-input"
                          disabled
                        />
                        <button onClick={() => handleEditOtherItem(item.id)} className="button-small">Edit</button>
                        <button onClick={() => handleDeleteOtherItem(item.id)} className="button-small button-danger">Delete</button>
                      </>
                    )}
                  </div>
                ))}
                <button onClick={handleAddOtherItem} className="button-link">Add Another Item</button>
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

        {donationKind === 'Cash' && (
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
                placeholder={"Enter amount (PHP)"}
                disabled={!isCustom}
              />
            </div>
            {errors.amount && <p className="error-message">{errors.amount}</p>}
          </div>
        )}
      </div>
    </div >
  );
};

export default DonorDonationForm;
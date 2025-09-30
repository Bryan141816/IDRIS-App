import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DonorDonationForm from './DonationInfo';
import PaymentForm from './PaymentMethod';
import './FundingDonation.scss';
import { getDonorIdByLoggedUser } from '../../../API_Handler/donations_donors_handler';
import { createDonation } from '../../../API_Handler/donations_donation_handler';
import Swal from 'sweetalert2';

const DonationPage: React.FC = () => {
  const location = useLocation();
  const fundingId = location.state?.funding_id;
  console.log(fundingId);

  const [donorId, setDonorId] = useState<number | null>(null);

  const [donationKind, setDonationKind] = useState('In-Kind');
  const [donationFrequency, setDonationFrequency] = useState('One-time');
  const [paymentMethod, setPaymentMethod] = useState('visa');

  const [donationFormData, setDonationFormData] = useState({
    amount: '',
    description: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const [errors, setErrors] = useState<any>({});

  const fetchAndSetUserId = async () => {
    try {
      const response = await getDonorIdByLoggedUser();
      setDonorId(response);
    } catch (error) {
      console.error('Failed to fetch donor id', error);
    }
  };

  useEffect(() => {
    fetchAndSetUserId();
  }, []);

  const handleDonationInputChange = (field: string, value: string) => {
    if (field === 'amount') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      if (/^\d*\.?\d*$/.test(numericValue)) {
        setDonationFormData(prev => ({ ...prev, [field]: numericValue }));
      }
    } else {
      setDonationFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePaymentInputChange = (field: string, value: string) => {
    setPaymentFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    // Handle cancel logic
  };

  const resetForms = () => {
    setDonationFormData({ amount: '', description: '' });
    setPaymentFormData({ cardHolderName: '', cardNumber: '', expiryDate: '', cvv: '' });
    setDonationFrequency('One-time');
    setDonationKind('In-Kind');
    setPaymentMethod('visa');
  };


  const validate = () => {
    const newErrors: any = {};
    if (!donationFormData.description) {
      newErrors.description = 'Description is required.';
    }
    if (!donationFormData.amount) {
      newErrors.amount = 'Amount is required for cash donations.';
    }

    if (paymentMethod === 'visa' || paymentMethod === 'add') {
      if (!paymentFormData.cardHolderName) newErrors.cardHolderName = 'Card holder name is required.';
      if (!paymentFormData.cardNumber) newErrors.cardNumber = 'Card number is required.';
      if (!paymentFormData.expiryDate) newErrors.expiryDate = 'Expiry date is required.';
      if (!paymentFormData.cvv) newErrors.cvv = 'CVV is required.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) {
      return;
    }
    // Handle next logic
    try {
      // build FormData to send donation
      const normalizeDonationFrequency = (type: string | null) => {
        if (type === "One-time") return "ONE_TIME";
        if (type === "Monthly") return "MONTHLY";
        if (type === "Quarterly") return "QUARTERLY";
        if (type === "Yearly") return "YEARLY";
        return "ONE_TIME"; // fallback
      };

      const normalizeDonationType = (type: string | null) => {
        if (type == "In-Kind") return "INKIND";
        if (type == "Cash") return "CASH";
        return type?.toUpperCase();
      }
      console.log(donationFrequency);
      console.log(normalizeDonationFrequency(donationFrequency));
      console.log("donorId:", donorId, typeof donorId);
      console.log("fundingId:", fundingId, typeof fundingId);
      console.log("Donation Type: ", normalizeDonationType(donationKind));

      const formData = {
        donor_id: donorId,
        frequency: normalizeDonationFrequency(donationFrequency),
        amount: donationFormData.amount ? parseFloat(donationFormData.amount) : null,
        description: donationFormData.description,
        funding_id: fundingId,
        donation_type: normalizeDonationType(donationKind),
        payment_method: paymentMethod
      }
      const donationResponse = await createDonation(formData);
      console.log("create donation response: ", donationResponse.data);
      Swal.fire({
        title: 'Success!',
        text: 'Your donation has been created successfully.',
        icon: 'success',
        confirmButtonText: 'OK'
      });
      await fetchAndSetUserId(); // refresh donor-related data
      resetForms();
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: 'Error!',
        text: 'There was an error submitting your donation. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }

  };

  return (
    <div className="donation-page">
      <div className="donation-page__container">
        <div className="donation-page__grid">
          {/* Left Side - Donor Info & Donation Details */}
          <div id='funding-info'></div>
          <div id='payment-form'>
            <DonorDonationForm
              donationKind={donationKind}
              setDonationKind={setDonationKind}
              donationFrequency={donationFrequency}
              setDonationFrequency={setDonationFrequency}
              formData={donationFormData}
              handleInputChange={handleDonationInputChange}
              errors={errors}
            />

            {/* Right Side - Payment Method */}
            <PaymentForm
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              formData={paymentFormData}
              handleInputChange={handlePaymentInputChange}
              onCancel={handleCancel}
              onNext={handleNext}
              errors={errors}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
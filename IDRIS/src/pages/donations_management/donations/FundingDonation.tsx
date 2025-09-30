import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DonorDonationForm from './DonationInfo';
import PaymentForm from './PaymentMethod';
import './fundingDonation.scss';
import { getDonorIdByLoggedUser } from '../../../API_Handler/donations_donors_handler';
import { createDonation } from '../../../API_Handler/donations_donation_handler';
import { getFundingProposalsById } from '../../../API_Handler/donations_funding_proposals_handler';
import { formatCurrency, computePercentage } from '../helpers';
import Swal from 'sweetalert2';

const backendUrl = "http://127.0.0.1:8000";

const DonationPage: React.FC = () => {
  const location = useLocation();
  const fundingId = location.state?.funding_id;
  const [fundingProposal, setFundingProposal] = useState<any>(null);

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
    if (fundingId) {
      const fetchProposal = async () => {
        try {
          const proposal = await getFundingProposalsById(fundingId);
          console.log(proposal);
          setFundingProposal(proposal);
        } catch (error) {
          console.error('Failed to fetch funding proposal', error);
        }
      };
      fetchProposal();
    }
  }, [fundingId]);

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
        if (type === "Quarterly") return "QUARTERLY";2
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
          <div id='funding-info'>
            {fundingProposal && (
              <div className="funding-content">
                <div className="funding-image-container">
                  <img src={`${backendUrl}/${fundingProposal.image}`}
                    alt={`Image of ${fundingProposal.title}`}
                    className="funding-image" />
                </div>

                <h2 className="funding-title">{fundingProposal.title}</h2>
                <p className="funding-description">{fundingProposal.description}</p>

                <div className="progress-container">
                  <div className="progress-info">
                    <span className="progress-label">Raised: {formatCurrency(fundingProposal.total_donated)}</span>
                    <span className="progress-percentage">{computePercentage(
                      Number(fundingProposal.total_donated),
                      Number(fundingProposal.budget_required)
                    )}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                </div>

                <div className="impact-statement">
                  <p className="impact-text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                    Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                    Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                </div>
              </div>
            )}
          </div>
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
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import DonorDonationForm from './DonationInfo';
import PaymentForm from './PaymentMethod';
import './fundingDonation.scss';
import { normalizeDonationFrequency, normalizeDonationType } from '../helpers';
import MessagePic from '../../../media/Message_from_the_heart.png';
import { getDonorIdByLoggedUser } from '../../../API_Handler/donations_donors_handler';
import {
  createDonation,
  createPayMongoCheckout,
  cancelDonation,
  completeDonation,
  failDonation
} from '../../../API_Handler/donations_donation_handler';
import { getFundingProposalsById } from '../../../API_Handler/donations_funding_proposals_handler';
import { formatCurrency, computePercentage } from '../helpers';
import DonationStatus from './DonationStatus';

import Swal from 'sweetalert2';

const backendUrl = "http://127.0.0.1:8000";

const DonationPage: React.FC = () => {
  const location = useLocation();
  const fundingId = location.state?.funding_id;
  const [fundingProposal, setFundingProposal] = useState<any>(null);
  const [isDonationPending, setIsDonationPending] = useState<boolean>(false);
  const [donorId, setDonorId] = useState<number | null>(null);
  const [donationId, setDonationId] = useState<string>(); // Track donation ID
  const [showDonationStatus, setShowDonationStatus] = useState<boolean>(false); // New state to control when to show DonationStatus

  const [donationKind, setDonationKind] = useState('In-Kind');
  const [donationFrequency, setDonationFrequency] = useState('One-time');
  const [paymentMethod, setPaymentMethod] = useState('paymongo');

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
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [otherDescription, setOtherDescription] = useState('');

  const fetchAndSetUserId = async () => {
    try {
      const response = await getDonorIdByLoggedUser();
      setDonorId(response);
    } catch (error) {
      console.error('Failed to fetch donor id', error);
    }
  };

  const handleDonationInputChange = useCallback((field: string, value: string) => {
    if (field === 'amount') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      if (/^\d*\.?\d*$/.test(numericValue)) {
        setDonationFormData(prev => ({ ...prev, [field]: numericValue }));
      }
    } else {
      setDonationFormData(prev => ({ ...prev, [field]: value }));
    }
  }, []);

  useEffect(() => {
    if (donationKind === 'In-Kind (Goods or Services)') {
      const description = Object.entries(selectedItems)
        .map(([item, quantity]) => {
          if (item === 'Other') {
            return otherDescription ? `${quantity}x Other: ${otherDescription}` : `${quantity}x Other`;
          }
          return `${quantity}x ${item}`;
        })
        .join(', ');
      handleDonationInputChange('description', description);
    }
  }, [selectedItems, otherDescription, donationKind, handleDonationInputChange]);

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
    setPaymentMethod('paymongo');
    setSelectedItems({});
    setOtherDescription('');
  };

  const validate = () => {
    const newErrors: any = {};
    if (donationKind === 'In-Kind (Goods or Services)') {
      if (Object.keys(selectedItems).length === 0) {
        newErrors.description = 'Please select at least one item.';
      }
      if ('Other' in selectedItems && !otherDescription) {
        newErrors.otherDescription = 'Please describe the other item(s).';
      }
    } else {
      if (!donationFormData.description) {
        newErrors.description = 'Description is required.';
      }
    }

    if (!donationFormData.amount) {
      newErrors.amount = 'Amount / Estimated value is required.';
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

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handlePayMongoCheckout = async () => {
    // Guard: prevent double-submission / double-click
    if ((window as any).__paymongoCheckoutSubmitting) return;
    (window as any).__paymongoCheckoutSubmitting = true;
    setIsSubmitting?.(true);

    // Build donation payload
    const formData = {
      donor_id: donorId,
      frequency: normalizeDonationFrequency(donationFrequency),
      amount: donationFormData.amount ? parseFloat(donationFormData.amount) : null,
      description: donationFormData.description,
      funding_id: fundingId,
      donation_type: normalizeDonationType(donationKind),
      payment_method: paymentMethod,
    };

    let checkoutWindow: Window | null = null; // Use a single variable for the checkout window
    let createdDonationId: string | null = null;

    try {
      // 1. Create donation record first
      console.log('Creating donation record', formData);
      const donationResponse = await createDonation(formData);
      if (!donationResponse || !donationResponse.data) {
        throw new Error('Failed to create donation record (no response)');
      }

      createdDonationId = donationResponse.data.donation_id ?? null;
      console.log('Donation created (id):', createdDonationId);
      if (createdDonationId) setDonationId?.(createdDonationId);

      // Prepare payload for PayMongo
      const paymongoPayload = {
        amount: donationFormData.amount ? parseFloat(donationFormData.amount) : 0,
        description: donationFormData.description ?? '',
      };

      // Retry helper with exponential backoff (same as before)
      const createPayMongoCheckoutWithRetry = async (payload: any, maxRetries = 4, initialDelayMs = 1000) => {
        let lastError: any = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          console.log(`PayMongo attempt ${attempt}/${maxRetries}`);
          try {
            const resp = await createPayMongoCheckout(payload);
            console.log('PayMongo response:', resp?.status, resp?.data);
            const checkoutUrl = resp?.data?.data?.attributes?.checkout_url;
            if (checkoutUrl) return resp;
            // no checkout_url => treat as failure to trigger retry
            lastError = new Error('No checkout_url in PayMongo response');
          } catch (err) {
            console.log('createPayMongoCheckout error:', err);
            lastError = err;
          }

          if (attempt < maxRetries) {
            const delay = initialDelayMs * Math.pow(2, attempt - 1); // 1s, 2s, 4s...
            console.log(`Waiting ${delay}ms before next attempt`);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
        throw lastError;
      };

      // Call PayMongo with retry
      const pmResponse = await createPayMongoCheckoutWithRetry(paymongoPayload, 4, 1000);
      if (!pmResponse || !pmResponse.data) {
        throw new Error('No response from PayMongo');
      }

      const checkoutUrl = pmResponse.data?.data?.attributes?.checkout_url;
      const sessionId = pmResponse.data?.data?.id;
      if (!checkoutUrl || !sessionId) {
        throw new Error('Missing checkoutUrl or sessionId in PayMongo response');
      }

      // Persist session id for status checks (optional)
      try {
        localStorage.setItem('paymongo_session_id', sessionId);
      } catch (e) {
        console.warn('Could not set localStorage paymongo_session_id', e);
      }

      // 2. Update UI state *before* opening window
      setShowDonationStatus?.(true);
      setIsDonationPending?.(true);

      // 3. Attempt to open the checkout window *only once*
      //    Use the URL directly, do not rely on a pre-opened placeholder that needs navigation.
      checkoutWindow = window.open(checkoutUrl, '_blank', 'noopener,noreferrer,width=900,height=700');

      if (!checkoutWindow) {
        // Browser blocked it — inform user to enable popups
        console.warn('Checkout window was blocked by the browser.');
        // IMPORTANT: Mark donation as failed here as checkout cannot proceed.
        if (createdDonationId) {
          try {
            await failDonation(createdDonationId); // Use createdDonationId, not stale state
          } catch (failErr) {
            console.error('Failed to mark donation as failed after popup block:', failErr);
          }
        }
        throw new Error('Your browser blocked the checkout window. Please allow popups for this site and try again.');
      } else {
        console.log('Checkout window opened successfully.');
        try {
          checkoutWindow.focus(); // Attempt to bring it to front
        } catch (e) {
          console.warn('Could not focus checkout window:', e);
          // Focus failure usually isn't critical, continue.
        }
      }

    } catch (err) {
      console.error('handlePayMongoCheckout error:', err);

      // Attempt to mark donation as failed using the ID we captured *during this specific attempt*
      const idToFail = createdDonationId ?? donationId ?? null;
      if (idToFail) {
        try {
          await failDonation(idToFail);
          console.log(`Donation ${idToFail} marked as failed due to checkout error.`);
        } catch (failErr) {
          console.error('Failed to mark donation as failed:', failErr);
        }
      }

      // Show error message to the user
      Swal.fire({
        icon: 'error',
        title: 'Checkout Error',
        text: (err as Error)?.message ?? 'Something went wrong during checkout.',
      });

      // Close the checkout window if it was opened but an error occurred *after* opening
      // This handles scenarios where PayMongo fails *after* the window is opened.
      // In the popup blocked case, checkoutWindow is null, so close() is safe (no-op).
      try {
        if (checkoutWindow && !checkoutWindow.closed) {
          checkoutWindow.close();
        }
      } catch (e) {
        console.warn('Error closing checkout window:', e);
      }

      // Reset UI state to allow retry
      setShowDonationStatus?.(false);
      setIsDonationPending?.(false);

    } finally {
      // Release global guard and local submitting flag
      (window as any).__paymongoCheckoutSubmitting = false;
      setIsSubmitting?.(false);
    }
  }; // End of handlePayMongoCheckout



  const handleNext = async () => {
    if (!validate()) {
      return;
    }

    if (paymentMethod === 'paymongo') {
      handlePayMongoCheckout();
    } else {
      handleOtherPayments();
    }
  }

  const handleOtherPayments = async () => {
    try {
      // build FormData to send donation
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

      // If donation was created successfully, show success message
      if (donationResponse && donationResponse.data) {
        Swal.fire({
          title: 'Success!',
          text: 'Your donation has been created successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        await fetchAndSetUserId(); // refresh donor-related data
        resetForms();
      } else {
        throw new Error('Donation creation failed');
      }
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
      {showDonationStatus && <DonationStatus _donationId={donationId} />}
      <div className="donation-page__container">
        <div className="donation-page__grid">
          {/* Left Side - Donor Info & Donation Details */}
          <div id='funding-info'>
            {fundingProposal && (
              <>
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
                </div>
                <div className="funding-content">
                  <h1>Message from us</h1>
                  <div className="donor-message">
                    <p className="impact-text">
                      "Your contribution will directly support our mission and make a tangible impact. Join us in creating a better future for those in need. Every donation counts."                  </p>
                  </div>

                  <div className="donor-message">
                    <img src={MessagePic} alt="Message from the heart" />
                    <h3>A Message from the Heart</h3>
                    <p>"Your generosity empowers us to make a real difference. Every contribution, no matter the size, brings us closer to our goal and helps build a stronger community. Thank you for being a beacon of hope."</p>
                  </div>
                </div>
              </>
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
              selectedItems={selectedItems}
              setSelectedItems={setSelectedItems}
              otherDescription={otherDescription}
              setOtherDescription={setOtherDescription}
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
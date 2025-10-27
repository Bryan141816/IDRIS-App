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
    description: '',
    category: ''
  });

  const [paymentFormData, setPaymentFormData] = useState({
    cardHolderName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const [errors, setErrors] = useState<any>({});
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});
  const [otherDescription, setOtherDescription] = useState<any[]>([]);

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
      const standardItemsDescription = Object.entries(selectedItems)
        .filter(([compositeKey]) => compositeKey !== 'Other')
        .map(([compositeKey, quantity]) => {
          const [, item] = compositeKey.split(': ');
          return `${quantity}x ${item}`;
        })
        .join(', ');

      const otherItemsDescription = otherDescription
        .map(item => `${item.quantity}x ${item.description}`)
        .join(', ');

      const description = [standardItemsDescription, otherItemsDescription]
        .filter(Boolean)
        .join(', ');

      const categories = [
        ...new Set(
          Object.keys(selectedItems)
            .map(key => key.split(': ')[0])
            .filter(cat => cat !== 'Other')
        )
      ].join(', ');

      handleDonationInputChange('description', description);
      handleDonationInputChange('category', categories);
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

  useEffect(() => {
    if (donationKind === 'In-Kind (Goods or Services)') {
      setPaymentMethod('delivery'); // Default to delivery for in-kind
    } else {
      setPaymentMethod('paymongo'); // Default to paymongo for cash
    }
  }, [donationKind]);

  const handlePaymentInputChange = (field: string, value: string) => {
    setPaymentFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    // Handle cancel logic
  };

  const resetForms = () => {
    setDonationFormData({ amount: '', description: '', category: '' });
    setPaymentFormData({ cardHolderName: '', cardNumber: '', expiryDate: '', cvv: '' });
    setDonationFrequency('One-time');
    setDonationKind('In-Kind');
    setPaymentMethod('paymongo');
    setSelectedItems({});
    setOtherDescription([]);
  };

  const validate = () => {
    const newErrors: any = {};
    if (donationKind === 'In-Kind (Goods or Services)') {
      if (Object.keys(selectedItems).length === 0) {
        newErrors.description = 'Please select at least one item.';
      }
      if ('Other' in selectedItems && otherDescription.some(item => !item.description)) {
        newErrors.otherDescription = 'Please describe all other items.';
      }
    } else {
      if (!donationFormData.description) {
        newErrors.description = 'Description is required.';
      }
    }

    if (donationKind !== 'In-Kind (Goods or Services)' && !donationFormData.amount) {
      newErrors.amount = 'Amount is required.';
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
    if ((window as any).__paymongoCheckoutSubmitting) return;
    (window as any).__paymongoCheckoutSubmitting = true;
    setIsSubmitting(true);

    Swal.fire({
      title: 'Creating Checkout Request',
      text: 'Please wait while we prepare your secure checkout...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const formData = {
      donor_id: donorId,
      frequency: normalizeDonationFrequency(donationFrequency),
      amount: donationFormData.amount ? parseFloat(donationFormData.amount) : null,
      description: donationFormData.description,
      funding_id: fundingId,
      donation_type: normalizeDonationType(donationKind),
      payment_method: paymentMethod,
      category: donationFormData.category,
    };

    let checkoutWindow: Window | null = null;
    let createdDonationId: string | null = null;

    try {
      const donationResponse = await createDonation(formData);
      if (!donationResponse || !donationResponse.data) {
        throw new Error('Failed to create donation record (no response)');
      }

      createdDonationId = donationResponse.data.donation_id ?? null;
      if (createdDonationId) setDonationId(createdDonationId);

      const paymongoPayload = {
        amount: donationFormData.amount ? parseFloat(donationFormData.amount) : 0,
        description: donationFormData.description ?? '',
      };

      const createPayMongoCheckoutWithRetry = async (payload: any, maxRetries = 4, initialDelayMs = 1000) => {
        let lastError: any = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            if (attempt > 1) {
              Swal.update({
                text: `Connection unstable. Retrying... (Attempt ${attempt} of ${maxRetries})`,
              });
            }
            const resp = await createPayMongoCheckout(payload);
            const checkoutUrl = resp?.data?.data?.attributes?.checkout_url;
            if (checkoutUrl) {
              Swal.close(); // Close loading Swal on success
              return resp;
            }
            lastError = new Error('No checkout_url in PayMongo response');
          } catch (err) {
            lastError = err;
          }

          if (attempt < maxRetries) {
            const delay = initialDelayMs * Math.pow(2, attempt - 1);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
        throw lastError;
      };

      const pmResponse = await createPayMongoCheckoutWithRetry(paymongoPayload, 4, 1000);

      if (!pmResponse || !pmResponse.data) {
        throw new Error('No response from PayMongo after retries.');
      }

      const checkoutUrl = pmResponse.data?.data?.attributes?.checkout_url;
      const sessionId = pmResponse.data?.data?.id;
      if (!checkoutUrl || !sessionId) {
        throw new Error('Missing checkoutUrl or sessionId in PayMongo response.');
      }

      localStorage.setItem('paymongo_session_id', sessionId);
      setShowDonationStatus(true);
      setIsDonationPending(true);

      checkoutWindow = window.open(checkoutUrl, '_blank', 'noopener,noreferrer,width=900,height=700');

      // if (!checkoutWindow) {
      //   if (createdDonationId) {
      //     await failDonation(createdDonationId);
      //   }
      //   throw new Error('Your browser blocked the checkout window. Please allow popups for this site and try again.');
      // } else {
      //   checkoutWindow.focus();
      // }

    } catch (err) {
      const idToFail = createdDonationId ?? donationId ?? null;
      if (idToFail) {
        try {
          await failDonation(idToFail);
        } catch (failErr) {
          console.error('Failed to mark donation as failed:', failErr);
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'Checkout Error',
        text: (err as Error)?.message ?? 'A connection problem occurred. Please try again.',
      });

      if (checkoutWindow && !checkoutWindow.closed) {
        checkoutWindow.close();
      }

      setShowDonationStatus(false);
      setIsDonationPending(false);

    } finally {
      (window as any).__paymongoCheckoutSubmitting = false;
      setIsSubmitting(false);
    }
  };



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
        payment_method: paymentMethod,
        category: donationFormData.category,
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
                      <span className="progress-label">
                        Raised: {formatCurrency(fundingProposal.total_donated)}
                      </span>
                      <span className="progress-percentage">
                        {computePercentage(
                          Number(fundingProposal.total_donated),
                          Number(fundingProposal.budget_required)
                        )}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${computePercentage(
                            Number(fundingProposal.total_donated),
                            Number(fundingProposal.budget_required)
                          )}%`,
                        }}
                      ></div>
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
              donationKind={donationKind}
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
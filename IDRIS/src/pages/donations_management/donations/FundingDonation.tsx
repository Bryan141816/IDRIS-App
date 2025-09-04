import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DonorDonationForm from './DonationInfo';
import PaymentForm from './PaymentMethod';
import './FundingDonation.scss';
import { getDonorIdByLoggedUser } from '../../../API_Handler/donations_donors_handler';
import { createOneTimeDonation } from '../../../API_Handler/donations_donation_handler';

const DonationPage: React.FC = () => {
  const location = useLocation();
  const fundingId = location.state?.funding_id;

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

  useEffect(( ) => {
    const fetchUserid = async() => {
      try{
        const response = await getDonorIdByLoggedUser();
        setDonorId(response);
        console.log("Donor id: ", response);
        console.log("Proposal id: ", fundingId);
      } catch(error){
        console.error(error);
      }
    }

    fetchUserid();
  }, []);

  const handleDonationInputChange = (field: string, value: string) => {
    setDonationFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePaymentInputChange = (field: string, value: string) => {
    setPaymentFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    // Handle cancel logic
  };

  const handleNext = async () => {
    // Handle next logic
    try{      
        // build FormData to send donation
        const normalizeDonationFrequency = (type: string | null) => {
          if (type === "One-time") return "ONE_TIME";
          if (type === "Recurring") return "RECURRING";
          return "ONE_TIME";
        };

        const normalizeDonationType = (type: string | null) => {
          if ( type == "In-Kind" ) return "INKIND";
          if ( type == "Cash" ) return "CASH";
          return type?.toUpperCase();
        }

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
        console.log("Form Datas:");
        console.log(formData);
        const donationResponse = await createOneTimeDonation(formData);
        console.log("create donation response: ", donationResponse.data);
    } catch (err) {
      console.error(err);
      // setError("Failed to fetch profile.");
    }

  };

  return (
    <div className="donation-page">
      <div className="donation-page__container">
        <div className="donation-page__grid">
          
          {/* Left Side - Donor Info & Donation Details */}
          <DonorDonationForm
            donationKind={donationKind}
            setDonationKind={setDonationKind}
            donationFrequency={donationFrequency}
            setDonationFrequency={setDonationFrequency}
            formData={donationFormData}
            handleInputChange={handleDonationInputChange}
          />

          {/* Right Side - Payment Method */}
          <PaymentForm
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            formData={paymentFormData}
            handleInputChange={handlePaymentInputChange}
            onCancel={handleCancel}
            onNext={handleNext}
          />
        </div>
      </div>
    </div>
  );
};

export default DonationPage;
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getDonationById } from '../../../API_Handler/donations_donation_handler';
import { getDonorDetailsById } from '../../../API_Handler/donations_donors_handler';
import { DonationRow } from './DonorDashboard';
import './DonationReceipt.scss';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import logo from '../../../media/RAFI_Shield.png';

interface DonorDetails {
  donor_name: string;
  email: string;
}

const DonationReceipt: React.FC = () => {
  const { donationId } = useParams<{ donationId: string }>();
  const [donation, setDonation] = useState<DonationRow | null>(null);
  const [donor, setDonor] = useState<DonorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (donationId) {
      getDonationById(donationId)
        .then(donationData => {
          setDonation(donationData);
          return getDonorDetailsById(donationData.donor_id);
        })
        .then(donorData => {
          setDonor(donorData);
          console.log(donation);
          console.log(donorData);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to fetch donation details.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [donationId]);

  const handleDownloadPdf = () => {
    const input = receiptRef.current;
    if (input) {
      html2canvas(input, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`donation-receipt-${donationId}.pdf`);
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!donation || !donor) {
    return <div>Donation not found.</div>;
  }

  return (
    <div className="receipt-page">
      <div className="receipt-container" ref={receiptRef}>
        <div className="receipt-header">
          <img src={logo} alt="Logo" className="receipt-logo" />
          <h1>Donation Receipt</h1>
        </div>
        <div className="receipt-body">
          <div className="receipt-section">
            <h2>Donation Details</h2>
            <p><strong>Donation ID:</strong> {donation.donation_id}</p>
            <p><strong>Donation Date:</strong> {new Date(donation.donation_date).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {donation.status}</p>
            <p><strong>Type:</strong> {donation.donation_type}</p>
          </div>
          <div className="receipt-section">
            <h2>Donor Information</h2>
            <p><strong>Name:</strong> {donor.donor_name}</p>
            <p><strong>Email:</strong> {donor.email}</p>
          </div>
          <div className="receipt-section">
            <h2>Amount</h2>
            <p className="amount">
              {donation.donation_type === 'CASH'
                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(Number(donation.cash?.amount))
                : `(In-Kind) ${donation.inkind?.item_description}`}
            </p>
            {donation.donation_type === 'INKIND' && (
              <p><strong>Estimated Value:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'PHP' }).format(Number(donation.inkind?.estimated_value))}</p>
            )}
          </div>
        </div>
        <div className="receipt-footer">
          <p>Thank you for your generous donation!</p>
        </div>
      </div>
      <button onClick={handleDownloadPdf} className="download-button">
        Download as PDF
      </button>
    </div>
  );
};

export default DonationReceipt;
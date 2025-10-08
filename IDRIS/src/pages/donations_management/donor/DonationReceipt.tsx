import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getDonationReceipt } from '../../../API_Handler/donation_receipt_handler';
import logo from '../../../media/RAFI_Shield.png';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './DonationReceipt.scss';

interface DonorDetails {
  first_name: string;
  last_name: string;
  email: string;
}

interface DonationDetails {
  donation_id: number;
  amount: number;
  donation_type: string;
  status: string;
  created_at: string;
}

const DonationReceipt: React.FC = () => {
  const { donationId } = useParams<{ donationId: string }>();
  const [donation, setDonation] = useState<DonationDetails | null>(null);
  const [donor, setDonor] = useState<DonorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (donationId) {
      getDonationReceipt(donationId)
        .then(receiptData => {
          setDonation(receiptData.donation);
          setDonor(receiptData.donor);
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
      html2canvas(input, { scale: 2, useCORS: true }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = imgHeight / imgWidth;
        const pdfHeight = pdfWidth * ratio;

        // If content is taller than A4, split into pages (optional enhancement)
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`donation-receipt-${donationId}.pdf`);
      });
    }
  };

  if (loading) {
    return <div className="receipt-page">Loading...</div>;
  }

  if (error) {
    return <div className="receipt-page">{error}</div>;
  }

  if (!donation || !donor) {
    return <div className="receipt-page">Donation not found.</div>;
  }

  const formattedDate = new Date(donation.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(donation.amount);

  return (
    <div className="receipt-page">
      <div className="receipt-container" ref={receiptRef}>
        <div className="receipt-header">
          <div className="logo-section">
            <img src={logo} alt="RAFI Foundation Logo" className="receipt-logo" />
          </div>
          <div className="org-info">
            <h1>Official Donation Receipt</h1>
            <p className="org-name">RAFI Foundation, Inc.</p>
            <p className="org-address">123 Charity Avenue, Makati City, Philippines</p>
            <p className="org-contact">contact@rafi.org.ph | +63 2 1234 5678</p>
          </div>
        </div>

        <div className="receipt-body">
          <div className="receipt-section">
            <h2>Donor Information</h2>
            <p><strong>Name:</strong> {`${donor.first_name} ${donor.last_name}`}</p>
            <p><strong>Email:</strong> {donor.email}</p>
          </div>

          <div className="receipt-section">
            <h2>Donation Details</h2>
            <p><strong>Receipt No.:</strong> RAFI-DR-{String(donation.donation_id).padStart(6, '0')}</p>
            <p><strong>Date:</strong> {formattedDate}</p>
            <p><strong>Type:</strong> {donation.donation_type}</p>
            <p><strong>Status:</strong> <span className={`status ${donation.status.toLowerCase()}`}>{donation.status}</span></p>
          </div>

          <div className="amount-section">
            <p className="amount-label">Donation Amount</p>
            <p className="amount-value">{formattedAmount}</p>
          </div>
        </div>

        <div className="receipt-footer">
          <p>
            This serves as an official acknowledgment of your tax-deductible contribution to RAFI Foundation, Inc., 
            a registered non-stock, non-profit organization in the Philippines.
          </p>
          <p className="thank-you">Thank you for your generosity and support!</p>
        </div>
      </div>

      {/* Button outside receipt-container so it doesn't appear in PDF */}
      <button onClick={handleDownloadPdf} className="download-button">
        Download as PDF
      </button>
    </div>
  );
};

export default DonationReceipt;
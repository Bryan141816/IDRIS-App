import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getFinanceReceipt } from '../../../API_Handler/finance_management_handler';
import logo from '../../../media/RAFI_Shield.png';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './FinanceReceipt.scss';

interface DonorDetails {
  first_name: string;
  last_name: string;
  email: string;
}
interface FinanceRecordDetails {
  finance_id: number;
  amount: number;
  inflow_source: string;
  date: string;
}

const FinanceReceipt: React.FC = () => {
  const { financeId } = useParams<{ financeId: string }>();
  const [financeRecord, setFinanceRecord] = useState<FinanceRecordDetails | null>(null);
  const [donor, setDonor] = useState<DonorDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (financeId) {
      getFinanceReceipt(financeId)
        .then(receiptData => {
          setFinanceRecord(receiptData.finance_record);
          setDonor(receiptData.donor);
        })
        .catch(err => {
          console.error(err);
          setError('Failed to fetch finance details.');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [financeId]);

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
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`finance-receipt-${financeId}.pdf`);
      });
    }
  };

  if (loading) return <div className="receipt-page">Loading...</div>;
  if (error) return <div className="receipt-page">{error}</div>;
  if (!financeRecord || !donor) return <div className="receipt-page">Finance record not found.</div>;

  const formattedDate = new Date(financeRecord.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const formattedAmount = new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
  }).format(financeRecord.amount);

  return (
    <div className="receipt-page">
      <div className="receipt-container" ref={receiptRef}>
        <div className="receipt-header">
          <div className="logo-section">
            <img src={logo} alt="RAFI Foundation Logo" className="receipt-logo" />
          </div>
          <div className="org-info">
            <h1>Official Finance Receipt</h1>
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
            <h2>Finance Details</h2>
            <p><strong>Receipt No.:</strong> RAFI-FR-{String(financeRecord.finance_id).padStart(6, '0')}</p>
            <p><strong>Date:</strong> {formattedDate}</p>
            <p><strong>Source:</strong> {financeRecord.inflow_source}</p>
          </div>
          <div className="amount-section">
            <p className="amount-label">Amount</p>
            <p className="amount-value">{formattedAmount}</p>
          </div>
        </div>
        <div className="receipt-footer">
          <p>
            This serves as an official acknowledgment of your contribution to RAFI Foundation, Inc.,
            a registered non-stock, non-profit organization in the Philippines.
          </p>
          <p className="thank-you">Thank you for your generosity and support!</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="download-inside"
          type="button"
        >
          Download as PDF
        </button>
      </div>
    </div>
  );
};

export default FinanceReceipt;

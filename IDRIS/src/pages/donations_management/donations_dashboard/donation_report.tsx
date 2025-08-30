import React from 'react';
import styles from './donation_report.module.scss'
import { useRef } from 'react';
import RAFI_Shield from '../../../../src/media/RAFI_Shield.png'

export default function DonationReport({
  donations = [],
  companyInfo = {
    name: 'RAFI Inc.',
    tagline: 'The Ramon Aboitiz Foundation Inc.',
    logo: 'DC',
    address: {
      street: '35 Eduardo Aboitiz St',
      city: 'Cebu City',
      state: 'Philippines',
      zip: '6000'
    },
    contact: {
      phone: '(09) 000-000-0000',
      email: 'sampleemail@gmail.com'
    }
  },
  reportTitle = 'Donation Report',
  currency = 'USD'
}) {
  // Default sample data if no donations provided
  const defaultDonations = [
    {
      id: 75613975,
      amount: 100,
      donation_date: '2025-08-29',
      donation_type: 'CASH',
      donor_name: 'DonorMe',
      status: 'COMPLETED'
    },
    {
      id: 75613976,
      amount: 250,
      donation_date: '2025-08-28',
      donation_type: 'CREDIT_CARD',
      donor_name: 'John Smith',
      status: 'COMPLETED'
    }
  ];

  const donationData = donations.length > 0 ? donations : defaultDonations;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalDonations = () => {
    return donationData.reduce((total, donation) => total + donation.amount, 0);
  };


  return (
    <div className={styles.donationReport}>
      {/* Header Section */}
      <div className={styles.reportHeader}>
        <div className={styles.horizontalflex}>
          <div className={styles.companyBranding}>
            {/* Logo */}
            <img src={RAFI_Shield} alt="rafi-shield" className={styles.companyLogo}/>
            <div className={styles.companyTitle}>
              <h1 className={styles.companyName}>{companyInfo.name}</h1>
              <p className={styles.companyTagline}>{companyInfo.tagline}</p>
            </div>
          </div>
          
          {/* Company Information */}
          <div className={styles.companyInfo}>
            <p className={styles.companyLegalName}>{companyInfo.name} Inc.</p>
            <p>{companyInfo.address.street}</p>
            <p>{companyInfo.address.city}, {companyInfo.address.state} {companyInfo.address.zip}</p>
            <p>Phone: {companyInfo.contact.phone}</p>
            <p>Email: {companyInfo.contact.email}</p>
          </div>
        </div>
        
        {/* Report Info */}
        <div className={styles.reportInfo}>
          <h2 className={styles.reportTitle}>{reportTitle}</h2>
          <div className={styles.reportMetadata}>
            <span>Generated on: {new Date().toLocaleDateString()}</span>
            <span>Total Records: {donationData.length}</span>
          </div>
        </div>
      </div>

      {/* Body - Donations Table */}
      <main className={styles.reportMain}>
        <div className={styles.tableContainer}>
          <table className={styles.donationsTable}>
            <thead>
              <tr className={styles.tableHeader}>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Donation ID</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Donor Name</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Amount</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Date</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Type</th>
                <th className={`${styles.tableCell} ${styles.headerCell}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {donationData.map((donation) => (
                <tr key={donation.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>{donation.id}</td>
                  <td className={`${styles.tableCell} ${styles.donorName}`}>{donation.donor_name}</td>
                  <td className={`${styles.tableCell} ${styles.amount}`}>{formatCurrency(donation.amount)}</td>
                  <td className={styles.tableCell}>{formatDate(donation.donation_date)}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.badge} ${styles.typeBadge}`}>
                      {donation.donation_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.badge} ${styles.statusBadge} ${styles['status' + donation.status.charAt(0).toUpperCase() + donation.status.slice(1).toLowerCase()]}`}>
                      {donation.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className={styles.summarySection}>
          <h3 className={styles.summaryTitle}>Summary</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Total Donations:</p>
              <p className={`${styles.summaryValue} ${styles.totalAmount}`}>
                {formatCurrency(getTotalDonations())}
              </p>
            </div>
            <div className={styles.summaryItem}>
              <p className={styles.summaryLabel}>Number of Donors:</p>
              <p className={`${styles.summaryValue} ${styles.donorCount}`}>{donationData.length}</p>
            </div>
          </div>
        </div>

        {/* Print Button */}
        <div className={styles.printSection}>
          <button onClick={() => window.print()} className={styles.printButton}>
            Print Report
          </button>
        </div>
      </main>

      {/* Footer for print */}
      <div className={styles.printFooter}>
        <p>This report was generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>{companyInfo.name} Inc. - Confidential Document</p>
      </div>
    </div>
  );
}


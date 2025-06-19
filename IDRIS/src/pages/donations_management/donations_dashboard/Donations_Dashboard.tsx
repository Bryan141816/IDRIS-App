import './dashboard.scss';
import { useState, useEffect } from 'react';
import DownloadableFile from '../../../components/Page_Furniture/Downloadable_File';
import pdf_logo from '../files/pdf-logo.png';
import PieChart from '../../../components/Page_Furniture/PieChart';
import { DonationRecord } from './DonationRecord';
import { FundingCard } from './FundingCard';
import { getAllFundingProposals } from '../../../API_Handler/donations_funding_proposals_handler';

const reportsSample = [
  {
    "filename": "Annual_Donations_Report.pdf",
    "fileUrl": "../files/Annual_Donations_Report.pdf",
  },
  {
    "filename": "Monthly_Donations_Report.pdf",
    "fileUrl": "../files/Monthly_Donations_Report.pdf",
  },
]

const PieChartSample = {
  "labels": ["Site A", "Site B", "Site C"],
  "datasets": [25, 25, 50],
  "colors": ["#4B91C7", "#7BC8A4", "#F9D57F"],
}

const DonationRecordSample = [
  {
    "donor": "Clement",
    "amount": 250000000,
    "site": "Site A",
    "date": "04/18/2025",
  },
  {
    "donor": "Kent",
    "amount": 250000,
    "site": "Site B",
    "date": "04/18/2020",
  },
  {
    "donor": "Bryan",
    "amount": 500000,
    "site": "Site C",
    "date": "01/01/2000",
  },  {
    "donor": "Anonymous",
    "amount": 500000,
    "site": "Site C",
    "date": "12/01/2000",
  }
]

const DonationsDashboard = () => {
  interface Proposal {
    proposalId: number;
    image: string;
    description: string;
    progress: number;
    budgetRequired: number;
    anchor: string;
    status: string;
  }
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const [ mostRecentFundingPage ] = useState(1);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const response = await getAllFundingProposals(4, mostRecentFundingPage);
        setProposals(response);
        console.log(response);
      } catch (error) {
        console.error("Error fetching proposals:", error);
      }
    };

    fetchProposals();
  }, []);

  let statistics = {
      overall_donations: 1000000,
      total_donors: 138,
      retention: 78
  }

  return (
    <>
      <div id="dashboard">
        <h3 className='public-feed-title'>Donations Statistics</h3>
        <div id="donation-statistic">
          <div id="grid-container">
            <div className="donation-stat-card large">
              <p className="title">Overall Donations</p>
              <p className="stat-data">
                {new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 0
                }).format(statistics.overall_donations)}
              </p>
            </div>
            
            <div className="donation-stat-card">
              <p className="title">Total Donors</p>
              <p className="stat-data">{statistics.total_donors}</p>
            </div>
            <div className="donation-stat-card">
              <p className="title">Donor Retention</p>
              <p className="stat-data">{statistics.retention}%</p>
          </div>
          </div>  
            <div id="transparency-report">
              <p className="title">Transparency Reports</p>
              {reportsSample.map((report, index) => (
                <DownloadableFile key={index} icon={pdf_logo} filename={report.filename} fileUrl={report.fileUrl} className='transparency-report-file' />
              ))}
          </div>
          
        </div>

        <h3 className='public-feed-title'>Donations Per Site</h3>
        <div id="donations-pie-chart">
          <PieChart 
            labels={PieChartSample.labels} 
            backgroundColor={PieChartSample.colors} 
            data={PieChartSample.datasets}
            width={300}
            height={300}
            className='pie-chart'
          />
        </div>

        <h3 className='public-feed-title'>Donation Record</h3>
        <div id="donation-record-container">
          {DonationRecordSample.map((donation, index) => (
            <DonationRecord 
              key={index}
              donor={donation.donor} 
              amount={donation.amount} 
              site={donation.site}
              date={new Date(donation.date)}
              className='donation-record'
            />
          ))}
        </div>

        <h3 className='public-feed-title'>Recent Programs:</h3>
        <div id="funding-proposals">
          {proposals.map((funding, index) => (
            <FundingCard
              key={index}
              id = { funding.proposalId }
              image={funding.image}
              message={funding.description}
              funded={funding.progress}
              target={funding.budgetRequired}
              anchorLink={funding.anchor}
              className='funding-item'
            />
            ))}
        </div>
      </div>
    </>
  )
}

export default DonationsDashboard
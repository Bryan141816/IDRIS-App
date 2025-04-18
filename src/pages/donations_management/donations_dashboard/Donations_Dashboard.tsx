import './dashboard.scss';
import DownloadableFile from '../../../components/Downloadable_File'; '../../../components/Downloadable_File';
import pdf_logo from '../files/pdf-logo.png';
import PieChart from '../../../components/PieChart';
import { DonationRecord } from './DonationRecord';


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
    "amount": 250000,
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
  },
]

const DonationsDashboard = () => {

    let statistics = {
        overall_donations: 1000000,
        total_donors: 138,
        retention: 78
    }

  return (
    <>
      <div id="dashboard">
        <h3>Donations Statistics</h3>
        <div id="donation-statistic">
          <div id="grid-container">
            <div className="stat-card large">
              <p className="title">Overall Donations</p>
              <p className="stat-data">
                {new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 0
                }).format(statistics.overall_donations)}
              </p>
            </div>
            
            <div className="stat-card">
              <p className="title">Total Donors</p>
              <p className="stat-data">{statistics.total_donors}</p>
            </div>
            <div className="stat-card">
              <p className="title">Donor Retention</p>
              <p className="stat-data">{statistics.retention}%</p>
          </div>
          </div>  
            <div id="transparency-report">
              <p className="title">Transparency Reports</p>
              {reportsSample.map((report) => (
                <DownloadableFile icon={pdf_logo} filename={report.filename} fileUrl={report.fileUrl} className='transparency-report-file' />
              ))}
          </div>
          
        </div>

        <h3>Donations Per Site</h3>
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

        <h3>Donation Record</h3>
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
      </div>
    </>
  )
}

export default DonationsDashboard
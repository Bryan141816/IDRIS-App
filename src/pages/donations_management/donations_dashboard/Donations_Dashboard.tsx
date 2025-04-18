import './dashboard.scss';

const DonationsDashboard = () => {

    let statistics = {
        overall_donations: 1000000,
        total_donors: 138,
        retention: 78
    }

  return (
    <>
      <h3>Donations Statistics</h3>

      <div id="dashboard">
        <div id="donation-statistic">
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
          {/* Add content here later */}
        </div>
      </div>
    </>
  )
}

export default DonationsDashboard
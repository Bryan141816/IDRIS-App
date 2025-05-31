import React from 'react';
import MapView, { MarkerType } from "../../../components/MapView/MapView";
import "../css/manage_evacuation_and_shelter.css";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const data = {
    labels: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
      {
        label: 'Monthly Shelter Occupancy (%)',
        data: [
          52.8, 58.3, 61.1, 65.6, 69.3, 72.2,
          75.0, 80.6, 83.3, 79.4, 72.2, 61.1
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderRadius: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Monthly Shelter Utilization Over the Year',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const percent = context.parsed.y;
            const evacuees = Math.round((percent / 100) * 1800);
            return `Occupancy: ${percent}% (${evacuees} evacuees)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: 'Occupancy (%)' },
        ticks: {
          callback: value => `${value}%`,
        },
      },
    },
  };



const EvacuationAndShelter = () => {
    return (
        // Main Dashboard
        <main className="dashboard-container">
            {/* Status Overview */}
            <section className="status-overview">
                <div className="status-card critical">
                    <div className="status-icon">
                        <i className="fas fa-exclamation-circle"></i>
                    </div>
                    <div className="status-content">
                        <h3>Active Emergencies</h3>
                        <p className="status-number">3</p>
                        <span className="status-label">Requires immediate attention</span>
                    </div>
                </div>
                <div className="status-card warning">
                    <div className="status-icon">
                        <i className="fas fa-users"></i>
                    </div>
                    <div className="status-content">
                        <h3>People in Shelters</h3>
                        <p className="status-number">1,247</p>
                        <span className="status-label">Across 12 locations</span>
                    </div>
                </div>
                <div className="status-card info">
                    <div className="status-icon">
                        <i className="fas fa-home"></i>
                    </div>
                    <div className="status-content">
                        <h3>Available Capacity</h3>
                        <p className="status-number">68%</p>
                        <span className="status-label">3,200 beds available</span>
                    </div>
                </div>
                <div className="status-card success">
                    <div className="status-icon">
                        <i className="fas fa-map-location-dot"></i>
                    </div>
                    <div className="status-content">
                        <h3>Barangays Covered</h3>
                        <p className="status-number">45/52</p>
                        <span className="status-label">Assigned to shelters</span>
                    </div>
                </div>
            </section>

            {/* Quick Actions */}
            <section className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="action-buttons">
                    <button className="action-btn primary admin-only">
                        <i className="fas fa-plus-circle"></i>
                        &nbsp;Register Evacuation Center
                    </button>
                    <button className="action-btn secondary">
                        <i className="fas fa-map-marked-alt"></i>
                        View Shelter Map
                    </button>
                    <button className="action-btn secondary admin-only">
                        <i className="fas fa-users-cog"></i>
                        &nbsp;Assign Barangays
                    </button>
                    <button className="action-btn secondary">
                        <i className="fas fa-file-chart-line"></i>
                        Generate Reports
                    </button>
                </div>
            </section>

            {/* Main Content Grid */}
            <div className="content-grid">
                {/* Map Section - Use Case: View Evacuation/Shelter Maps and Occupancy */}
                <div className="left-column">
                <section className="map-section">
                    <div className="section-header">
                        <h2>
                            <i className="fas fa-map"></i>
                            &nbsp;Evacuation/Shelter Maps and Occupancy
                        </h2>
                        <div className="map-controls">
                            <select className="map-filter">
                                <option>All Shelters</option>
                                <option>Available Only</option>
                                <option>Near Capacity</option>
                                <option>Full Capacity</option>
                            </select>
                            <button className="map-btn"><i className="fas fa-layer-group"></i></button>
                            <button className="map-btn"><i className="fas fa-crosshairs"></i></button>
                            <button className="map-btn"><i className="fas fa-expand"></i></button>
                        </div>
                    </div>
                    <div className="map-container">
                        <div className="maps-placeholder">
                        <MapView
                            center={[10.313924, 123.887082]}
                            markers={[]}
                        />
                        </div>
                        <div className="map-legend">
                            <div className="legend-item">
                                <span className="legend-color shelter"></span>
                                <span>Shelters</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color route"></span>
                                <span>Evacuation Routes</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color danger"></span>
                                <span>Danger Zones</span>
                            </div>
                            <div className="legend-item">
                                <span className="legend-color barangay"></span>
                                <span>Barangay Boundaries</span>
                            </div>
                        </div>
                    </div>
                </section>




                </div>

                {/* Right Column */}
                <div className="right-column">
                    {/* Register/Update Evacuation Centers (Admin Only) */}
                    <section className="evacuation-center-form admin-only">
                        <div className="section-header">
                            <h2>
                                <i className="fas fa-edit"></i>
                                &nbsp;Register/Update Evacuation Center
                            </h2>
                        </div>
                        <form className="center-form">
                            <div className="form-group">
                                <label>Center Name</label>
                                <input type="text" placeholder="Enter evacuation center name" />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input type="text" placeholder="Complete address" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Capacity</label>
                                    <input type="number" placeholder="Max capacity" />
                                </div>
                                <div className="form-group">
                                    <label>Current Occupancy</label>
                                    <input type="number" placeholder="Current count" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Facilities Available</label>
                                <div className="checkbox-group">
                                    <label><input type="checkbox" /> Medical Station</label>
                                    <label><input type="checkbox" /> Kitchen</label>
                                    <label><input type="checkbox" /> Restrooms</label>
                                    <label><input type="checkbox" /> Children's Area</label>
                                </div>
                            </div>
                            <button type="submit" className="submit-btn">
                                <i className="fas fa-save"></i> Save Evacuation Center
                            </button>
                        </form>
                    </section>


                </div>
            </div>
{/* Shelter Status */}
                    <section className="shelter-status">
                        <div className="section-header">
                            <h2>Shelter Status</h2>
                            <a href="#" className="view-all">View All</a>
                        </div>
                        <div className="shelter-list">
                            <div className="shelter-item">
                                <div className="shelter-info">
                                    <h4>Central Community Center</h4>
                                    <p><i className="fas fa-map-marker-alt"></i> 123 Main St, Downtown</p>
                                    <p className="barangay-info">
                                        <i className="fas fa-city"></i> Assigned: Barangays 1, 2, 3
                                    </p>
                                </div>
                                <div className="shelter-stats">
                                    <div className="capacity-bar">
                                        <div className="capacity-fill" style={{width: '75%'}}></div>
                                    </div>
                                    <span className="capacity-text">450/600 people</span>
                                </div>
                                <span className="shelter-badge operational">Operational</span>
                            </div>
                            <div className="shelter-item">
                                <div className="shelter-info">
                                    <h4>East Side High School</h4>
                                    <p><i className="fas fa-map-marker-alt"></i> 456 Oak Ave, East District</p>
                                    <p className="barangay-info">
                                        <i className="fas fa-city"></i> Assigned: Barangays 4, 5
                                    </p>
                                </div>
                                <div className="shelter-stats">
                                    <div className="capacity-bar">
                                        <div className="capacity-fill" style={{width: '45%'}}></div>
                                    </div>
                                    <span className="capacity-text">180/400 people</span>
                                </div>
                                <span className="shelter-badge operational">Operational</span>
                            </div>
                        </div>
                    </section>

                    <section className="barangay-assignment admin-only">
            <div className="section-header">
                <h2>
                    <i className="fas fa-users-cog"></i>
                    &nbsp;Assign Barangays to Shelters
                </h2>
                <button className="auto-assign-btn">
                    <i className="fas fa-magic"></i> Auto-Assign
                </button>
            </div>
            <div className="assignment-grid">
                <div className="unassigned-barangays">
                    <h3>Unassigned Barangays</h3>
                    <div className="barangay-list">
                        <div className="barangay-card draggable" draggable="true">
                            <i className="fas fa-city"></i>
                            <div>
                                <h4>Barangay San Jose</h4>
                                <p>Population: 2,500</p>
                            </div>
                        </div>
                        <div className="barangay-card draggable" draggable="true">
                            <i className="fas fa-city"></i>
                            <div>
                                <h4>Barangay Sta. Cruz</h4>
                                <p>Population: 1,800</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="shelter-assignments">
                    <h3>Shelter Assignments</h3>
                    <div className="assignment-shelters">
                        <div className="assignment-shelter">
                            <div className="shelter-header">
                                <h4>Central Community Center</h4>
                                <span className="capacity-indicator">450/600</span>
                            </div>
                            <div className="assigned-barangays drop-zone">
                                <div className="barangay-tag">
                                    <span>Barangay 1</span>
                                    <button className="remove-btn">×</button>
                                </div>
                                <div className="barangay-tag">
                                    <span>Barangay 2</span>
                                    <button className="remove-btn">×</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
            <section className="reports-section">
            <div className="section-header">
                <h2>
                    <i className="fas fa-file-chart-line"></i>
                    Shelter Utilization Reports
                </h2>
                <div className="report-controls">
                    <select className="report-type">
                        <option>Daily Report</option>
                        <option>Weekly Report</option>
                        <option>Monthly Report</option>
                        <option>Custom Range</option>
                    </select>
                    <button className="generate-report-btn">
                        <i className="fas fa-download"></i> Generate Report
                    </button>
                </div>
            </div>
            <div className="report-content">
                <div className="report-summary">
                    <div className="summary-card">
                        <h3>Total Evacuees</h3>
                        <p className="summary-number">1,247</p>
                        <span className="trend positive">
                            <i className="fas fa-arrow-up"></i> 12% from yesterday
                        </span>
                    </div>
                    <div className="summary-card">
                        <h3>Average Occupancy</h3>
                        <p className="summary-number">68%</p>
                        <span className="trend">Optimal range</span>
                    </div>
                    <div className="summary-card">
                        <h3>Active Shelters</h3>
                        <p className="summary-number">12/15</p>
                        <span className="trend">3 on standby</span>
                    </div>
                </div>
                <div className="utilization-chart">
                    <h3>Shelter Utilization Over Time</h3>
                    <div className="chart-container" style={{ maxWidth: '100%', marginTop: '1rem', height: '350px'}}>
  <Bar data={data} options={options} />
</div>

                </div>
            </div>
        </section>

            {/* Recent Activity Feed */}
            <section className="activity-feed">
                <div className="section-header">
                    <h2>Recent Activity</h2>
                    <button className="filter-btn"><i className="fas fa-filter"></i> Filter</button>
                </div>
                <div className="activity-list">
                    <div className="activity-item alert">
                        <div className="activity-icon">
                            <i className="fas fa-plus-circle"></i>
                        </div>
                        <div className="activity-content">
                            <h4>New Evacuation Center Registered</h4>
                            <p>West Community Hall added with 300 capacity</p>
                            <span className="activity-time">5 minutes ago</span>
                            <span className="activity-user admin">by Admin Officer</span>
                        </div>
                    </div>
                    <div className="activity-item update">
                        <div className="activity-icon">
                            <i className="fas fa-users-cog"></i>
                        </div>
                        <div className="activity-content">
                            <h4>Barangay Assignment Updated</h4>
                            <p>Barangay San Jose assigned to East Side High School</p>
                            <span className="activity-time">15 minutes ago</span>
                            <span className="activity-user admin">by Admin Officer</span>
                        </div>
                    </div>
                    <div className="activity-item resource">
                        <div className="activity-icon">
                            <i className="fas fa-file-download"></i>
                        </div>
                        <div className="activity-content">
                            <h4>Report Generated</h4>
                            <p>Weekly utilization report downloaded</p>
                            <span className="activity-time">1 hour ago</span>
                            <span className="activity-user lgu">by LGU Representative</span>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default EvacuationAndShelter;

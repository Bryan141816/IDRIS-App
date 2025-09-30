import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faSearch, 
  faFilter, 
  faExclamationTriangle, 
  faUsers, 
  faMapMarkerAlt, 
  faClock,
  faPlus,
  faEdit,
  faTrash
} from "@fortawesome/free-solid-svg-icons";
import { fetchData } from "../../API_Handler/response_dashboard";
import "./ReportList.scss";

interface ReportEntry {
  id: string;
  timestamp: string;
  report_type: "incident_report" | "supply_request" | "team_deployment" | "status_update";
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  description: string;
  assigned_team?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  created_by: string;
  updated_at: string;
}

const ReportList: React.FC = () => {
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm, filterType, filterStatus, filterPriority]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      await fetchData<ReportEntry[]>("/response_dashboard/reports/all", setReports);
    } catch (error) {
      console.error("Failed to load reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.created_by.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(report => report.report_type === filterType);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(report => report.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter(report => report.priority === filterPriority);
    }

    setFilteredReports(filtered);
  };

  const getReportTypeStyle = (type: string) => {
    const styles = {
      incident_report: { color: "#dc3545", icon: faExclamationTriangle, label: "Incident Report" },
      supply_request: { color: "#28a745", icon: faMapMarkerAlt, label: "Supply Request" },
      team_deployment: { color: "#007bff", icon: faUsers, label: "Team Deployment" },
      status_update: { color: "#ffc107", icon: faClock, label: "Status Update" }
    };
    return styles[type as keyof typeof styles] || { color: "#6c757d", icon: faMapMarkerAlt, label: "Report" };
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      urgent: { color: "#dc3545", bg: "#fff5f5" },
      high: { color: "#fd7e14", bg: "#fff8f0" },
      medium: { color: "#ffc107", bg: "#fffbf0" },
      low: { color: "#28a745", bg: "#f0fff4" }
    };
    return styles[priority as keyof typeof styles] || { color: "#6c757d", bg: "#f8f9fa" };
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { color: "#6c757d", bg: "#f8f9fa" },
      in_progress: { color: "#007bff", bg: "#e3f2fd" },
      completed: { color: "#28a745", bg: "#e8f5e8" },
      cancelled: { color: "#dc3545", bg: "#ffebee" }
    };
    return styles[status as keyof typeof styles] || { color: "#6c757d", bg: "#f8f9fa" };
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleDeleteReport = async (reportId: string) => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        // Add delete API call here
        setReports(reports.filter(report => report.id !== reportId));
      } catch (error) {
        console.error("Failed to delete report:", error);
      }
    }
  };

  return (
    <div className="report-list">
      <div className="page-header">
        <h2>Report Management</h2>
        <button className="btn-primary">
          <FontAwesomeIcon icon={faPlus} />
          Add New Report
        </button>
      </div>

      {/* Enhanced Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <FontAwesomeIcon icon={faSearch} />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Types</option>
          <option value="incident_report">Incident Reports</option>
          <option value="supply_request">Supply Requests</option>
          <option value="team_deployment">Team Deployments</option>
          <option value="status_update">Status Updates</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Reports Statistics */}
      <div className="reports-stats">
        <div className="stat-card">
          <div className="stat-value">{reports.length}</div>
          <div className="stat-label">Total Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.status === 'pending').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.status === 'in_progress').length}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{reports.filter(r => r.status === 'completed').length}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="reports-table-container">
        {isLoading ? (
          <div className="loading-state">Loading reports...</div>
        ) : (
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Type</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Location</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report) => {
                const typeStyle = getReportTypeStyle(report.report_type);
                const priorityStyle = getPriorityBadge(report.priority);
                const statusStyle = getStatusBadge(report.status);

                return (
                  <tr key={report.id}>
                    <td>{formatDateTime(report.timestamp)}</td>
                    <td>
                      <div className="report-type">
                        <FontAwesomeIcon 
                          icon={typeStyle.icon} 
                          style={{ color: typeStyle.color, marginRight: "8px" }}
                        />
                        <span style={{ fontSize: "0.85rem" }}>
                          {typeStyle.label}
                        </span>
                      </div>
                    </td>
                    <td className="title-cell">
                      <div className="title-content">
                        <span className="report-title">{report.title}</span>
                        <span className="report-description">{report.description}</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="priority-badge"
                        style={{
                          backgroundColor: priorityStyle.bg,
                          color: priorityStyle.color,
                          border: `1px solid ${priorityStyle.color}40`
                        }}
                      >
                        {report.priority.toUpperCase()}
                      </span>
                    </td>
                    <td>{report.location.name}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.color}40`
                        }}
                      >
                        {report.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{report.created_by}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon view" title="View Report">
                          <FontAwesomeIcon icon={faSearch} />
                        </button>
                        <button className="btn-icon edit" title="Edit Report">
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button 
                          className="btn-icon delete" 
                          title="Delete Report"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filteredReports.length === 0 && !isLoading && (
          <div className="empty-state">
            <FontAwesomeIcon icon={faSearch} size="2x" />
            <h3>No Reports Found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportList;

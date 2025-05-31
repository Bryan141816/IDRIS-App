
import React, { useState } from 'react';
import { FileText, Download, Archive, Calendar, Filter, Search, Clock, CheckCircle, AlertCircle, XCircle, ArchiveRestore, Eye } from 'lucide-react';
import './css/reports_generation.css';

const ReportsGeneration = () => {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'

  // Sample reports data
  const [activeReports, setActiveReports] = useState([
    { id: 1, title: 'Monthly Sales Report - Q3 2024', description: 'Comprehensive sales analysis for the third quarter', type: 'Sales', date: '2024-10-15', status: 'completed', size: '2.4 MB' },
    { id: 2, title: 'Customer Engagement Analytics', description: 'User behavior and engagement metrics for September', type: 'Analytics', date: '2024-10-14', status: 'processing', size: '1.8 MB' },
    { id: 3, title: 'Financial Performance Review', description: 'Q3 financial statements and performance indicators', type: 'Financial', date: '2024-10-13', status: 'completed', size: '3.2 MB' },
    { id: 4, title: 'Product Performance Dashboard', description: 'Product sales and performance metrics', type: 'Sales', date: '2024-10-12', status: 'failed', size: '1.5 MB' },
    { id: 5, title: 'Marketing Campaign Results', description: 'ROI analysis for recent marketing campaigns', type: 'Marketing', date: '2024-10-11', status: 'completed', size: '2.1 MB' },
    { id: 6, title: 'User Feedback Summary', description: 'Consolidated user feedback and satisfaction scores', type: 'Analytics', date: '2024-10-10', status: 'processing', size: '0.8 MB' }
  ]);

  const [archivedReports, setArchivedReports] = useState([]);

  // Stats calculation
  const totalReports = activeReports.length + archivedReports.length;
  const activeReportsCount = activeReports.length;
  const archivedReportsCount = archivedReports.length;
  const processingCount = activeReports.filter(r => r.status === 'processing').length;
  const completedCount = [...activeReports, ...archivedReports].filter(r => r.status === 'completed').length;

  // Filter types
  const reportTypes = ['all', 'Sales', 'Analytics', 'Financial', 'Marketing'];

  // Determine which reports to show based on view mode
  const currentReports = viewMode === 'active' ? activeReports : archivedReports;

  // Filter reports based on type and search
  const filteredReports = currentReports.filter(report => {
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleArchive = (reportId) => {
    const reportToArchive = activeReports.find(r => r.id === reportId);
    if (reportToArchive) {
      setActiveReports(activeReports.filter(r => r.id !== reportId));
      setArchivedReports([...archivedReports, { ...reportToArchive, archivedDate: new Date().toISOString() }]);
    }
  };

  const handleUnarchive = (reportId) => {
    const reportToUnarchive = archivedReports.find(r => r.id === reportId);
    if (reportToUnarchive) {
      setArchivedReports(archivedReports.filter(r => r.id !== reportId));
      const { archivedDate, ...reportWithoutArchiveDate } = reportToUnarchive;
      setActiveReports([...activeReports, reportWithoutArchiveDate]);
    }
  };

  const handleDownload = (report) => {
    console.log('Downloading:', report.title);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { icon: CheckCircle, class: 'status-badge completed', text: 'Completed' },
      processing: { icon: Clock, class: 'status-badge processing', text: 'Processing' },
      failed: { icon: XCircle, class: 'status-badge failed', text: 'Failed' },
      pending: { icon: AlertCircle, class: 'status-badge pending', text: 'Pending' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={config.class}>
        <Icon size={14} />
        <span>{config.text}</span>
      </span>
    );
  };

  return (
    <div className="reports-generation">
      <div className="reports-container">
        {/* Header */}
        <div className="reports-header">
          <h1 className="reports-title">Reports Generation</h1>
          <p className="reports-subtitle">View and download your generated reports</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Total Reports</p>
                <p className="stat-value">{totalReports}</p>
              </div>
              <div className="stat-icon-wrapper blue">
                <FileText size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Active Reports</p>
                <p className="stat-value">{activeReportsCount}</p>
              </div>
              <div className="stat-icon-wrapper green">
                <Eye size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Archived</p>
                <p className="stat-value">{archivedReportsCount}</p>
              </div>
              <div className="stat-icon-wrapper purple">
                <Archive size={24} />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <p className="stat-label">Completed</p>
                <p className="stat-value">{completedCount}</p>
              </div>
              <div className="stat-icon-wrapper yellow">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="view-mode-toggle">
          <button
            className={`view-mode-button ${viewMode === 'active' ? 'active' : ''}`}
            onClick={() => setViewMode('active')}
          >
            <Eye size={18} />
            <span>Active Reports ({activeReportsCount})</span>
          </button>
          <button
            className={`view-mode-button ${viewMode === 'archived' ? 'active' : ''}`}
            onClick={() => setViewMode('archived')}
          >
            <Archive size={18} />
            <span>Archived Reports ({archivedReportsCount})</span>
          </button>
        </div>

        {/* Filter and Search */}
        <div className="filter-section">
          <div className="filter-search-container">
            {/* Filter Dropdown */}
            <div className="filter-dropdown">
              <button
                className="filter-button"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="filter-button-content">
                  <Filter size={18} />
                  <span>{filterType === 'all' ? 'All Types' : filterType}</span>
                </div>
                <svg className={`dropdown-arrow ${showDropdown ? 'open' : ''}`} width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {showDropdown && (
                <div className="dropdown-menu">
                  {reportTypes.map(type => (
                    <button
                      key={type}
                      className={`dropdown-item ${filterType === type ? 'active' : ''}`}
                      onClick={() => {
                        setFilterType(type);
                        setShowDropdown(false);
                      }}
                    >
                      {type === 'all' ? 'All Types' : type}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="search-container">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
        </div>

        {/* Archive Info Banner (shown when viewing archived) */}
        {viewMode === 'archived' && archivedReportsCount > 0 && (
          <div className="archive-info-banner">
            <Archive size={20} />
            <span>These reports have been archived and are no longer active. You can restore them at any time.</span>
          </div>
        )}

        {/* Reports List */}
        <div className="reports-list">
          {filteredReports.length > 0 ? (
            filteredReports.map(report => (
              <div key={report.id} className={`report-card ${viewMode === 'archived' ? 'archived' : ''}`}>
                <div className="report-card-content">
                  {/* Report Info */}
                  <div className="report-info">
                    <div className="report-info-header">
                      <div className="report-icon-wrapper">
                        <FileText size={20} className="report-icon" />
                      </div>
                      <div className="report-details">
                        <h3 className="report-title">{report.title}</h3>
                        <p className="report-description">{report.description}</p>
                        <div className="report-metadata">
                          <div className="report-meta-item">
                            <Calendar size={14} />
                            <span>{new Date(report.date).toLocaleDateString()}</span>
                          </div>
                          <span className="report-meta-separator">•</span>
                          <span className="report-meta-item">{report.type}</span>
                          <span className="report-meta-separator">•</span>
                          <span className="report-meta-item">{report.size}</span>
                          {report.archivedDate && (
                            <>
                              <span className="report-meta-separator">•</span>
                              <span className="report-meta-item archived-date">
                                Archived: {new Date(report.archivedDate).toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="report-actions">
                    {getStatusBadge(report.status)}
                    {viewMode === 'active' ? (
                      <button
                        onClick={() => handleArchive(report.id)}
                        className="archive-button"
                        title="Archive Report"
                      >
                        <Archive size={18} className="archive-button-icon" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUnarchive(report.id)}
                        className="unarchive-button"
                        title="Restore Report"
                      >
                        <ArchiveRestore size={18} className="unarchive-button-icon" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(report)}
                      className="download-button"
                      disabled={report.status !== 'completed'}
                    >
                      <Download size={16} />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon-wrapper">
                {viewMode === 'archived' ? <Archive size={32} className="empty-state-icon" /> : <FileText size={32} className="empty-state-icon" />}
              </div>
              <h3 className="empty-state-title">
                {viewMode === 'archived' ? 'No archived reports' : 'No reports found'}
              </h3>
              <p className="empty-state-text">
                {viewMode === 'archived'
                  ? 'Reports you archive will appear here'
                  : 'Try adjusting your filters or search query'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsGeneration;

import React, { useState } from 'react';
import './ProcurementManagement.scss';


const ProcurementManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);


  // Sample procurement data
  const procurementRequests = [
    {
      id: 1,
      requestId: 'PR-2024-001',
      title: 'Emergency Medical Supplies',
      requester: 'Maria Santos - Medical Team Lead',
      department: 'Medical Response',
      requestDate: '2024-05-20',
      priority: 'High',
      status: 'Pending Approval',
      estimatedCost: 250000,
      description: 'First aid kits, bandages, antiseptics for emergency response',
      items: [
        { name: 'First Aid Kits', quantity: 50, unitCost: 2500 },
        { name: 'Medical Bandages', quantity: 200, unitCost: 150 },
        { name: 'Antiseptic Solution', quantity: 100, unitCost: 300 }
      ]
    },
    {
      id: 2,
      requestId: 'PR-2024-002',
      title: 'Communication Equipment',
      requester: 'Juan Dela Cruz - Operations Manager',
      department: 'Operations',
      requestDate: '2024-05-22',
      priority: 'Medium',
      status: 'Approved',
      estimatedCost: 180000,
      description: 'Two-way radios and communication devices for field teams',
      items: [
        { name: 'Two-way Radios', quantity: 20, unitCost: 8000 },
        { name: 'Radio Batteries', quantity: 40, unitCost: 500 }
      ]
    },
    {
      id: 3,
      requestId: 'PR-2024-003',
      title: 'Transportation Vehicles',
      requester: 'Pedro Garcia - Logistics Coordinator',
      department: 'Logistics',
      requestDate: '2024-05-18',
      priority: 'High',
      status: 'Rejected',
      estimatedCost: 1500000,
      description: 'Emergency response vehicles for disaster relief operations',
      rejectionReason: 'Budget constraints - please submit revised proposal',
      items: [
        { name: 'Emergency Response Van', quantity: 2, unitCost: 750000 }
      ]
    },
    {
      id: 4,
      requestId: 'PR-2024-004',
      title: 'Office Supplies',
      requester: 'Ana Reyes - Administrative Officer',
      department: 'Administration',
      requestDate: '2024-05-25',
      priority: 'Low',
      status: 'In Progress',
      estimatedCost: 25000,
      description: 'General office supplies for administrative operations',
      items: [
        { name: 'Office Paper', quantity: 50, unitCost: 200 },
        { name: 'Printer Ink', quantity: 10, unitCost: 1500 },
        { name: 'Folders', quantity: 100, unitCost: 50 }
      ]
    }
  ];


  const notifications = [
    {
      id: 1,
      type: 'approval_required',
      message: 'PR-2024-005: Food Relief Packages requires your approval',
      timestamp: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'status_update',
      message: 'PR-2024-002: Communication Equipment has been approved',
      timestamp: '1 day ago',
      read: true
    },
    {
      id: 3,
      type: 'rejection',
      message: 'PR-2024-003: Transportation Vehicles has been rejected',
      timestamp: '2 days ago',
      read: true
    }
  ];


  const resourceUsage = [
    {
      category: 'Medical Supplies',
      allocated: 500000,
      used: 325000,
      percentage: 65
    },
    {
      category: 'Equipment',
      allocated: 800000,
      used: 480000,
      percentage: 60
    },
    {
      category: 'Transportation',
      allocated: 1200000,
      used: 720000,
      percentage: 60
    },
    {
      category: 'Office Supplies',
      allocated: 150000,
      used: 45000,
      percentage: 30
    }
  ];


  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };


  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending approval': return 'pending';
      case 'approved': return 'approved';
      case 'rejected': return 'rejected';
      case 'in progress': return 'in-progress';
      default: return 'pending';
    }
  };


  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  };


  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };


  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
  };


  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <h3>{procurementRequests.length}</h3>
            <p>Total Requests</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <h3>{procurementRequests.filter(r => r.status === 'Pending Approval').length}</h3>
            <p>Pending Approval</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{procurementRequests.filter(r => r.status === 'Approved').length}</h3>
            <p>Approved</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{formatCurrency(procurementRequests.reduce((sum, r) => sum + r.estimatedCost, 0))}</h3>
            <p>Total Value</p>
          </div>
        </div>
      </div>


      <div className="dashboard-grid">
        <div className="chart-container">
          <h3>Resource Usage Overview</h3>
          <div className="resource-usage">
            {resourceUsage.map((resource, index) => (
              <div key={index} className="resource-item">
                <div className="resource-info">
                  <span className="resource-category">{resource.category}</span>
                  <span className="resource-amounts">
                    {formatCurrency(resource.used)} / {formatCurrency(resource.allocated)}
                  </span>
                </div>
                <div className="resource-bar">
                  <div
                    className="resource-fill"
                    style={{ width: `${resource.percentage}%` }}
                  ></div>
                </div>
                <div className="resource-percentage">{resource.percentage}% utilized</div>
              </div>
            ))}
          </div>
        </div>


        <div className="chart-container">
          <h3>Recent Notifications</h3>
          <div className="notifications-list">
            {notifications.map(notification => (
              <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                <div className="notification-content">
                  <div className={`notification-type ${notification.type}`}>
                    {notification.type === 'approval_required' && '⚠️'}
                    {notification.type === 'status_update' && '📋'}
                    {notification.type === 'rejection' && '❌'}
                  </div>
                  <div className="notification-text">
                    <p>{notification.message}</p>
                    <small>{notification.timestamp}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );


  const renderRequests = () => (
    <div className="requests-content">
      <div className="section-header">
        <h2>Procurement Requests</h2>
        <button className="primary-btn" onClick={() => openModal('submit-request')}>
          + Submit Request
        </button>
      </div>


      <div className="requests-grid">
        {procurementRequests.map(request => (
          <div key={request.id} className="request-card">
            <div className="request-header">
              <div className="request-id">{request.requestId}</div>
              <div className="request-badges">
                <span className={`priority-badge ${getPriorityColor(request.priority)}`}>
                  {request.priority}
                </span>
                <span className={`status-badge ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
            </div>
            <div className="request-content">
              <h3>{request.title}</h3>
              <p className="request-description">{request.description}</p>
              <div className="request-details">
                <div className="detail-row">
                  <span>Requester:</span>
                  <span>{request.requester}</span>
                </div>
                <div className="detail-row">
                  <span>Department:</span>
                  <span>{request.department}</span>
                </div>
                <div className="detail-row">
                  <span>Date:</span>
                  <span>{new Date(request.requestDate).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span>Estimated Cost:</span>
                  <span className="cost">{formatCurrency(request.estimatedCost)}</span>
                </div>
              </div>
              {request.rejectionReason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong> {request.rejectionReason}
                </div>
              )}
              <div className="request-actions">
                <button className="action-btn" onClick={() => openModal('view-request', request)}>
                  View Details
                </button>
                {request.status === 'Pending Approval' && (
                  <>
                    <button className="approve-btn" onClick={() => openModal('approve-request', request)}>
                      Approve
                    </button>
                    <button className="reject-btn" onClick={() => openModal('reject-request', request)}>
                      Reject
                    </button>
                  </>
                )}
                {request.status !== 'Approved' && request.status !== 'Rejected' && (
                  <button className="action-btn" onClick={() => openModal('update-status', request)}>
                    Update Status
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const renderApprovals = () => (
    <div className="approvals-content">
      <div className="section-header">
        <h2>Approval Management</h2>
        <div className="header-actions">
          <button className="secondary-btn" onClick={() => openModal('bulk-approve')}>
            📋 Bulk Actions
          </button>
          <button className="primary-btn" onClick={() => openModal('approval-settings')}>
            ⚙️ Settings
          </button>
        </div>
      </div>


      <div className="approval-queue">
        <h3>Pending Approvals ({procurementRequests.filter(r => r.status === 'Pending Approval').length})</h3>
        <div className="approval-table">
          <table>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Title</th>
                <th>Requester</th>
                <th>Priority</th>
                <th>Cost</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {procurementRequests.filter(r => r.status === 'Pending Approval').map(request => (
                <tr key={request.id}>
                  <td>{request.requestId}</td>
                  <td>{request.title}</td>
                  <td>{request.requester.split(' - ')[0]}</td>
                  <td>
                    <span className={`priority-badge ${getPriorityColor(request.priority)}`}>
                      {request.priority}
                    </span>
                  </td>
                  <td>{formatCurrency(request.estimatedCost)}</td>
                  <td>{new Date(request.requestDate).toLocaleDateString()}</td>
                  <td>
                    <button className="action-btn" onClick={() => openModal('quick-approve', request)}>
                      Quick Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      <div className="approval-history">
        <h3>Recent Approval History</h3>
        <div className="history-list">
          {procurementRequests.filter(r => r.status === 'Approved' || r.status === 'Rejected').map(request => (
            <div key={request.id} className="history-item">
              <div className="history-info">
                <strong>{request.requestId} - {request.title}</strong>
                <span>by {request.requester.split(' - ')[0]}</span>
                <small>{new Date(request.requestDate).toLocaleDateString()}</small>
              </div>
              <div className="history-status">
                <span className={`status-badge ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
                <span className="history-cost">{formatCurrency(request.estimatedCost)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );


  const renderNotifications = () => (
    <div className="notifications-content">
      <div className="section-header">
        <h2>Notification Management</h2>
        <div className="header-actions">
          <button className="secondary-btn" onClick={() => openModal('mark-all-read')}>
            ✓ Mark All Read
          </button>
          <button className="primary-btn" onClick={() => openModal('notification-settings')}>
            🔔 Settings
          </button>
        </div>
      </div>


      <div className="notification-filters">
        <button className="filter-btn active">All</button>
        <button className="filter-btn">Unread</button>
        <button className="filter-btn">Approval Required</button>
        <button className="filter-btn">Status Updates</button>
      </div>


      <div className="notifications-detailed">
        {notifications.map(notification => (
          <div key={notification.id} className={`notification-detail ${notification.read ? 'read' : 'unread'}`}>
            <div className="notification-header">
              <div className={`notification-icon ${notification.type}`}>
                {notification.type === 'approval_required' && '⚠️'}
                {notification.type === 'status_update' && '📋'}
                {notification.type === 'rejection' && '❌'}
              </div>
              <div className="notification-meta">
                <span className="notification-time">{notification.timestamp}</span>
                {!notification.read && <span className="unread-indicator">●</span>}
              </div>
            </div>
            <div className="notification-body">
              <p>{notification.message}</p>
              <div className="notification-actions">
                <button className="action-btn">View Request</button>
                {notification.type === 'approval_required' && (
                  <button className="primary-btn">Take Action</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );


  const renderModal = () => {
    if (!showModal) return null;


    const getModalContent = () => {
      switch (modalType) {
        case 'submit-request':
          return (
            <div className="modal-content">
              <h3>Submit Procurement Request</h3>
              <div className="form-group">
                <label>Request Title</label>
                <input type="text" placeholder="Enter request title" />
              </div>
              <div className="form-group">
                <label>Department</label>
                <select>
                  <option>Select department</option>
                  <option>Medical Response</option>
                  <option>Operations</option>
                  <option>Logistics</option>
                  <option>Administration</option>
                  <option>Finance</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
              <div className="form-group">
                <label>Estimated Cost (PHP)</label>
                <input type="number" placeholder="Enter estimated cost" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe the procurement requirement" rows={4}></textarea>
              </div>
              <div className="form-group">
                <label>Justification</label>
                <textarea placeholder="Provide justification for this request" rows={3}></textarea>
              </div>
            </div>
          );
        case 'view-request':
          return (
            <div className="modal-content">
              <h3>Request Details - {selectedItem?.requestId}</h3>
              <div className="view-details">
                <div className="detail-section">
                  <h4>Request Information</h4>
                  <div className="detail-row">
                    <strong>Title:</strong>
                    <span>{selectedItem?.title}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Requester:</strong>
                    <span>{selectedItem?.requester}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Department:</strong>
                    <span>{selectedItem?.department}</span>
                  </div>
                  <div className="detail-row">
                    <strong>Priority:</strong>
                    <span className={`priority-badge ${getPriorityColor(selectedItem?.priority || '')}`}>
                      {selectedItem?.priority}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong>
                    <span className={`status-badge ${getStatusColor(selectedItem?.status || '')}`}>
                      {selectedItem?.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Description:</strong>
                    <span>{selectedItem?.description}</span>
                  </div>
                </div>
                <div className="detail-section">
                  <h4>Items Requested</h4>
                  <div className="items-list">
                    {selectedItem?.items?.map((item, index) => (
                      <div key={index} className="item-row">
                        <span>{item.name}</span>
                        <span>Qty: {item.quantity}</span>
                        <span>{formatCurrency(item.unitCost)}</span>
                        <span><strong>{formatCurrency(item.quantity * item.unitCost)}</strong></span>
                      </div>
                    ))}
                    <div className="items-total">
                      <strong>Total: {formatCurrency(selectedItem?.estimatedCost || 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        case 'approve-request':
          return (
            <div className="modal-content">
              <h3>Approve Request - {selectedItem?.requestId}</h3>
              <div className="approval-summary">
                <div className="detail-row">
                  <strong>Title:</strong>
                  <span>{selectedItem?.title}</span>
                </div>
                <div className="detail-row">
                  <strong>Estimated Cost:</strong>
                  <span>{formatCurrency(selectedItem?.estimatedCost || 0)}</span>
                </div>
                <div className="detail-row">
                  <strong>Priority:</strong>
                  <span>{selectedItem?.priority}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Approval Comments</label>
                <textarea placeholder="Add approval comments (optional)" rows={3}></textarea>
              </div>
              <div className="form-group">
                <label>Budget Code</label>
                <select>
                  <option>Select budget allocation</option>
                  <option>Emergency Response - ER2024</option>
                  <option>Medical Supplies - MS2024</option>
                  <option>Equipment - EQ2024</option>
                  <option>Operations - OP2024</option>
                </select>
              </div>
            </div>
          );
        case 'reject-request':
          return (
            <div className="modal-content">
              <h3>Reject Request - {selectedItem?.requestId}</h3>
              <div className="rejection-summary">
                <div className="detail-row">
                  <strong>Title:</strong>
                  <span>{selectedItem?.title}</span>
                </div>
                <div className="detail-row">
                  <strong>Requested by:</strong>
                  <span>{selectedItem?.requester}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Rejection Reason *</label>
                <select>
                  <option>Select rejection reason</option>
                  <option>Budget constraints</option>
                  <option>Insufficient justification</option>
                  <option>Duplicate request</option>
                  <option>Policy violation</option>
                  <option>Alternative solution available</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Comments *</label>
                <textarea placeholder="Provide detailed rejection reason and recommendations" rows={4} required></textarea>
              </div>
            </div>
          );
        case 'update-status':
          return (
            <div className="modal-content">
              <h3>Update Request Status - {selectedItem?.requestId}</h3>
              <div className="form-group">
                <label>Current Status</label>
                <input type="text" value={selectedItem?.status} disabled />
              </div>
              <div className="form-group">
                <label>New Status</label>
                <select>
                  <option>Pending Approval</option>
                  <option>Under Review</option>
                  <option>Approved</option>
                  <option>In Progress</option>
                  <option>Completed</option>
                  <option>On Hold</option>
                  <option>Cancelled</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status Comments</label>
                <textarea placeholder="Add comments about the status change" rows={3}></textarea>
              </div>
              <div className="form-group">
                <label>Notify Requester</label>
                <div className="checkbox-group">
                  <label>
                    <input type="checkbox" defaultChecked />
                    Send email notification
                  </label>
                  <label>
                    <input type="checkbox" defaultChecked />
                    Send SMS notification
                  </label>
                </div>
              </div>
            </div>
          );
        default:
          return (
            <div className="modal-content">
              <h3>Feature: {modalType}</h3>
              <p>This functionality is being developed...</p>
            </div>
          );
      }
    };


    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="modal-header">
            <button className="close-btn" onClick={closeModal}>×</button>
          </div>
          {getModalContent()}
          <div className="modal-actions">
            <button className="secondary-btn" onClick={closeModal}>
              {modalType === 'view-request' ? 'Close' : 'Cancel'}
            </button>
            {modalType !== 'view-request' && (
              <button className="primary-btn">
                {modalType === 'approve-request' ? 'Approve' :
                 modalType === 'reject-request' ? 'Reject' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="procurement-management">
    <h3 className='public-feed-title'>PROCUREMENT MANAGEMENT</h3>
      <div className="navigation">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          📋 Requests
        </button>
        <button
          className={`nav-btn ${activeTab === 'approvals' ? 'active' : ''}`}
          onClick={() => setActiveTab('approvals')}
        >
          ✅ Approvals
        </button>
        <button
          className={`nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Notifications
        </button>
      </div>


      <div className="mains-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'approvals' && renderApprovals()}
        {activeTab === 'notifications' && renderNotifications()}
      </div>


      {renderModal()}
    </div>
  );
};


export default ProcurementManagement;

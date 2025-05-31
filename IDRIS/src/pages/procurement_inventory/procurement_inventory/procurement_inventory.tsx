import React, { act, useState } from 'react';
import './procurement_inventory.scss';


const FinanceAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState<ItemType>(null);

  interface InventoryItemProps {
    id: number | string;
    name: string;
    quantity: number;
    category: string;
    location: string;
    batch: string;
    expiry?: string | null | undefined | Date;
    status: string;
  }


  // Sample inventory data
  const inventoryItems: InventoryItemProps[] = [
    {
      id: 1,
      name: 'Rice Packs',
      quantity: 1250,
      category: 'Food',
      location: 'Warehouse A - Zone 1',
      expiry: '2024-08-15',
      batch: 'RC-2024-001',
      status: 'In Stock'
    },
    {
      id: 2,
      name: 'Water Bottles',
      quantity: 3500,
      category: 'Beverages',
      location: 'Warehouse B - Zone 2',
      expiry: '2025-12-30',
      batch: 'WB-2024-045',
      status: 'In Stock'
    },
    {
      id: 3,
      name: 'Medical Supplies',
      quantity: 85,
      category: 'Medical',
      location: 'Medical Storage - Zone 1',
      expiry: '2024-06-20',
      batch: 'MS-2024-012',
      status: 'Low Stock'
    },
    {
      id: 4,
      name: 'Blankets',
      quantity: 450,
      category: 'Clothing',
      location: 'Warehouse C - Zone 3',
      expiry: null,
      batch: 'BL-2024-008',
      status: 'In Stock'
    },
    {
      id: 5,
      name: 'First Aid Kits',
      quantity: 12,
      category: 'Medical',
      location: 'Medical Storage - Zone 2',
      expiry: '2024-07-10',
      batch: 'FA-2024-003',
      status: 'Critical'
    }
  ];

  interface WarehouseZoneProps {
    id: number;
    name: string;
    capacity: number;
    occupied: number;
    type: string;
    manager: string;
    status: string;
  }


  const warehouseZones: WarehouseZoneProps[] = [
    {
      id: 1,
      name: 'Warehouse A - Zone 1',
      capacity: 5000,
      occupied: 3200,
      type: 'Food Storage',
      manager: 'Juan Carlos',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Warehouse B - Zone 2',
      capacity: 8000,
      occupied: 5600,
      type: 'General Storage',
      manager: 'Maria Santos',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Medical Storage - Zone 1',
      capacity: 1500,
      occupied: 890,
      type: 'Medical Supplies',
      manager: 'Dr. Pedro Gomez',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Warehouse C - Zone 3',
      capacity: 6000,
      occupied: 2100,
      type: 'Clothing & Textiles',
      manager: 'Ana Reyes',
      status: 'Under Maintenance'
    }
  ];


  const donations = [
    {
      id: 1,
      donor: 'Red Cross Philippines',
      items: 'Medical Supplies',
      quantity: 200,
      date: '2024-05-28',
      status: 'Received'
    },
    {
      id: 2,
      donor: 'Local Food Bank',
      items: 'Rice Packs',
      quantity: 500,
      date: '2024-05-29',
      status: 'Processing'
    },
    {
      id: 3,
      donor: 'Community Center',
      items: 'Blankets',
      quantity: 150,
      date: '2024-05-30',
      status: 'Pending'
    }
  ];


  const getStockStatus = (quantity: number = 0) => {
    if (quantity < 50) return 'critical';
    if (quantity < 200) return 'low';
    return 'good';
  };


  const getExpiryStatus = (expiry?: string | null): string => {
    if (!expiry) return 'no-expiry'; // handles null, undefined, empty string

    // Now expiry is definitely a string, safe to pass to new Date()
    const expiryDate = new Date(expiry);

    if (isNaN(expiryDate.getTime())) return 'invalid-date';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'good';
  };

  type ModalType = 'edit' | 'delete' | 'view' | string; // adjust as needed
  type ItemType = string | InventoryItemProps | WarehouseZoneProps | { id: number; donor: string; items: string; quantity: number; date: string; status: string; } | null; // updated to include donation object

  const openModal = (type: ModalType, item: ItemType = null): void => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setSelectedItem(null);
  };


  const renderModal = () => {
    if (!showModal) return null;


    const getModalContent = () => {
      switch (modalType) {
        case 'add-item':
        case 'edit-item':
          return (
            <div className="modal-content">
              <h3>{modalType === 'add-item' ? 'Add New Item' : 'Edit Item'}</h3>
              <div className="form-group">
                <label>Item Name</label>
                <input type="text" placeholder="Enter item name" defaultValue={selectedItem && typeof selectedItem === 'object' && 'name' in selectedItem ? selectedItem.name : ''} />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" placeholder="Enter quantity" defaultValue={selectedItem && typeof selectedItem === 'object' && 'quantity' in selectedItem ? selectedItem.quantity : ''} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select defaultValue={selectedItem && typeof selectedItem === 'object' && 'category' in selectedItem ? selectedItem.category : ''}>
                  <option>Select category</option>
                  <option>Food</option>
                  <option>Medical</option>
                  <option>Clothing</option>
                  <option>Beverages</option>
                </select>
              </div>
              <div className="form-group">
                <label>Batch Number</label>
                <input type="text" placeholder="Enter batch number" defaultValue={selectedItem && typeof selectedItem === 'object' && 'batch' in selectedItem ? selectedItem.batch : ''} />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input type="date" defaultValue={selectedItem && typeof selectedItem === 'object' && 'expiry' in selectedItem ? (selectedItem.expiry instanceof Date ? selectedItem.expiry.toISOString().split('T')[0] : selectedItem.expiry) || '' : ''} />
              </div>
              <div className="form-group">
                <label>Location</label>
                <select defaultValue={selectedItem && typeof selectedItem === 'object' && 'location' in selectedItem ? selectedItem.location : ''}>
                  <option>Select location</option>
                  {warehouseZones.map(zone => (
                    <option key={zone.id} value={zone.name}>{zone.name}</option>
                  ))}
                </select>
              </div>
            </div>
          );
        case 'create-zone':
        case 'edit-zone':
          return (
            <div className="modal-content">
              <h3>{modalType === 'create-zone' ? 'Create Warehouse Zone' : 'Edit Warehouse Zone'}</h3>
              <div className="form-group">
                <label>Zone Name</label>
                <input type="text" placeholder="Enter zone name" defaultValue={selectedItem && typeof selectedItem === 'object' && 'name' in selectedItem ? selectedItem.name : ''} />
              </div>
              <div className="form-group">
                <label>Zone Type</label>
                <select defaultValue={selectedItem && typeof selectedItem === 'object' && 'type' in selectedItem ? selectedItem.type : ''}>
                  <option>Select type</option>
                  <option>Food Storage</option>
                  <option>Medical Supplies</option>
                  <option>General Storage</option>
                  <option>Clothing & Textiles</option>
                </select>
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" placeholder="Enter capacity" defaultValue={selectedItem && typeof selectedItem === 'object' && 'capacity' in selectedItem ? selectedItem.capacity : ''} />
              </div>
              <div className="form-group">
                <label>Manager</label>
                <input type="text" placeholder="Enter manager name" defaultValue={selectedItem && typeof selectedItem === 'object' && 'manager' in selectedItem ? selectedItem.manager : ''} />
              </div>
            </div>
          );
        case 'add-donation':
        case 'process-donation':
          return (
            <div className="modal-content">
              <h3>{modalType === 'add-donation' ? 'Record New Donation' : 'Process Donation'}</h3>
              <div className="form-group">
                <label>Donor Name</label>
                <input type="text" placeholder="Enter donor name" defaultValue={selectedItem && typeof selectedItem === 'object' && 'donor' in selectedItem ? selectedItem.donor : ''} />
              </div>
              <div className="form-group">
                <label>Items Donated</label>
                <input type="text" placeholder="Enter items" defaultValue={selectedItem && typeof selectedItem === 'object' && 'items' in selectedItem ? selectedItem.items : ''} />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" placeholder="Enter quantity" defaultValue={selectedItem && typeof selectedItem === 'object' && 'quantity' in selectedItem ? selectedItem.quantity : ''} />
              </div>
              <div className="form-group">
                <label>Date Received</label>
                <input type="date" defaultValue={selectedItem && typeof selectedItem === 'object' && 'date' in selectedItem ? selectedItem.date : ''} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select defaultValue={selectedItem && typeof selectedItem === 'object' && 'status' in selectedItem ? selectedItem.status : 'Pending'}>
                  <option>Pending</option>
                  <option>Processing</option>
                  <option>Received</option>
                </select>
              </div>
            </div>
          );
        case 'view-item':
          return (
            <div className="modal-content">
              <h3>Item Details</h3>
              <div className="view-details">
                <div className="detail-row">
                  <strong>Item Name:</strong>
                  <span>{selectedItem && typeof selectedItem === 'object' && 'name' in selectedItem ? selectedItem.name : ''}</span>
                </div>
                <div className="detail-row">
                  <strong>Quantity:</strong>
                  <span>{selectedItem && typeof selectedItem === 'object' && 'quantity' in selectedItem ? selectedItem.quantity : ''} units</span>
                </div>
                <div className="detail-row">
                  <strong>Category:</strong>
                  <span>{selectedItem && typeof selectedItem === 'object' && 'category' in selectedItem ? selectedItem.category : ''}</span>
                </div>
                <div className="detail-row">
                  <strong>Location:</strong>
                  <span>{selectedItem && typeof selectedItem === 'object' && 'location' in selectedItem ? selectedItem.location : ''}</span>
                </div>
                <div className="detail-row">
                  <strong>Batch:</strong>
                  <span>{selectedItem && typeof selectedItem === 'object' && 'batch' in selectedItem ? selectedItem.batch : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <strong>Expiry:</strong>
                  <span>{selectedItem && typeof selectedItem === 'object' && 'expiry' in selectedItem && selectedItem.expiry ? new Date(selectedItem.expiry).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <strong>Status:</strong>
                  <span className={`status-badge ${selectedItem ? getStockStatus(typeof selectedItem === 'object' && 'quantity' in selectedItem ? selectedItem.quantity : 0) : ''}`}>
                    {selectedItem && typeof selectedItem === 'object' && 'status' in selectedItem ? selectedItem.status : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        case 'export':
          return (
            <div className="modal-content">
              <h3>Export Inventory Report</h3>
              <div className="form-group">
                <label>Report Type</label>
                <select>
                  <option>Complete Inventory</option>
                  <option>Low Stock Items</option>
                  <option>Expiring Items</option>
                  <option>By Category</option>
                  <option>By Location</option>
                </select>
              </div>
              <div className="form-group">
                <label>Format</label>
                <select>
                  <option>PDF</option>
                  <option>Excel</option>
                  <option>CSV</option>
                </select>
              </div>
              <div className="form-group">
                <label>Date Range</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input type="date" placeholder="From" />
                  <input type="date" placeholder="To" />
                </div>
              </div>
            </div>
          );
        case 'assign-storage':
          return (
            <div className="modal-content">
              <h3>Assign Storage Area</h3>
              <div className="form-group">
                <label>Zone</label>
                <input type="text" value={selectedItem && typeof selectedItem === 'object' && 'name' in selectedItem ? selectedItem.name : ''} disabled />
              </div>
              <div className="form-group">
                <label>Item Category</label>
                <select>
                  <option>Food Items</option>
                  <option>Medical Supplies</option>
                  <option>Clothing & Textiles</option>
                  <option>General Items</option>
                </select>
              </div>
              <div className="form-group">
                <label>Allocated Space (units)</label>
                <input type="number" placeholder="Enter space allocation" />
              </div>
              <div className="form-group">
                <label>Priority Level</label>
                <select>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
          );
        default:
          return (
            <div className="modal-content">
              <h3>Action: {modalType}</h3>
              <p>This functionality is coming soon...</p>
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
              {modalType === 'view-item' ? 'Close' : 'Cancel'}
            </button>
            {modalType !== 'view-item' && (
              <button className="primary-btn">
                {modalType === 'export' ? 'Generate Report' : 'Save'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="inventory-warehousing">
      <h3 className='public-feed-title'>Inventory & Warehousing System</h3>

      <div className="navigation">
        <button
          className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          📦 Inventory
        </button>
        <button
          className={`nav-btn ${activeTab === 'warehouses' ? 'active' : ''}`}
          onClick={() => setActiveTab('warehouses')}
        >
          🏢 Warehouse Zones
        </button>
        <button
          className={`nav-btn ${activeTab === 'donations' ? 'active' : ''}`}
          onClick={() => setActiveTab('donations')}
        >
          🎁 Donations
        </button>
      </div>


      <div className="procurement-inventory-active-section">
        {activeTab == "dashboard" && <div className="dashboard-content">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>{inventoryItems.length}</h3>
                <p>Total Items</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚠️</div>
              <div className="stat-info">
                <h3>{inventoryItems.filter(item => getStockStatus(item.quantity) === 'critical').length}</h3>
                <p>Critical Stock</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <div className="stat-info">
                <h3>{warehouseZones.filter(zone => zone.status === 'Active').length}</h3>
                <p>Active Zones</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎁</div>
              <div className="stat-info">
                <h3>{donations.filter(d => d.status === 'Received').length}</h3>
                <p>Recent Donations</p>
              </div>
            </div>
          </div>


          <div className="dashboard-grid">
            <div className="chart-container">
              <h3>Stock Levels Overview</h3>
              <div className="stock-overview">
                {inventoryItems.map(item => (
                  <div key={item.id} className="stock-item">
                    <div className="item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">{item.quantity} units</span>
                    </div>
                    <div className="stock-bar">
                      <div
                        className={`stock-fill ${getStockStatus(item.quantity)}`}
                        style={{ width: `${Math.min((item.quantity / 1000) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>


            <div className="chart-container">
              <h3>Expiry Alert Dashboard</h3>
              <div className="expiry-alerts">
                {inventoryItems.filter(item => item.expiry).map(item => (
                  <div key={item.id} className={`expiry-item ${getExpiryStatus(item.expiry instanceof Date ? item.expiry.toISOString() : item.expiry)}`}>
                    <div className="expiry-info">
                      <strong>{item.name}</strong>
                      <span>Batch: {item.batch}</span>
                      <span>Expires: {item.expiry ? new Date(item.expiry).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className={`expiry-status ${getExpiryStatus(item.expiry instanceof Date ? item.expiry.toISOString() : item.expiry)}`}>
                      {getExpiryStatus(item.expiry instanceof Date ? item.expiry.toISOString() : item.expiry).replace('-', ' ').toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>}
        {activeTab == 'inventory' && <div className="inventory-content">
          <div className="section-header">
            <h2>Inventory Dashboard</h2>
            <div className="header-actions">
              <button className="secondary-btn" onClick={() => openModal('export')}>
                📊 Export Report
              </button>
              <button className="primary-btn" onClick={() => openModal('add-item')}>
                + Add Item
              </button>
            </div>
          </div>


          <div className="inventory-table">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Batch</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventoryItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.category}</td>
                    <td>{item.location}</td>
                    <td>{item.batch}</td>
                    <td>{item.expiry ? new Date(item.expiry).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${getStockStatus(item.quantity)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => openModal('edit-item', item)}>
                        Edit
                      </button>
                      <button className="action-btn" onClick={() => openModal('view-item', item)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>}
        {activeTab == 'warehouses' && <div className="warehouses-content">
          <div className="section-header">
            <h2>Warehouse Zones</h2>
            <button className="primary-btn" onClick={() => openModal('create-zone')}>
              + Create Zone
            </button>
          </div>


          <div className="warehouses-grid">
            {warehouseZones.map(zone => (
              <div key={zone.id} className="warehouse-card">
                <div className="warehouse-header">
                  <h3>{zone.name}</h3>
                  <span className={`status-badge ${zone.status.toLowerCase().replace(' ', '-')}`}>
                    {zone.status}
                  </span>
                </div>
                <div className="warehouse-details">
                  <div className="detail-row">
                    <span>Type:</span>
                    <span>{zone.type}</span>
                  </div>
                  <div className="detail-row">
                    <span>Manager:</span>
                    <span>{zone.manager}</span>
                  </div>
                  <div className="detail-row">
                    <span>Capacity:</span>
                    <span>{zone.occupied} / {zone.capacity} units</span>
                  </div>
                  <div className="capacity-bar">
                    <div
                      className="capacity-fill"
                      style={{ width: `${(zone.occupied / zone.capacity) * 100}%` }}
                    ></div>
                  </div>
                  <div className="warehouse-actions">
                    <button className="action-btn" onClick={() => openModal('edit-zone', zone)}>
                      Edit Zone
                    </button>
                    <button className="action-btn" onClick={() => openModal('assign-storage', zone)}>
                      Assign Storage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>}
        { activeTab == 'donations' && <div className="donations-content">
          <div className="section-header">
            <h2>Update Inventory from Donations</h2>
            <button className="primary-btn" onClick={() => openModal('add-donation')}>
              + Record Donation
            </button>
          </div>


          <div className="donations-table">
            <table>
              <thead>
                <tr>
                  <th>Donor</th>
                  <th>Items</th>
                  <th>Quantity</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {donations.map(donation => (
                  <tr key={donation.id}>
                    <td>{donation.donor}</td>
                    <td>{donation.items}</td>
                    <td>{donation.quantity}</td>
                    <td>{new Date(donation.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${donation.status.toLowerCase()}`}>
                        {donation.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-btn" onClick={() => openModal('process-donation', donation)}>
                        Process
                      </button>
                      <button className="action-btn" onClick={() => openModal('view-donation', donation)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div> }
      </div>


      {renderModal()}
    </div>
  );
};


export default FinanceAdmin;  

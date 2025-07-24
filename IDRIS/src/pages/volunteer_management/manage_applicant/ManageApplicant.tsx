import React, { useState } from 'react';
import { Button, Breadcrumb, Input } from 'antd';
import DataTable, { TableColumn } from 'react-data-table-component';
import './css/ManageApplicant.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal, { SweetAlertResult } from 'sweetalert2';

// Define the applicant data interface
interface Applicant {
  id: number;
  name: string;
  contactNumber: string;
  dateApplied: string;
  dateOfBirth: string;
  nationality: string;
}

// Define the component
const ManageApplicant: React.FC = () => {
  const navigate = useNavigate();

  // Initialize applicants data with proper typing
  const applicants: Applicant[] = [
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 2, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/20/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 3, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/20/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: 1, name: 'Kent Dayag', contactNumber: '09567834214', dateApplied: '3/15/2025', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    // ... more data
  ];

  // Alert function with proper typing
  const showAlert = (): void => {
    Swal.fire({
      title: 'You have successfully accepted the applicant.',
      icon: 'success',
      confirmButtonColor: '#749AB6',
      width: '380px',
      showConfirmButton: false,
      customClass: {
        popup: 'custom-height-modal',
        title: 'custom-swal-title',
        htmlContainer: 'custom-swal-text',
        confirmButton: 'custom-swal-button',
        icon: 'custom-swal-icon',
      },
    });
  };

  // Delete handler with proper typing
  const handleDelete = (): void => {
    const swalWithCustomButtons = Swal.mixin({
      customClass: {
        popup: 'custom-swal-popup',
        confirmButton: 'my-confirm-button',
        cancelButton: 'my-cancel-button',
      },
      buttonsStyling: false,
    });

    swalWithCustomButtons.fire({
      title: 'Are you sure you want to decline this applicant?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true,
      width: '380px',
    }).then((result: SweetAlertResult) => {
      if (result.isConfirmed) {
        swalWithCustomButtons.fire({
          title: 'Deleted!',
          text: 'Applicant has been deleted.',
          icon: 'success',
          width: '380px',
        });
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        swalWithCustomButtons.fire({
          title: 'Cancelled',
          text: 'The applicant\'s application has been cancelled.',
          icon: 'error',
          width: '380px',
        });
      }
    });
  };

  // State with proper typing
  const [searchText, setSearchText] = useState<string>('');
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant>(applicants[0]);

  // Filtered applicants with proper typing
  const filteredApplicants: Applicant[] = applicants.filter((applicant: Applicant) =>
    applicant.name.toLowerCase().includes(searchText.toLowerCase()) ||
    applicant.contactNumber.includes(searchText)
  );

  // Event handlers with proper typing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchText(e.target.value);
  };

  const handleRowClick = (row: Applicant): void => {
    setSelectedApplicant(row);
  };

  const handleViewCredentials = (): void => {
    navigate("/volunteer_management/view_credentials");
  };

  const handleAcceptClick = (e: React.MouseEvent<HTMLSpanElement>): void => {
    e.preventDefault();
    showAlert();
  };

  const handleDeclineClick = (e: React.MouseEvent<HTMLSpanElement>): void => {
    e.preventDefault();
    handleDelete();
  };

  // Columns definition with proper typing
  const columns: TableColumn<Applicant>[] = [
    {
      name: 'No.',
      selector: (row: Applicant) => row.id,
      sortable: true,
      width: '70px',
    },
    {
      name: 'Name',
      selector: (row: Applicant) => row.name,
      sortable: true,
    },
    {
      name: 'Contact Number',
      selector: (row: Applicant) => row.contactNumber,
    },
    {
      name: 'Date Applied',
      selector: (row: Applicant) => row.dateApplied,
    },
    {
      name: 'Action',
      cell: (row: Applicant) => (
        <div className="action-buttons">
          <span
            className="action-accept"
            onClick={handleAcceptClick}
          >
            Accept
          </span>
          {' | '}
          <span
            className="action-decline"
            onClick={handleDeclineClick}
          >
            Decline
          </span>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: '200px',
    },
  ];

  return (
    <div className="applicants-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-section">
        <h2 className="page-title">Applicants</h2>
        <Breadcrumb>
          <Breadcrumb.Item href="#">
            <span>Home</span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/volunteer_management/volunteer_dashboard">
              Volunteer Dashboard
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span>Applicants</span>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Applicants List */}
        <div className="applicants-list-card">
          <div className="search-container">
            <h2 className="section-title">Applicants List</h2>
            <Input.Search
              placeholder="Search by name or contact number"
              value={searchText}
              onChange={handleSearchChange}
              style={{ maxWidth: 300, marginBottom: 10 }}
            />
          </div>
          <div className="table-container">
            <DataTable
              columns={columns}
              data={filteredApplicants}
              pagination
              highlightOnHover
              pointerOnHover
              onRowClicked={handleRowClick}
              customStyles={{
                rows: {
                  style: {
                    cursor: 'pointer',
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Applicant Details */}
        <div className="applicant-details-card">
          <h3 className="details-title">
            Applicant Details - {selectedApplicant?.name}
          </h3>
          {selectedApplicant && (
            <div className="details-container">
              <div className="detail-item">
                <p className="detail-label">Full Name</p>
                <p className="detail-value">{selectedApplicant.name}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Contact Number</p>
                <p className="detail-value">{selectedApplicant.contactNumber}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Date Of Birth</p>
                <p className="detail-value">{selectedApplicant.dateOfBirth}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Nationality</p>
                <p className="detail-value">{selectedApplicant.nationality}</p>
              </div>
              <div className="view-credentials-container">
                <Button
                  type="primary"
                  className="view-credentials-button"
                  onClick={handleViewCredentials}
                >
                  View Credentials
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageApplicant;

import React, { useState, useEffect } from 'react';
import { Button, Breadcrumb, Input, Spin, message } from 'antd';
import DataTable, { TableColumn } from 'react-data-table-component';
import './css/ManageApplicant.css';
import { Link, useNavigate } from 'react-router-dom';
import Swal, { SweetAlertResult } from 'sweetalert2';
import { getAllVolunteers } from '../../../API_Handler/individual_volunter_handler'; // Adjust path as needed

// Define the volunteer data interface (matching your backend schema)
interface Volunteer {
  volunteer_id: number;
  user_id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone_number?: string;
  address?: string;
  birthday?: string;
  gender?: string;
  age?: number;
  availability?: string;
  medical_conditions?: string;
  other_medical_conditions?: string;
  certification?: string;
  created_at?: string;
}

// Define the component
const ManageApplicant: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  // Fetch volunteers data on component mount
  useEffect(() => {
    const fetchVolunteers = async () => {
      try {
        setLoading(true);
        const data = await getAllVolunteers();
        setVolunteers(data);
        if (data.length > 0) {
          setSelectedVolunteer(data[0]);
        }
      } catch (error) {
        console.error('Error fetching volunteers:', error);
        message.error('Failed to load volunteers data');
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteers();
  }, []);
  let middleInitial = selectedVolunteer?.middle_name ? selectedVolunteer.middle_name.charAt(0) + '. ' : '';

  // Helper function to get full name
  const getFullName = (volunteer: Volunteer): string => {
    const parts = [volunteer.first_name, volunteer.middle_name, volunteer.last_name];
    return parts.filter(Boolean).join(' ');
  };

  // Helper function to get full name with middle initial
  const getFullNamewMid = (volunteer: Volunteer): string => {
    const parts = [volunteer.first_name, middleInitial, volunteer.last_name];
    return parts.filter(Boolean).join(' ');
  };

  // Helper function to format date
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

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
  const handleDelete = (volunteerId: number): void => {
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
        // Here you would call your delete API
        // deleteVolunteer(volunteerId);

        swalWithCustomButtons.fire({
          title: 'Deleted!',
          text: 'Applicant has been deleted.',
          icon: 'success',
          width: '380px',
        });

        // Remove from local state
        setVolunteers(prev => prev.filter(v => v.volunteer_id !== volunteerId));

        // Update selected volunteer if needed
        if (selectedVolunteer?.volunteer_id === volunteerId) {
          const remaining = volunteers.filter(v => v.volunteer_id !== volunteerId);
          setSelectedVolunteer(remaining.length > 0 ? remaining[0] : null);
        }
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

  // Filtered volunteers with proper typing
  const filteredVolunteers: Volunteer[] = volunteers.filter((volunteer: Volunteer) => {
    const fullName = getFullName(volunteer).toLowerCase();
    const searchLower = searchText.toLowerCase();
    return fullName.includes(searchLower) ||
           volunteer.email.toLowerCase().includes(searchLower) ||
           (volunteer.phone_number && volunteer.phone_number.includes(searchText));
  });

  // Event handlers with proper typing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchText(e.target.value);
  };

  const handleRowClick = (row: Volunteer): void => {
    setSelectedVolunteer(row);
  };

  const handleViewCredentials = (): void => {
    if (selectedVolunteer) {
      // You can pass the volunteer data via navigation state
      navigate("/volunteer_management/view_credentials", {
        state: { volunteer: selectedVolunteer }
      });
    }
  };

  const handleAcceptClick = (e: React.MouseEvent<HTMLSpanElement>, volunteer: Volunteer): void => {
    e.preventDefault();
    e.stopPropagation();
    showAlert();
    // Here you would call your accept API
    // acceptVolunteer(volunteer.volunteer_id);
  };

  const handleDeclineClick = (e: React.MouseEvent<HTMLSpanElement>, volunteer: Volunteer): void => {
    e.preventDefault();
    e.stopPropagation();
    handleDelete(volunteer.volunteer_id);
  };

  // Columns definition with proper typing
  const columns: TableColumn<Volunteer>[] = [
    {
      name: 'No.',
      selector: (row: Volunteer, index?: number) => (index || 0) + 1,
      sortable: true,
      width: '70px',
    },
    {
      name: 'Name',
      selector: (row: Volunteer) => getFullName(row),
      sortable: true,
    },
    {
      name: 'Email',
      selector: (row: Volunteer) => row.email,
      sortable: true,
    },
    {
      name: 'Contact Number',
      selector: (row: Volunteer) => row.phone_number || 'N/A',
    },
    {
      name: 'Date Applied',
      selector: (row: Volunteer) => formatDate(row.created_at),
    },
    {
      name: 'Action',
      cell: (row: Volunteer) => (
        <div className="action-buttons">
          <span
            className="action-accept"
            onClick={(e) => handleAcceptClick(e, row)}
          >
            Accept
          </span>
          {' | '}
          <span
            className="action-decline"
            onClick={(e) => handleDeclineClick(e, row)}
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

  // Loading state
  if (loading) {
    return (
      <div className="applicants-container">
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
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

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
              placeholder="Search by name, email or contact number"
              value={searchText}
              onChange={handleSearchChange}
              style={{ maxWidth: 300, marginBottom: 10 }}
            />
          </div>
          <div className="table-container">
            <DataTable
              columns={columns}
              data={filteredVolunteers}
              pagination
              highlightOnHover
              pointerOnHover
              onRowClicked={handleRowClick}
              noDataComponent={<div style={{ padding: '20px' }}>No volunteers found</div>}
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
            {selectedVolunteer ?
              `Applicant Details - ${getFullNamewMid(selectedVolunteer)}` :
              'Select an applicant to view details'
            }
          </h3>
          {selectedVolunteer && (
            <div className="details-container">
              <div className="detail-item">
                <p className="detail-label">Full Name</p>
                <p className="detail-value">{getFullNamewMid(selectedVolunteer)}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Email</p>
                <p className="detail-value">{selectedVolunteer.email}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Contact Number</p>
                <p className="detail-value">{selectedVolunteer.phone_number || 'N/A'}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Date Of Birth</p>
                <p className="detail-value">{formatDate(selectedVolunteer.birthday)}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Age</p>
                <p className="detail-value">{selectedVolunteer.age || 'N/A'}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Gender</p>
                <p className="detail-value">{selectedVolunteer.gender || 'N/A'}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Address</p>
                <p className="detail-value">{selectedVolunteer.address || 'N/A'}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Availability</p>
                <p className="detail-value">{selectedVolunteer.availability || 'N/A'}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Medical Conditions</p>
                <p className="detail-value">{selectedVolunteer.medical_conditions || 'None'}</p>
              </div>
              {selectedVolunteer.other_medical_conditions && (
                <div className="detail-item">
                  <p className="detail-label">Other Medical Conditions</p>
                  <p className="detail-value">{selectedVolunteer.other_medical_conditions}</p>
                </div>
              )}
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

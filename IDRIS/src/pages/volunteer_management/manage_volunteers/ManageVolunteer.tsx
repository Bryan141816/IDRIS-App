import React, { useState } from "react";
import { Button, Breadcrumb, Input, Switch } from "antd";
import DataTable, { TableColumn } from "react-data-table-component";
import "./css/ManageVolunteer.css";
import { Link, useNavigate } from "react-router-dom";
import Swal, { SweetAlertResult } from "sweetalert2";

// Define the volunteer data interface
interface Volunteer {
  id: React.ReactNode;
  name: string;
  contactNumber: string;
  dateApplied: string;
  dateOfBirth: string;
  nationality: string;
}

// Define the component
const ManageVolunteer: React.FC = () => {
  const navigate = useNavigate();

  // Event handler for switch change
  const onChange = (checked: boolean): void => {
    // Handle switch change logic here
    console.log("Switch changed:", checked);
  };

  // Initialize applicants data with proper typing
  const applicants: Volunteer[] = [
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    {
      id: <Switch defaultChecked onChange={onChange} />,
      name: "123456789",
      contactNumber: "Kent Dayag",
      dateApplied: "09567834214",
      dateOfBirth: "2003/10/10",
      nationality: "Filipino",
    },
    // ... more data
  ];

  // Alert function with proper typing
  const showAlert = (): void => {
    Swal.fire({
      title: "You have successfully accepted the applicant.",
      icon: "success",
      confirmButtonColor: "#749AB6",
      width: "380px",
      showConfirmButton: false,
      customClass: {
        popup: "custom-height-modal",
        title: "custom-swal-title",
        htmlContainer: "custom-swal-text",
        confirmButton: "custom-swal-button",
        icon: "custom-swal-icon",
      },
    });
  };

  // Delete handler with proper typing
  const handleDelete = (): void => {
    const swalWithCustomButtons = Swal.mixin({
      customClass: {
        popup: "custom-swal-popup",
        confirmButton: "my-confirm-button",
        cancelButton: "my-cancel-button",
      },
      buttonsStyling: false,
    });

    swalWithCustomButtons
      .fire({
        title: "Are you sure you want to decline this applicant?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
        width: "380px",
      })
      .then((result: SweetAlertResult) => {
        if (result.isConfirmed) {
          swalWithCustomButtons.fire({
            title: "Deleted!",
            text: "Applicant has been deleted.",
            icon: "success",
            width: "380px",
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithCustomButtons.fire({
            title: "Cancelled",
            text: "The applicant's application has been cancelled.",
            icon: "error",
            width: "380px",
          });
        }
      });
  };

  // State with proper typing
  const [searchText, setSearchText] = useState<string>("");
  const [selectedApplicant, setSelectedApplicant] = useState<Volunteer>(
    applicants[0],
  );

  // Filtered applicants with proper typing
  const filteredApplicants: Volunteer[] = applicants.filter(
    (applicant) =>
      applicant.name.toLowerCase().includes(searchText.toLowerCase()) ||
      applicant.contactNumber.includes(searchText),
  );

  // Columns definition with proper typing
  const columns: TableColumn<Volunteer>[] = [
    {
      name: "Status",
      cell: (row: Volunteer) => row.id,
      sortable: true,
      width: "150px",
      center: true,
    },
    {
      name: "Volunteer ID",
      cell: (row: Volunteer) => row.name,
      sortable: true,
    },
    {
      name: "Name",
      cell: (row: Volunteer) => row.contactNumber,
    },
    {
      name: "Contact Number",
      cell: (row: Volunteer) => row.dateApplied,
    },
    {
      name: "Action",
      cell: (row: Volunteer) => (
        <div>
          {/* Add action buttons here */}
          <Button size="small" onClick={showAlert}>
            Accept
          </Button>
          <Button size="small" danger onClick={handleDelete}>
            Decline
          </Button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "200px",
    },
  ];

  // Input change handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchText(e.target.value);
  };

  // Row click handler
  const handleRowClick = (row: Volunteer): void => {
    setSelectedApplicant(row);
  };

  // Navigate handler
  const handleViewProfile = (): void => {
    navigate("/volunteer_management/volunteer_profiles");
  };

  return (
    <div className="applicants-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-section">
        <h2 className="page-title">Volunteer Lists</h2>
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
            <span>Volunteers</span>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Applicants List */}
        <div className="applicants-list-card">
          <div className="search-container">
            <h2 className="section-title">Volunteer List</h2>
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
                    cursor: "pointer",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Applicant Details */}
        <div className="applicant-details-card">
          <h3 className="details-title">
            Volunteer Details - {selectedApplicant?.name}
          </h3>
          {selectedApplicant && (
            <div className="details-container">
              <div className="detail-item">
                <p className="detail-label">Full Name</p>
                <p className="detail-value">{selectedApplicant.name}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Contact Number</p>
                <p className="detail-value">
                  {selectedApplicant.contactNumber}
                </p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Date Of Birth</p>
                <p className="detail-value">{selectedApplicant.dateOfBirth}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Nationality</p>
                <p className="detail-value">{selectedApplicant.nationality}</p>
              </div>
              <div className="detail-item-joined">
                <p className="detail-label">Number of Programs Joined</p>
                <p className="detail-value">20</p>
              </div>
              <div className="view-credentials-container">
                <Button
                  type="primary"
                  className="view-credentials-button"
                  onClick={handleViewProfile}
                >
                  View Volunteer Profile
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageVolunteer;

import React, { useState } from 'react';
import { Button, Breadcrumb, Input, Switch } from 'antd';
import DataTable, { TableColumn } from 'react-data-table-component';
import './css/ManageVolunteer.css';
import { Link, useNavigate} from 'react-router-dom';
import Swal from 'sweetalert2';

export default function ManageVolunteer() {
    const navigate = useNavigate();
    const onChange = (checked: boolean) => {
        console.log(`switch to ${checked}`);
      };

  const applicants = [
    { id:  <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },
    { id: <Switch defaultChecked onChange={onChange} />, name: '123456789', contactNumber: 'Kent Dayag', dateApplied: '09567834214', dateOfBirth: '2003/10/10', nationality: 'Filipino' },

    // ... more data
  ];


  const showAlert = () => {
    Swal.fire({
        title: 'You have successfully accepted the applicant.',
        icon: 'success',
        confirmButtonColor: '#749AB6', // Change OK button color (e.g. blue)
        width: '380px', // Resize the modal
        showConfirmButton: false,
        customClass: {
            popup: 'custom-height-modal',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-text',
            confirmButton: 'custom-swal-button',
            icon: 'custom-swal-icon',
          },
      });
}


const handleDelete = () => {
    const swalWithCustomButtons = Swal.mixin({
      customClass: {
        popup: 'custom-swal-popup', // 👈 custom popup size
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
      width: '380px', // 👈 sets width directly
    }).then((result) => {
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
          text: 'The applicant’s application has been cancelled.',
          icon: 'error',
          width: '380px',
        });
      }
    });
  };




  const [searchText, setSearchText] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState(applicants[0]);

  const filteredApplicants = applicants.filter(applicant =>
    applicant.name.toLowerCase().includes(searchText.toLowerCase()) ||
    applicant.contactNumber.includes(searchText)
  );

  const columns: TableColumn<typeof applicants[0]>[] = [
    {
        name: 'Status',
        selector: (row) => row.id,
        sortable: true,
        width: '150px',
        // Align the cell content
        center: true,
    },
    {
      name: 'Volunteer ID',
      selector: (row) => row.name,
      sortable: true,

    },
    {
      name: 'Name',
      selector: (row) => row.contactNumber,
    },
    {
      name: 'Contact Number',
      selector: (row) => row.dateApplied,

    },
    {
      name: 'Action',
      selector: (row) => row.dateApplied,
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
        <h2 className="page-title">Voolunteer Lists</h2>
        <Breadcrumb>
          <Breadcrumb.Item href="#"><span>Home</span></Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/volunteer_management/volunteer_dashboard">
                Volunteer Dashboard
             </Link>
            </Breadcrumb.Item>
          <Breadcrumb.Item><span>Volunteers</span></Breadcrumb.Item>
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
              onChange={(e) => setSearchText(e.target.value)}
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
              onRowClicked={(row) => setSelectedApplicant(row)}
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

              <div className="detail-item-joined">
                <p className="detail-label">Number of Programs Joined</p>
                <p className="detail-value">20</p>
              </div>

              <div className="view-credentials-container">
                <Button type="primary" className="view-credentials-button" onClick={() => navigate("/volunteer_management/volunteer_profiles")}>View Volunteer Profile</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

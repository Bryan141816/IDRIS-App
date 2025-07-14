import React, { useState } from 'react';
import { Button, Breadcrumb, Input, Form, Checkbox, Upload, Space, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { InboxOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';
import './css/OrganizationForm.css';

const showAlert = () => {
    Swal.fire({
        title: 'Upload Successfully',
        icon: 'success',
        confirmButtonColor: '#749AB6', // Change OK button color (e.g. blue)
        width: '380px', // Resize the modal
        customClass: {
            popup: 'custom-height-modal',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-text',
            confirmButton: 'custom-swal-button',
            icon: 'custom-swal-icon',
          },
      });

}



const OtherOrganizationForm = () =>{
    const navigate = useNavigate();
  const [form] = Form.useForm();
  const [profilePreview, setProfilePreview] = useState('');

  const onFinish = (values: any) => {
    console.log('Form values:', values);
    showAlert();
    navigate('/volunteer_management/volunteer_dashboard');

  };
// Handle profile picture upload
const beforeProfileUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG file!');
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
    }
    return false;
  };

  const handleProfileChange = (info) => {
    if (info.file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePreview(e.target.result);
      };
      reader.readAsDataURL(info.file);
    }
  };

  // Updated upload button with circular styling
  const uploadButton = (
    <div className="profile-upload-circle">
      {profilePreview ? (
        <img
          src={profilePreview}
          alt="Profile"
          className="profile-preview-image"
        />
      ) : (
        <div className="upload-placeholder">
          <PlusOutlined />
          <div style={{ marginTop: 8 }}>Upload</div>
        </div>
      )}
    </div>
  );


    return(
        <div className="application-form">
            {/* Breadcrumb Navigation */}
      <div className="breadcrumb-section">
        <h2 className="page-title">Organization Application</h2>
        <Breadcrumb>
          <Breadcrumb.Item href="#"><span>Home</span></Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/volunteer_management/volunteer_dashboard">
                Volunteer Dashboard
             </Link>
            </Breadcrumb.Item>
          <Breadcrumb.Item><span>Organization Application</span></Breadcrumb.Item>
        </Breadcrumb>
      </div>
{/* Main Content */}
<div className="application-form-container">
        <div className="form-card">
          <h2 className="form-title">Disaster Relief Volunteer Form</h2>

          <Form

            form={form}
            name="volunteerApplication"
            layout="vertical"
            onFinish={onFinish}
            className="application-form"

          >
            <div className="form-section">

              <h3 className="section-title">Profile Picture</h3>
              {/* Updated profile picture upload section */}
              <Form.Item
                name="profilePicture"
                className="profile-upload-item"
              >
                <div className="profile-upload-container">
                  <Upload
                    name="profilePicture"
                    listType="picture-card"
                    className="profile-uploader"
                    showUploadList={false}
                    beforeUpload={beforeProfileUpload}
                    onChange={handleProfileChange}
                    maxCount={1}
                  >
                    {uploadButton}
                  </Upload>
                </div>
                <div className="profile-upload-hint">
                  Upload a profile picture (JPG/PNG, max 2MB)
                </div>
              </Form.Item>
              <h3 className="section-title upload-title">Upload Files</h3>
              <Form.Item
                name="profilePicture"
                className="upload-item"
              >
                <div className="upload-preview">
                  <Upload.Dragger
                    name="files"
                    multiple={false}
                    listType="picture"
                    maxCount={6}
                    beforeUpload={() => false}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="upload-text">Drop files here</p>
                    <p className="upload-hint">or</p>
                    <Button className="browse-button">Browse</Button>
                  </Upload.Dragger>
                </div>
              </Form.Item>

              <Form.Item
                name="additionalDocuments"
                className="upload-item"
              >

              </Form.Item>

              <div className="note-section">
                <h4 className="note-title">Note:</h4>
                <p className="note-text">
                  Please preview all your documents before clicking the <strong>Upload</strong> button.
                  Once you submit your documents, you cannot delete them.
                </p>
                <Form.Item
                  name="understood"
                  valuePropName="checked"
                >
                  <Checkbox className="understand-checkbox">I understand</Checkbox>
                </Form.Item>
              </div>
            </div>

            <Form.Item className="form-buttons">
              <Space>
                <Button
                  className="previous-button"
                  onClick={() => navigate('/volunteer_management/organization_form')}
                >
                  Previous
                </Button>
                <Button type="primary" htmlType="submit" className="upload-button">
                  Upload
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>


        </div>

    );
}
export default OtherOrganizationForm

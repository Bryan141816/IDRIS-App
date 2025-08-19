import React, { useState } from 'react';
import { Button, Breadcrumb, Input, Form, Select, DatePicker, Space, Checkbox, Upload } from 'antd';
import type { CheckboxOptionType } from 'antd';
import { InboxOutlined, UserOutlined, PlusOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import './css/OrganizationForm.css';

// Define types for form values
interface OrganizationFormValues {
  orgName: string;
  orgType: 'private' | 'ngo' | 'government' | 'educational' | 'other';
  orgEmail: string;
  orgPhone: string;
  orgAddress: string;
  repName: string;
  repPosition: string;
  repPhone: string;
  repEmail: string;
  availability: string[];
}

// Define days of week options with proper typing
const daysOfWeekOptions: CheckboxOptionType[] = [
  { label: 'Sunday', value: 'Sunday' },
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
];

const OrganizationForm: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<OrganizationFormValues>();
  const { Option } = Select;

  const onFinish = (values: OrganizationFormValues): void => {
    // Handle form submission logic here
    console.log(values); // Optional: for debugging
    navigate("/volunteer_management/volunteer_dashboard");
  };


  return (
    <div className="application-form">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-section">
        <h2 className="page-title">Organization Application</h2>
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
            <span>Organization Application</span>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="application-form-container">
        <div className="form-card">
          <h2 className="form-title">Disaster Relief Volunteer Form</h2>
          <Form<OrganizationFormValues>
            form={form}
            name="volunteerApplication"
            layout="vertical"
            onFinish={onFinish}
            className="application-form"
          >
            <div className="form-section">
              <h3 className="section_title">Organization Information</h3>

              <div className="form-row">
                <Form.Item
                  name="orgName"
                  label="Organization Name"
                  className="form-item-half"
                  rules={[
                    {
                      required: true,
                      message: "Please enter organization name",
                    },
                  ]}
                >
                  <Input placeholder="Enter organization name" />
                </Form.Item>

                <Form.Item
                  name="orgType"
                  label="Type of Organization"
                  className="form-item-half"
                  rules={[
                    {
                      required: true,
                      message: "Please select organization type",
                    },
                  ]}
                >
                  <Select placeholder="Select organization type">
                    <Option value="private">Private Company</Option>
                    <Option value="ngo">NGO</Option>
                    <Option value="government">Government</Option>
                    <Option value="educational">Educational Institution</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </div>

              <Form.Item
                name="orgEmail"
                label="Email Address"
                rules={[
                  { required: true, message: "Please enter email address" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="Enter organization email" />
              </Form.Item>

              <div className="form-row">
                <Form.Item
                  name="orgPhone"
                  label="Phone Number"
                  className="form-item-half"
                  rules={[
                    { required: true, message: "Please enter phone number" },
                  ]}
                >
                  <Input placeholder="Enter organization phone" />
                </Form.Item>

                <Form.Item
                  name="orgAddress"
                  label="Address"
                  className="form-item-half"
                  rules={[{ required: true, message: "Please enter address" }]}
                >
                  <Input placeholder="Enter organization address" />
                </Form.Item>
              </div>
            </div>

            <div className="form_section">
              <h3 className="section_title">Representative Information</h3>

              <div className="form-row">
                <Form.Item
                  name="repName"
                  label="Full Name"
                  className="form-item-half"
                  rules={[
                    { required: true, message: "Please enter full name" },
                  ]}
                >
                  <Input placeholder="Enter representative's name" />
                </Form.Item>

                <Form.Item
                  name="repPosition"
                  label="Position / Role in Organization"
                  className="form-item-half"
                  rules={[{ required: true, message: "Please enter position" }]}
                >
                  <Input placeholder="Enter position/role" />
                </Form.Item>
              </div>

              <div className="form-row">
                <Form.Item
                  name="repPhone"
                  label="Phone Number"
                  className="form-item-half"
                  rules={[
                    { required: true, message: "Please enter phone number" },
                  ]}
                >
                  <Input placeholder="Enter representative's phone" />
                </Form.Item>

                <Form.Item
                  name="repEmail"
                  label="Email Address"
                  className="form-item-half"
                  rules={[
                    { required: true, message: "Please enter email address" },
                    { type: "email", message: "Please enter a valid email" },
                  ]}
                >
                  <Input placeholder="Enter representative's email" />
                </Form.Item>
              </div>

              <Form.Item
                name="availability"
                label="Availability"
                rules={[{ required: true, message: 'Please select at least one available day' }]}
              >
                <Checkbox.Group options={daysOfWeekOptions} />
              </Form.Item>
            </div>

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

                                maxCount={1}
                              >

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
                                beforeUpload={(): boolean => false}
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

            <Form.Item className="form-buttons">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="submit-button"
                  onClick={() => navigate('/volunteer_management/otherorganization_form')}
                >
                  Next
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default OrganizationForm;

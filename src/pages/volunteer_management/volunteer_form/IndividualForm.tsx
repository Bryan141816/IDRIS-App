import React, { useState } from 'react';
import { Button, Breadcrumb, Input, Form, Select, DatePicker, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import './css/IndividualForm.css';

const IndividualForm = () =>{
    const navigate = useNavigate();
  const [form] = Form.useForm();
  const { Option } = Select;
  const onFinish = (values: any) => {
    console.log('Form values:', values);
    // Handle form submission logic here
    navigate('/volunteer_management/volunteer_dashboard');
  };
    return(
        <div className="application-form">
            {/* Breadcrumb Navigation */}
      <div className="breadcrumb-section">
        <h2 className="page-title">Individual Application</h2>
        <Breadcrumb>
          <Breadcrumb.Item href="#"><span>Home</span></Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/volunteer_management/volunteer_dashboard">
                Volunteer Dashboard
             </Link>
            </Breadcrumb.Item>
          <Breadcrumb.Item><span>Individual Application</span></Breadcrumb.Item>
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
              <h3 className="section_title">Organization Information</h3>

              <div className="form-row">
                <Form.Item
                  name="orgName"
                  label="Organization Name"
                  className="form-item-half"
                  rules={[{ required: true, message: 'Please enter organization name' }]}
                >
                  <Input placeholder="Enter organization name" />
                </Form.Item>
                <Form.Item
                  name="orgType"
                  label="Type of Organization"
                  className="form-item-half"
                  rules={[{ required: true, message: 'Please select organization type' }]}
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
                  { required: true, message: 'Please enter email address' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter organization email" />
              </Form.Item>
              <div className="form-row">
                <Form.Item
                  name="orgPhone"
                  label="Phone Number"
                  className="form-item-half"
                  rules={[{ required: true, message: 'Please enter phone number' }]}
                >
                  <Input placeholder="Enter organization phone" />
                </Form.Item>
                <Form.Item
                  name="orgAddress"
                  label="Address"
                  className="form-item-half"
                  rules={[{ required: true, message: 'Please enter address' }]}
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
                  rules={[{ required: true, message: 'Please enter full name' }]}
                >
                  <Input placeholder="Enter representative's name" />
                </Form.Item>
                <Form.Item
                  name="repPosition"
                  label="Position / Role in Organization"
                  className="form-item-half"
                  rules={[{ required: true, message: 'Please enter position' }]}
                >
                  <Input placeholder="Enter position/role" />
                </Form.Item>
              </div>
              <div className="form-row">
                <Form.Item
                  name="repPhone"
                  label="Phone Number"
                  className="form-item-half"
                  rules={[{ required: true, message: 'Please enter phone number' }]}
                >
                  <Input placeholder="Enter representative's phone" />
                </Form.Item>
                <Form.Item
                  name="repEmail"
                  label="Email Address"
                  className="form-item-half"
                  rules={[
                    { required: true, message: 'Please enter email address' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input placeholder="Enter representative's email" />
                </Form.Item>
              </div>
              <Form.Item
                name="availability"
                label="Availability"
                rules={[{ required: true, message: 'Please select availability' }]}
              >
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <Form.Item className="form-buttons">
              <Space>
                <Button onClick={() => navigate('/volunteer_management/volunteer_dashboard')}>
                  Cancel
                </Button>
                <Button type="primary" htmlType="submit" className="submit-button">
                  Next
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>


        </div>

    );
}
export default IndividualForm

import React from 'react';
import { Button, Breadcrumb, Input, Form, Select, DatePicker, Space, Checkbox } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import './css/IndividualForm.css';

const daysOfWeekOptions = [
  { label: 'Sunday', value: 'Sunday' },
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
];

const IndividualForm = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { Option } = Select;

  const onFinish = (values) => {
    // Handle form submission logic here
    navigate("/volunteer_management/otherindividual_form");
  };

  return (
    <div className="application-form">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-section">
        <h2 className="page-title">Individual Application</h2>
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
            <span>Individual Application</span>
          </Breadcrumb.Item>
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
            {/* Personal Information Section */}
            <div className="form-section">
              <h3 className="section-title">Personal Information</h3>

              {/* Name Fields */}
              <div className="form-row">
                <Form.Item
                  name="firstName"
                  label="First Name"
                  className="form-item-third"
                  rules={[
                    { required: true, message: "Please enter first name" },
                  ]}
                >
                  <Input placeholder="First" />
                </Form.Item>
                <Form.Item
                  name="middleName"
                  label="Middle Name"
                  className="form-item-third"
                >
                  <Input placeholder="Middle Name" />
                </Form.Item>
                <Form.Item
                  name="lastName"
                  label="Last Name"
                  className="form-item-third"
                  rules={[
                    { required: true, message: "Please enter last name" },
                  ]}
                >
                  <Input placeholder="Last" />
                </Form.Item>
              </div>

              {/* Email Address */}
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: "Please enter email address" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
              >
                <Input placeholder="Enter your email" />
              </Form.Item>

              {/* Phone and Address */}
              <div className="form-row">
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  className="form-item-half"
                  rules={[
                    { required: true, message: "Please enter phone number" },
                  ]}
                >
                  <Input placeholder="Enter your phone" />
                </Form.Item>
                <Form.Item
                  name="address"
                  label="Address"
                  className="form-item-half"
                  rules={[{ required: true, message: "Please enter address" }]}
                >
                  <Input placeholder="Enter your address" />
                </Form.Item>
              </div>

              {/* Birth Date, Gender and Age */}
              <div className="form-row">
                <Form.Item
                  name="birthDate"
                  label="Birth Date"
                  className="form-item-third"
                  rules={[
                    { required: true, message: "Please select birth date" },
                  ]}
                >
                  <DatePicker style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                  name="gender"
                  label="Gender"
                  className="form-item-third"
                  rules={[{ required: true, message: "Please select gender" }]}
                >
                  <Select placeholder="Select gender">
                    <Option value="male">Male</Option>
                    <Option value="female">Female</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="age"
                  label="Age"
                  className="form-item-third"
                  rules={[{ required: true, message: "Please enter age" }]}
                >
                  <Input type="number" placeholder="Enter your age" />
                </Form.Item>
              </div>

              {/* Availability */}
              <Form.Item
                name="availability"
                label="Availability"
                rules={[{ required: true, message: 'Please select at least one available day' }]}
                >
                <Checkbox.Group options={daysOfWeekOptions} />
                </Form.Item>

                <Form.Item
                    name="medicalCondition"
                    label="Do you have any medical condition?"
                    rules={[{ required: true, message: 'Please select an option' }]}
                    >
                    <Select placeholder="Select an option">
                        <Option value="none">None</Option>
                        <Option value="asthma">Asthma</Option>
                        <Option value="heart_condition">Heart Condition</Option>
                        <Option value="diabetes">Diabetes</Option>
                        <Option value="other">Other (please specify below)</Option>
                    </Select>
                    </Form.Item>

                    {/* Optional description if they choose "Other" */}
                    <Form.Item name="medicalDescription" label="If Other, please describe">
                    <Input.TextArea rows={3} placeholder="Describe your condition" />
                    </Form.Item>
            </div>

            {/* Form Buttons */}
            <Form.Item className="form-buttons">
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="submit-button"
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

export default IndividualForm;

import React, { useEffect, useState } from "react";
import {
  Button,
  Breadcrumb,
  Input,
  Form,
  Checkbox,
  Upload,
  Space,
  message,
} from "antd";
import type { UploadChangeParam, UploadFile, RcFile } from "antd/es/upload/interface";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { InboxOutlined, PlusOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import "./css/IndividualForm.css";
// import { createVolunteer } from "../../../API_Handler/individual_volunteer_handler";

// Define interfaces for form values and personal info
interface OtherIndividualFormValues {
  profilePicture?: UploadFile;
  supportingFiles?: UploadFile[];
  understood: boolean;
}

interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  birthDate: string;
  gender: 'male' | 'female';
  age: number;
  availability: string[];
  medicalCondition: string;
  medicalDescription?: string;
}

interface CombinedVolunteerData extends PersonalInfo {
  understood: boolean;
}

const showAlert = (): void => {
  Swal.fire({
    title: "Upload Successfully",
    icon: "success",
    confirmButtonColor: "#749AB6",
    width: "380px",
    customClass: {
      popup: "custom-height-modal",
      title: "custom-swal-title",
      htmlContainer: "custom-swal-text",
      confirmButton: "custom-swal-button",
      icon: "custom-swal-icon",
    },
  });
};

const OtherIndividualForm: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm<OtherIndividualFormValues>();
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [understood, setUnderstood] = useState<boolean>(false);

  useEffect(() => {
    const storedData = localStorage.getItem("personalInfo");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData) as PersonalInfo;
        setPersonalInfo(parsedData);
      } catch (error) {
        console.error("Error parsing personal info:", error);
        message.error("Failed to load personal information");
      }
    }
  }, []);

  // Upload validations
  const beforeProfileUpload = (file: RcFile): boolean | Upload.LIST_IGNORE => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
      return Upload.LIST_IGNORE;
    }
    return false; // prevent auto upload
  };

  const handleProfileChange = (info: UploadChangeParam<UploadFile>): void => {
    if (info.file.originFileObj) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          setProfilePreview(e.target.result);
        }
      };
      reader.readAsDataURL(info.file.originFileObj as Blob);
    }
  };

  const onFinish = async (values: OtherIndividualFormValues): Promise<void> => {
    if (!personalInfo) {
      message.error("Personal information not found.");
      return;
    }

    const combinedData: CombinedVolunteerData = {
      ...personalInfo,
      understood: values.understood,
    };

    try {
      // const result = await createVolunteer(combinedData);
      // console.log("Volunteer created:", result);
      showAlert();
      localStorage.removeItem("personalInfo");
      navigate("/volunteer_management/volunteer_dashboard");
    } catch (err) {
      console.error("Error uploading data:", err);
      message.error("Upload failed!");
    }
  };

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

  return (
    <div className="application-form">
      <div className="breadcrumb-section">
        <h2 className="page-title">Individual Application</h2>
        <Breadcrumb>
          <Breadcrumb.Item>
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

      <div className="application-form-container">
        <div className="form-card">
          <h2 className="form-title">Disaster Relief Volunteer Form</h2>
          <Form<OtherIndividualFormValues>
            form={form}
            name="volunteerApplication"
            layout="vertical"
            onFinish={onFinish}
            className="application-form"
          >
            <div className="form-section">
              <h3 className="section-title">Profile Picture</h3>
              <Form.Item name="profilePicture" className="profile-upload-item">
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
              <Form.Item name="supportingFiles" className="upload-item">
                <Upload.Dragger
                  name="files"
                  multiple={false}
                  listType="picture"
                  maxCount={6}
                  beforeUpload={() => false} // prevent auto upload
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="upload-text">Drop files here</p>
                  <p className="upload-hint">or</p>
                  <Button className="browse-button">Browse</Button>
                </Upload.Dragger>
              </Form.Item>

              <div className="note-section">
                <h4 className="note-title">Note:</h4>
                <p className="note-text">
                  Please preview all your documents before clicking the{" "}
                  <strong>Upload</strong> button. Once you submit your
                  documents, you cannot delete them.
                </p>
                <Form.Item
                  name="understood"
                  valuePropName="checked"
                  rules={[
                    {
                      validator: (_, value) =>
                        value
                          ? Promise.resolve()
                          : Promise.reject(
                              new Error("Please confirm you understand"),
                            ),
                    },
                  ]}
                >
                  <Checkbox
                    onChange={(e: CheckboxChangeEvent) => setUnderstood(e.target.checked)}
                    className="understand-checkbox"
                  >
                    I understand
                  </Checkbox>
                </Form.Item>
              </div>
            </div>

            <Form.Item className="form-buttons">
              <Space>
                <Button
                  className="previous-button"
                  onClick={() =>
                    navigate("/volunteer_management/individual_form")
                  }
                >
                  Previous
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="upload-button"
                  disabled={!understood}
                >
                  Upload
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default OtherIndividualForm;

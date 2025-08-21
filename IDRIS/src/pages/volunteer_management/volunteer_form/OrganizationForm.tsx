// src/pages/VolunteerManagement/OrganizationForm.tsx
import React, { useState, useRef } from 'react';
import {
    Button,
    Breadcrumb,
    Input,
    Form,
    Select,
    Space,
    Checkbox,
    Upload,
    Modal,
    message,
} from 'antd';
import type { CheckboxOptionType } from 'antd';
import type { CheckboxChangeEvent } from 'antd/es/checkbox';
import type { UploadFile as AntdUploadFile, RcFile } from 'antd/es/upload/interface';
import { InboxOutlined, PlusOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import UploadFile from '../../../components/Page_Furniture/UploadFile';
import './css/OrganizationForm.css';

// ✅ import the API handler
import { createOrganizationVolunteer } from '../../../API_Handler/organization_volunteer_handler';

// ---------- Types ----------
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
    availability: string[];                // UI array -> backend string
    organizationPicture?: AntdUploadFile[]; // AntD Upload file list
}

// Base64 helper for image preview
const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
    });

// Days of week options
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

    // For your custom PDF uploader
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [understood, setUnderstood] = useState<boolean>(false);

    // Image preview state
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');

    const pictureList = (Form.useWatch('organizationPicture', form) || []) as AntdUploadFile[];

    const beforeUpload = (file: RcFile) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            message.error('Only JPG/PNG/WebP images are allowed');
            return Upload.LIST_IGNORE;
        }
        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Image must be smaller than 5MB');
            return Upload.LIST_IGNORE;
        }
        return false; // prevent auto upload
    };

    const handlePreview = async (file: AntdUploadFile) => {
        if (!file.url && !file.preview && file.originFileObj) {
            file.preview = await getBase64(file.originFileObj as File);
        }
        setPreviewImage((file.url || (file.preview as string)) ?? '');
        setPreviewOpen(true);
        setPreviewTitle(
            file.name || (file.url ? file.url.substring(file.url.lastIndexOf('/') + 1) : 'Preview'),
        );
    };

    // 🔗 Called by your custom <UploadFile />
    const handleFileSelect = (file: File | null) => {
        setSelectedFile(file);
        if (fileInputRef.current) {
            const dt = new DataTransfer();
            if (file) dt.items.add(file);
            fileInputRef.current.files = dt.files;
        }
    };

    // ✅ SUBMIT: build FormData with backend field names and call API
    const onFinish = async (values: OrganizationFormValues): Promise<void> => {
        try {
            const formData = new FormData();

            // Map UI fields -> backend keys
            formData.append('organization_name', values.orgName);
            formData.append('organization_type', values.orgType);
            formData.append('organization_email', values.orgEmail);
            formData.append('organization_phone_number', values.orgPhone);
            formData.append('organization_address', values.orgAddress);

            formData.append('contact_person_name', values.repName);
            formData.append('contact_person_position', values.repPosition);
            formData.append('contact_person_phone_number', values.repPhone);
            formData.append('contact_person_email', values.repEmail);

            // Availability as a string (DB is String(50))
            formData.append('availability', values.availability.join(', '));

            // Files
            const pictureFile = values.organizationPicture?.[0]?.originFileObj as File | undefined;
            if (pictureFile) {
                formData.append('organization_picture_file', pictureFile);
            }
            if (selectedFile) {
                formData.append('organization_certificate_file', selectedFile);
            }

            // If you also allow passing plain paths/URLs, you could append:
            // formData.append('organization_picture', 'https://...'); // optional
            // formData.append('organization_certificate', 'https://...'); // optional

            await createOrganizationVolunteer(formData);

            message.success('Organization submitted successfully.');
            navigate('/volunteer_management/volunteer_dashboard');
        } catch (err: any) {
            console.error(err);
            message.error(err?.response?.data?.detail || 'Submission failed.');
        }
    };

    const uploadButton = (
        <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </div>
    );

    return (
        <div className="application-form">
            {/* Breadcrumb */}
            <div className="breadcrumb-section">
                <h2 className="page-title">Organization Application</h2>
                <Breadcrumb>
                    <Breadcrumb.Item href="#">
                        <span>Home</span>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <Link to="/volunteer_management/volunteer_dashboard">Volunteer Dashboard</Link>
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
                        name="organizationApplication"
                        layout="vertical"
                        onFinish={onFinish}
                        className="application-form"
                    >
                        {/* Organization Info */}
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
                                    { type: 'email', message: 'Please enter a valid email' },
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

                        {/* Representative Info */}
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
                                        { type: 'email', message: 'Please enter a valid email' },
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

                        {/* Organization Picture (image) */}
                        <Form.Item
                            name="organizationPicture"
                            label="Organizational Picture"
                            className="center-upload"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                            // rules={[{ required: true, message: 'Please upload your organizational picture' }]}
                        >
                            <Upload
                                className="custom-upload upload-lg"
                                listType="picture-card"
                                accept="image/png,image/jpeg,image/webp"
                                maxCount={1}
                                beforeUpload={beforeUpload}
                                onPreview={handlePreview}
                            >
                                {pictureList?.length >= 1 ? null : (
                                    <div>
                                        <PlusOutlined />
                                        <div style={{ marginTop: 8 }}>Upload</div>
                                    </div>
                                )}
                            </Upload>
                        </Form.Item>

                        {/* Image preview modal */}
                        <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={() => setPreviewOpen(false)}>
                            <img alt="Organization preview" style={{ width: '100%' }} src={previewImage} />
                        </Modal>

                        {/* Certificate (PDF via custom component) */}
                        <Form.Item
                            name="organizationCertificates"
                            label="Upload Files (certificates, documents, etc.)"
                            className="center-upload"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                            // rules={[{ required: true, message: 'Please upload your certificates/documents' }]}
                        >
                            <div className="upload-preview">
                                <UploadFile
                                    accept="application/pdf"
                                    showName={true}
                                    onFileSelect={handleFileSelect}
                                    className="gift-content"
                                />
                                {/* hidden input only if you need form-controlled file, otherwise not necessary */}
                                <input type="file" style={{ display: 'none' }} ref={fileInputRef} />
                            </div>
                        </Form.Item>

                        <div className="note-section">
                            <h4 className="note-title">Note:</h4>
                            <p className="note-text">
                                Please preview all your documents before clicking the <strong>Upload</strong> button. Once you submit your
                                documents, you cannot delete them.
                            </p>
                            <Form.Item name="understood" valuePropName="checked">
                                <Checkbox onChange={(e: CheckboxChangeEvent) => setUnderstood(e.target.checked)} className="understand-checkbox">
                                    I understand
                                </Checkbox>
                            </Form.Item>
                        </div>

                        {/* Buttons */}
                        <Form.Item className="form-buttons">
                            <Space>
                                <Button type="primary" htmlType="submit" className="submit-button" disabled={!understood}>
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

export default OrganizationForm;

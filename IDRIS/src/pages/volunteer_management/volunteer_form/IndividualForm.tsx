import React, { useState, useEffect } from "react";
import {
    Button,
    Breadcrumb,
    Input,
    Upload,
    Form,
    Select,
    DatePicker,
    Space,
    Checkbox,
} from "antd";
import type { CheckboxOptionType } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import "./css/IndividualForm.css";
import { createIndividualVolunteer, getVolunteerByUserId } from "../../../API_Handler/individual_volunter_handler.ts";
import Swal from "sweetalert2";

// ---------- Types ----------
interface IndividualFormValues {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    birthDate: Dayjs;
    gender: "male" | "female";
    age: number;
    availability: string[];          // stays array in UI (we join into string for backend)
    skills?: string[];               // NEW: array of selected skills
    medicalCondition: "none" | "asthma" | "heart_condition" | "diabetes" | "other";
    medicalDescription?: string;
    supportingFiles?: any[];
    certification?: string[];
}

// ---------- Options ----------
const daysOfWeekOptions: CheckboxOptionType[] = [
    { label: "Sunday", value: "Sunday" },
    { label: "Monday", value: "Monday" },
    { label: "Tuesday", value: "Tuesday" },
    { label: "Wednesday", value: "Wednesday" },
    { label: "Thursday", value: "Thursday" },
    { label: "Friday", value: "Friday" },
    { label: "Saturday", value: "Saturday" },
];

const skillsOptions: CheckboxOptionType[] = [
    { label: "CPR", value: "CPR" },
    { label: "First Aid", value: "First Aid" },
    { label: "BLS", value: "BLS" },
    { label: "Search & Rescue", value: "Search & Rescue" },
    { label: "Fire Safety", value: "Fire Safety" },
    { label: "Radio Comms", value: "Radio Comms" },
    { label: "Logistics", value: "Logistics" },
    { label: "Counseling/Psych First Aid", value: "PFA" },
];

const IndividualForm: React.FC = () => {
    const navigate = useNavigate();
    const [form] = Form.useForm<IndividualFormValues>();
    const { Option } = Select;
    const [understood, setUnderstood] = useState<boolean>(false);
    const [birthDate, setBirthDate] = useState<dayjs.Dayjs | null>(null);
    const [age, setAge] = useState<number | undefined>(undefined);

    const onFinish = async (values: IndividualFormValues): Promise<void> => {


        try {
            const formData = new FormData();
            formData.append("first_name", values.firstName);
            formData.append("middle_name", values.middleName || "");
            formData.append("last_name", values.lastName);
            formData.append("email", values.email);
            formData.append("phone_number", values.phone);
            formData.append("address", values.address);
            formData.append("birthday", values.birthDate.format("YYYY-MM-DD"));
            formData.append("gender", values.gender);
            formData.append("age", String(values.age));
            formData.append("availability", values.availability.join(", "));
            formData.append("medical_conditions", values.medicalCondition);
            formData.append("other_medical_conditions", values.medicalDescription || "N/A");

            // Append skills
            if (values.skills && values.skills.length > 0) {
                values.skills.forEach((s) => formData.append("skills", s));
            }

            if (values.supportingFiles && values.supportingFiles.length > 0) {
                values.supportingFiles.forEach((f: any) => {
                    if (f?.originFileObj) {
                        formData.append("certification_files", f.originFileObj); // <-- same key, multiple entries
                    }
                });
            }

            // Call createIndividualVolunteer API
            await createIndividualVolunteer(formData);
            await showAlert();
            navigate("/volunteer_management/volunteer_dashboard");
        } catch (error) {
            Swal.fire({
                title: 'You have already submitted your application!',
                icon: 'info',
                confirmButtonColor: '#749AB6',
                width: '380px',
                showConfirmButton: true,
                customClass: {
                    popup: 'custom-height-modal',
                    title: 'custom-swal-title',
                    htmlContainer: 'custom-swal-text',
                    confirmButton: 'custom-swal-button',
                    icon: 'custom-swal-icon',
                },
            });
            console.error("Error creating volunteer:", error);
        }
    };

    // Show success alert after form submission
    const showAlert = (): void => {
        Swal.fire({
            title: 'You have successfully uploaded your application.',
            icon: 'success',
            confirmButtonColor: '#749AB6',
            width: '380px',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            customClass: {
                popup: 'custom-height-modal',
                title: 'custom-swal-title',
                htmlContainer: 'custom-swal-text',
                confirmButton: 'custom-swal-button',
                icon: 'custom-swal-icon',
            },
        });
    };

    const calculateAge = (birthDate: dayjs.Dayjs): number => {
        const today = dayjs();
        let age = today.year() - birthDate.year();
        if (
            today.month() < birthDate.month() ||
            (today.month() === birthDate.month() && today.date() < birthDate.date())
        ) {
            age--;
        }
        return age;
    };

    useEffect(() => {
        if (birthDate) {
            const computedAge = calculateAge(birthDate);
            setAge(computedAge);
            form.setFieldsValue({ age: computedAge });
        }
    }, [birthDate, form]);

    const medicalCondition = Form.useWatch("medicalCondition", form);

    // Clear description when not "other"
    useEffect(() => {
        if (medicalCondition !== "other") {
            form.setFieldsValue({ medicalDescription: undefined });
        }
    }, [medicalCondition, form]);

    const validateName = (rule: any, value: string) => {
        const regex = /^[A-Za-z\s]+$/;  // Only allows letters and spaces
        if (value && !regex.test(value)) {
            return Promise.reject('Name can only contain letters and spaces.');
        }
        return Promise.resolve();
    };

    const checkIfAlreadySubmitted = async (user_id: number): Promise<boolean> => {
        try {
            const response = await getVolunteerByUserId(user_id); // Your API function to check volunteer
            return response ? true : false; // If response exists, user already submitted
        } catch (error) {
            console.error("Error checking submission:", error);
            return false;
        }
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
                    <h2 className="form-title">Volunteer Form</h2>
                    <Form<IndividualFormValues>
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
                                    rules={[{ required: true, message: "Please enter first name" }, { validator: validateName }]}
                                >
                                    <Input placeholder="First" />
                                </Form.Item>

                                <Form.Item
                                    name="middleName"
                                    label="Middle Name"
                                    className="form-item-third"
                                    rules={[{ validator: validateName }]}>
                                    <Input placeholder="Middle Name" />
                                </Form.Item>

                                <Form.Item
                                    name="lastName"
                                    label="Last Name"
                                    className="form-item-third"
                                    rules={[{ required: true, message: "Please enter last name" }, { validator: validateName }]}
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
                                    rules={[{ required: true, message: "Please enter phone number" }]}
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
                                    rules={[{ required: true, message: "Please select birth date" }]}
                                >
                                    <DatePicker style={{ width: "100%" }} onChange={(date) => setBirthDate(date)} />
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
                                    <Input type="number" readOnly value={age ?? ""} />
                                </Form.Item>
                            </div>

                            {/* Availability */}
                            <Form.Item
                                name="availability"
                                label="Availability"
                                rules={[
                                    { required: true, message: "Please select at least one available day" },
                                ]}
                            >
                                <Checkbox.Group options={daysOfWeekOptions} />
                            </Form.Item>

                            {/* NEW: Skills */}
                            <Form.Item
                                name="skills"
                                label="Skills"
                                rules={[{ required: true, message: "Please select at least one skill" }]}
                            >
                                <Checkbox.Group options={skillsOptions} />
                            </Form.Item>

                            {/* Medical Condition */}
                            <Form.Item
                                name="medicalCondition"
                                label="Do you have any medical condition?"
                                rules={[{ required: true, message: "Please select an option" }]}
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
                            <Form.Item
                                name="medicalDescription"
                                label="If Other, please describe"
                                rules={[
                                    {
                                        required: medicalCondition === "other",
                                        message: "Please describe your condition",
                                    },
                                ]}
                            >
                                <Input.TextArea
                                    rows={3}
                                    placeholder="Describe your condition"
                                    readOnly={medicalCondition !== "other"} // disabled for 'none', 'asthma', 'heart_condition', 'diabetes'
                                    allowClear
                                />
                            </Form.Item>
                        </div>

                        {/* Uploads */}
                        <h3 className="section-title upload-title">Upload Files</h3>
                        <Form.Item name="supportingFiles" className="upload-item" valuePropName="fileList"
                        getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
                        rules={[{ required: true, message: "Please upload your certificates/documents" }]}>
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
                        </Form.Item>

                        <div className="note-section">
                            <h4 className="note-title">Note:</h4>
                            <p className="note-text">
                                Please preview all your documents before clicking the <strong>Upload</strong> button. Once you submit your
                                documents, you cannot delete them.
                            </p>
                            <Form.Item
                                name="understood"
                                valuePropName="checked"
                                rules={[
                                    {
                                        validator: (_, value) =>
                                            value ? Promise.resolve() : Promise.reject(new Error("Please confirm you understand")),
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

                        {/* Form Buttons */}
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

export default IndividualForm;

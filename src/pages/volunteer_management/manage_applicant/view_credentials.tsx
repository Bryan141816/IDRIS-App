import React, { useState } from 'react';
import { Button, Breadcrumb, Modal } from 'antd';
import './css/view_credentials.css';
import { Link, useNavigate } from 'react-router-dom';


export default function ViewCredentials() {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const navigate = useNavigate();
  // Mock credential images (in a real app, these would be uploaded images)
  const credentials = [
    { id: 1, src: 'https://dummyimage.com/350x220/cccccc/808080&text=350x220', alt: 'Certificate 1' },
    { id: 2, src: 'https://dummyimage.com/350x220/cccccc/808080&text=350x220', alt: 'Certificate 2' },
    { id: 3, src: 'https://dummyimage.com/350x220/cccccc/808080&text=350x220', alt: 'Certificate 3' },
    { id: 4, src: 'https://dummyimage.com/350x220/cccccc/808080&text=350x220', alt: 'Certificate 4' },
    { id: 5, src: 'https://dummyimage.com/350x220/cccccc/808080&text=350x220', alt: 'Certificate 5' },
    { id: 6, src: 'https://dummyimage.com/350x220/cccccc/808080&text=350x220', alt: 'Certificate 6' },
  ];

  const handlePreview = (image: { id?: number; src: any; alt?: string; }) => {
    setPreviewImage(image.src);
    setPreviewVisible(true);
  };

  const handleCancel = () => {
    setPreviewVisible(false);
  };

  return (
    <div className="applicants-container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb-section">
        <h2 className="page-title">Applicants</h2>
        <Breadcrumb>
          <Breadcrumb.Item href="#"><span>Home</span></Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/volunteer_management/volunteer_dashboard">
                Volunteer Dashboard
             </Link>
            </Breadcrumb.Item>
          <Breadcrumb.Item><span>Applicants</span></Breadcrumb.Item>
        </Breadcrumb>
      </div>

      {/* Main Content */}
      <div className="main-content1">
        <div className="credentials-container">
          <h2>Credentials</h2>
          <div className="credentials-grid">
            {credentials.map(image => (
              <div key={image.id} className="credential-card" onClick={() => handlePreview(image)}>
                <img src={image.src} alt={image.alt} />
              </div>
            ))}
          </div>
          <div className="navigation-buttons">
            <Button className="back-button" onClick={() => navigate("/volunteer_management/manage_applicant")}>
            Go Back
            </Button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        footer={null}
        onCancel={handleCancel}
        centered
        width="auto"
        className="image-preview-modal"
      >
        <img alt="Credential Preview" src={previewImage} style={{ maxWidth: '100%' }} />
      </Modal>


    </div>
  );
}

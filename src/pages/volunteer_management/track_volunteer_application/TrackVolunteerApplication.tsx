import React, { useState, useEffect } from 'react';
import {Link, useNavigate } from 'react-router-dom';
import {Breadcrumb} from 'antd';
import './css/TrackVolunteerApplication.css'; // Import external CSS file

const TrackVolunteerApplication = () => {

  const navigate = useNavigate();
  // TEST VARIABLES - Set these to true to test different states
  const isTestMode = false; // Set to true to auto-progress through steps
  const testVariables = {
    submittedStep: true,     // Controls step 1 (Submitted Credentials)
    verifyingStep: false,    // Controls step 2 (Verifying Credentials)
    completedStep: false     // Controls step 3 (Successfully Verified)
  };

  // Calculate current step based on test variables
  const calculateStep = () => {
    if (testVariables.completedStep) return 3;
    if (testVariables.verifyingStep) return 2;
    if (testVariables.submittedStep) return 1;
    return 0;
  };

  // Check if all steps are completed to enable the View Profile button
  const allStepsCompleted =
    testVariables.submittedStep &&
    testVariables.verifyingStep &&
    testVariables.completedStep;

  const [currentStep, setCurrentStep] = useState(calculateStep());

  // Auto-progress feature when isTestMode is true
  useEffect(() => {
    let timer;
    if (isTestMode && currentStep < 3) {
      timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, 2000); // Progress every 2 seconds
    }

    return () => clearTimeout(timer);
  }, [currentStep, isTestMode]);

  // Update step when test variables change
  useEffect(() => {
    setCurrentStep(calculateStep());
  }, [testVariables.submittedStep, testVariables.verifyingStep, testVariables.completedStep]);

  const advanceStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (

    <div className="application-form">
    {/* Breadcrumb Navigation */}
    <h2 className="page-title">Track Volunteer Application</h2>
    <Breadcrumb>
          <Breadcrumb.Item><Link to="/">Home</Link></Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/volunteer_management/volunteer_dashboard">
              Volunteer Dashboard
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            Track Volunteer Application
          </Breadcrumb.Item>

        </Breadcrumb>

      {/* Main Content */}
      <div className="tracker-container">
        <h1 className="tracker-title">Track your Application</h1>

        <div className="tracker-steps">
          <div className="tracker-step">
            <div className={`step-circle ${currentStep >= 1 ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                      fill="currentColor" />
              </svg>
            </div>
            <div className="step-connector"></div>
            <div className="step-content">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                        fill="currentColor" />
                  <path d="M14 8V2L20 8H14Z" fill="currentColor" />
                  <path d="M16 13H8V15H16V13Z" fill="currentColor" />
                  <path d="M16 17H8V19H16V17Z" fill="currentColor" />
                  <path d="M10 9H8V11H10V9Z" fill="currentColor" />
                  <path d="M16 9H12V11H16V9Z" fill="currentColor" />
                </svg>
              </div>
              <div className="step-label">Submitted<br />Credentials</div>
            </div>
          </div>

          <div className="tracker-step">
            <div className={`step-circle ${currentStep >= 2 ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                      fill="currentColor" />
              </svg>
            </div>
            <div className="step-connector"></div>
            <div className="step-content">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                        fill="currentColor" />
                  <path d="M14 8V2L20 8H14Z" fill="currentColor" />
                  <path d="M16 13H8V15H16V13Z" fill="currentColor" />
                  <path d="M16 17H8V19H16V17Z" fill="currentColor" />
                  <path d="M10 9H8V11H10V9Z" fill="currentColor" />
                  <path d="M16 9H12V11H16V9Z" fill="currentColor" />
                </svg>
              </div>
              <div className="step-label">Verifying<br />Credentials</div>
            </div>
          </div>

          <div className="tracker-step">
            <div className={`step-circle ${currentStep >= 3 ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
                      fill="currentColor" />
              </svg>
            </div>
            <div className="step-content">
              <div className="step-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"
                        fill="currentColor" />
                </svg>
              </div>
              <div className="step-label">Successfully<br />Verified</div>
            </div>
          </div>
        </div>

        <div className="tracker-actions">
        <button
            className={`view-profile-btn ${allStepsCompleted ? 'enabled' : 'disabled'}`}
            disabled={!allStepsCompleted}
            onClick={() => navigate('/volunteer_management/volunteer_profiles')}>
            View Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrackVolunteerApplication;

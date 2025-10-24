import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateFunding.scss";
import Swal from "sweetalert2";
import { createFundingproposals } from "../../../API_Handler/donations_funding_proposals_handler";
import { getDonors } from "../../../API_Handler/donations_donors_handler";
import { createNotification } from "../../../API_Handler/notification_handler";

// Format input as currency with commas
function formatCurrencyInput(value: string): string {
  const nums = value.replace(/[^\d]/g, "");
  if (!nums) return "";
  return parseInt(nums, 10).toLocaleString();
}

const CreateFunding: React.FC = () => {
  const Navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budgetRequired, setBudgetRequired] = useState("");
  const [startingDate, setStartingDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notifyDonors, setNotifyDonors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // For API, send only digits
    const plainBudget = budgetRequired.replace(/,/g, "");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("budgetRequired", plainBudget);
    formData.append("status", "pending");
    formData.append("starting_date", startingDate);
    formData.append("end_date", endDate);
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      const response = await createFundingproposals(formData);

      if (response.status !== 200 && response.status !== 201) {
        throw new Error("Failed to create proposal");
      }

      if (notifyDonors) {
        try {
          const donorsResponse = await getDonors();
          const donorIds = donorsResponse.data.map((donor: any) => donor.user_id);

          const notificationPayload = {
            title: "New Funding Proposal",
            message: `Hi, [donor_name]! A ${title} funding has been created, visit it by clicking this notification.`,
            url_redirect: `/donations/funding_proposals/${response.data.funding_id}`,
            donors: donorIds,
          };

          await createNotification(notificationPayload);

          await Swal.fire({
            icon: "success",
            title: "Proposal Created",
            text: "Your funding proposal has been created successfully! Notifications have been sent to donors.",
            confirmButtonColor: "#28a745",
          });
        } catch (error) {
          console.error("Error sending notifications:", error);
          await Swal.fire({
            icon: "warning",
            title: "Proposal Created, but...",
            text: "The funding proposal was created, but there was an error sending notifications to donors.",
            confirmButtonColor: "#ffc107",
          });
        }
      } else {
        await Swal.fire({
          icon: "success",
          title: "Proposal Created",
          text: "Your funding proposal has been created successfully!",
          confirmButtonColor: "#28a745",
        });
      }

      Navigate(-1);
      return;
    } catch (error) {
      console.error("Error:", error);

      await Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: "There was an error creating your proposal. Please try again.",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const handleCancelButton = () => {
    if (document.referrer) {
      window.location.href = document.referrer;
    } else {
      window.history.back();
    }
  };

  return (
    <div className="create-funding-wrapper">
      <h1 className="create-funding-title">Create Funding Proposal</h1>
      <form className="create-funding-card" onSubmit={handleSubmit}>
        <section className="create-funding-form">
          <div className="cf-field cf-input">
            <label htmlFor="title">Project Title: </label>
            <input
              type="text"
              name="title"
              placeholder="Title here"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="cf-field cf-textarea">
            <label htmlFor="description">Description:</label>
            <textarea
              name="description"
              cols={30}
              rows={10}
              placeholder="Description here"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="cf-field cf-amount">
  <label htmlFor="targetAmount">Target Amount:</label>
  <span className="currency">₱</span>
  <input
    type="text"
    name="targetAmount"
    placeholder="Amount Here"
    value={budgetRequired}
    onChange={e => setBudgetRequired(formatCurrencyInput(e.target.value))}
    required
    autoComplete="off"
    inputMode="numeric"
    pattern="[\d,]+"
  />
</div>

          <div className="cf-field cf-input">
            <label htmlFor="starting_date">Starting Date: </label>
            <input
              type="date"
              name="starting_date"
              onChange={(e) => setStartingDate(e.target.value)}
              required
            />
          </div>
          <div className="cf-field cf-input">
            <label htmlFor="end_date">End Date: </label>
            <input
              type="date"
              name="end_date"
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div className="cf-field cf-checkbox">
            <input
              type="checkbox"
              name="notifyDonors"
              id="notifyDonors"
              checked={notifyDonors}
              onChange={(e) => setNotifyDonors(e.target.checked)}
            />
            <label htmlFor="notifyDonors">Notify Donors?</label>
          </div>
          <div className="cf-button-group">
            <input
              className="cf-btn cf-btn--submit"
              type="submit"
              value="Submit"
            />
            <button
              type="button"
              className="cf-btn cf-btn--cancel"
              onClick={handleCancelButton}>
              Cancel
            </button>
          </div>
        </section>
        <aside className="create-funding-image-side">
          <div className="cf-upload" tabIndex={0}>
            {!selectedFile ? (
              <>
                <span className="upload-icon" aria-label="Upload">
                  {/* Upload SVG */}
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <path d="M12 16V4M12 4L7 9M12 4L17 9"
                      stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="3" y="17" width="18" height="3" rx="1.5" fill="#60a5fa" opacity="0.25"/>
                  </svg>
                </span>
                <div className="upload-text">Browse or Drop a File Here</div>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    marginTop: 8,
                    background: "transparent",
                    border: "none",
                    color: "#2563eb",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                  tabIndex={-1}
                >
                  Choose File
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={removeSelectedFile}
                  aria-label="Remove Image"
                >
                  {/* X icon, Unicode */}
                  ×
                </button>
                {previewUrl && <img src={previewUrl} alt="Preview" />}
                <div className="filename">{selectedFile.name}</div>
              </>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
};

export default CreateFunding;

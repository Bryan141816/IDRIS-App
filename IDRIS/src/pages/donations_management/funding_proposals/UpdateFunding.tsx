import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./createFunding.scss";
import Swal from "sweetalert2";
import { updateFundingProposal } from "../../../API_Handler/donations_funding_proposals_handler";
import { useUserRoleContext } from "../../../UserRoleContext";
import { getDonors } from "../../../API_Handler/donations_donors_handler";
import { createNotification } from "../../../API_Handler/notification_handler";
import  DefaultImage  from '../files/default_image.jpg';

const backendUrl = "http://127.0.0.1:8000";

// Format input as currency with commas
function formatCurrencyInput(value: string): string {
  const nums = value.replace(/[^\d]/g, "");
  if (!nums) return "";
  return parseInt(nums, 10).toLocaleString();
}

const UpdateFunding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fundingData = location.state;
  console.log(fundingData);
  const { userRoles } = useUserRoleContext();
  const isSuperAdmin = userRoles.includes("superadmin");

  const id = fundingData?.proposalId || null;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(fundingData?.title || "");
  const [description, setDescription] = useState(fundingData?.description || "");
  const [budgetRequired, setBudgetRequired] = useState(
    fundingData?.target?.toLocaleString() || "0",
  );
  const [startingDate, setStartingDate] = useState(
    formatDateForInput(fundingData?.starting_date),
  );
  const [endDate, setEndDate] = useState(
    formatDateForInput(fundingData?.end_date),
  );
  const [isActive, setIsActive] = useState(fundingData?.is_active ?? true);
  const [notifyDonors, setNotifyDonors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (fundingData?.image) {
      setPreviewUrl(`${backendUrl}/${fundingData.image}`);
    }
  }, [fundingData]);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      // If no file is selected, keep the existing image preview
      if (fundingData?.image) {
        setPreviewUrl(`${backendUrl}/${fundingData.image}`);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fundingData?.image) {
      setPreviewUrl(`${backendUrl}/${fundingData.image}`);
    } else {
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Invalid ID for update.",
        confirmButtonColor: "#dc3545",
      });
      return;
    }

    const start = new Date(startingDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 3) {
      Swal.fire({
        icon: "error",
        title: "Invalid Date Range",
        text: "The end date must be at least 3 days after the start date.",
        confirmButtonColor: "#dc3545",
      });
      return;
    }

    const plainBudget = budgetRequired.replace(/,/g, "");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("budgetRequired", plainBudget);
    if (isSuperAdmin) {
      formData.append("is_active", isActive.toString());
    }
    formData.append("starting_date", startingDate);
    formData.append("end_date", endDate);

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      const response = await updateFundingProposal(id, formData);

      if (notifyDonors) {
        try {
          const donorsResponse = await getDonors();
          const donorIds = donorsResponse.data.map((donor: any) => donor.user_id);

          const notificationPayload = {
            title: `Proposal Updated: ${title}`,
            message: `Hi, [donor_name]! The funding proposal for '${title}' has been updated. Check it out!`,
            url_redirect: `/donations/funding_proposals/${id}`,
            donors: donorIds,
          };

          await createNotification(notificationPayload);

          await Swal.fire({
            icon: "success",
            title: "Proposal Updated",
            text: "Your funding proposal has been updated successfully! Notifications have been sent to donors.",
            confirmButtonColor: "#28a745",
          });
        } catch (error) {
          console.error("Error sending notifications:", error);
          await Swal.fire({
            icon: "warning",
            title: "Proposal Updated, but...",
            text: "The funding proposal was updated, but there was an error sending notifications to donors.",
            confirmButtonColor: "#ffc107",
          });
        }
      } else {
        await Swal.fire({
          icon: "success",
          title: "Proposal Updated",
          text: "Your funding proposal has been updated successfully!",
          confirmButtonColor: "#28a745",
        });
      }

      navigate(-1);
    } catch (error: any) {
      console.error("Error details:", error);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "There was an error updating your proposal. Please try again.",
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
      <h1 className="create-funding-title">Update Funding Proposal</h1>
      <form className="create-funding-card" onSubmit={handleUpdate}>
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
              onChange={(e) =>
                setBudgetRequired(formatCurrencyInput(e.target.value))
              }
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
              value={startingDate}
              onChange={(e) => setStartingDate(e.target.value)}
              required
            />
          </div>
          <div className="cf-field cf-input">
            <label htmlFor="end_date">End Date: </label>
            <input
              type="date"
              name="end_date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          {isSuperAdmin && (
            <div className="cf-field cf-checkbox">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <label htmlFor="is_active">Is Active?</label>
            </div>
          )}

          <div className="cf-field cf-checkbox">
            <input
              type="checkbox"
              name="notifyDonors"
              id="notifyDonors"
              checked={notifyDonors}
              onChange={(e) => setNotifyDonors(e.target.checked)}
            />
            <label htmlFor="notifyDonors">Notify Donors About Update?</label>
          </div>

          <div className="cf-button-group">
            <input
              className="cf-btn cf-btn--submit"
              type="submit"
              value="Update"
            />
            <button
              type="button"
              className="cf-btn cf-btn--cancel"
              onClick={handleCancelButton}
            >
              Cancel
            </button>
          </div>
        </section>
        <aside className="create-funding-image-side">
          <div className="cf-upload" tabIndex={0}>
            {!previewUrl && !selectedFile ? (
              <>
                <span className="upload-icon" aria-label="Upload">
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 16V4M12 4L7 9M12 4L17 9"
                      stroke="#60a5fa"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="3"
                      y="17"
                      width="18"
                      height="3"
                      rx="1.5"
                      fill="#60a5fa"
                      opacity="0.25"
                    />
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
                  ×
                </button>
                <img src={previewUrl ? previewUrl : DefaultImage } alt="Preview" />
                {selectedFile && (
                  <div className="filename">{selectedFile.name}</div>
                )}
              </>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
};

export default UpdateFunding;


const formatDateForInput = (dateString: string | undefined) => {
  if (!dateString) return "";
  return new Date(dateString).toISOString().split("T")[0];
};

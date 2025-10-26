import React, { useState, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./createFunding.scss";
import Swal from "sweetalert2";
import UploadFile from "../../../components/Page_Furniture/UploadFile";
import { updateFundingProposal } from "../../../API_Handler/donations_funding_proposals_handler";
import { UserContext } from "../../../UserContext";
import { useUserRoleContext } from "../../../UserRoleContext";

const backendUrl = "http://127.0.0.1:8000";

const CreateFunding: React.FC = () => {
  const Navigate = useNavigate();
  const location = useLocation();
  const fundingData = location.state;
  const { userRoles } = useUserRoleContext();
  const isSuperAdmin = userRoles.includes("superadmin");

  const id = fundingData?.proposalId || null;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState(fundingData?.title || "");
  const [description, setDescription] = useState(
    fundingData?.description || "",
  );
  const [budgetRequired, setBudgetRequired] = useState(
    fundingData?.target || 0,
  );
  const [startingDate, setStartingDate] = useState(
    fundingData?.starting_date || "",
  );
  const [endDate, setEndDate] = useState(
    fundingData?.end_date || "",
  );
  const [isActive, setIsActive] = useState(fundingData?.is_active ?? true);
  const [notifyDonors, setNotifyDonors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(
    fundingData?.image || null,
  );

  React.useEffect(() => {
    if (fundingData?.image) {
      setImagePreview(`${backendUrl}/${fundingData.image}`);
    }
  }, [fundingData]);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }

    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      if (file) dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || id === "null" || id === "undefined") {
      await Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: "Invalid ID for update.",
        confirmButtonColor: "#dc3545",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("budgetRequired", budgetRequired.toString());
    if (isSuperAdmin) {
      formData.append("is_active", isActive.toString());
    }
    if (startingDate) {
      formData.append("starting_date", startingDate);
    }
    if (endDate) {
      formData.append("end_date", endDate);
    }

    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    try {
      const result = await updateFundingProposal(id, formData);

      await Swal.fire({
        icon: "success",
        title: "Proposal Updated",
        text: "Your funding proposal has been updated successfully!",
        confirmButtonColor: "#28a745",
      });

      Navigate(-1);
    } catch (error: any) {
      console.error("Error details:", error);

      if (error.response?.status === 500) {
        await Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Server error occurred. Please try again.",
          confirmButtonColor: "#dc3545",
        });
      } else if (error.response?.status === 404) {
        await Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Proposal not found.",
          confirmButtonColor: "#dc3545",
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: "Failed to update proposal.",
          confirmButtonColor: "#dc3545",
        });
      }
    }
  };

  const handleCancelButton = () => {
    if (document.referrer) {
      window.location.href = document.referrer;
    } else {
      window.history.back();
    }
  }

  return (
    <>
      <h1 className="public-feed-title">Update Funding Proposal</h1>
      <form onSubmit={handleUpdate}>
        <section id="create-funding" className="create-funding">
          <div id="description-container">
            <div className="text-input">
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

            <div className="description-input">
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

            <div className="text-input amount-input">
              <label htmlFor="targetAmount">Target Amount:</label>
              <input
                type="number"
                name="targetAmount"
                placeholder="Amount Here"
                value={budgetRequired}
                onChange={(e) => setBudgetRequired(Number(e.target.value))}
                required
              />
            </div>

            <div className="text-input">
              <label htmlFor="starting_date">Starting Date: </label>
              <input
                type="date"
                name="starting_date"
                value={startingDate}
                onChange={(e) => setStartingDate(e.target.value)}
              />
            </div>

            <div className="text-input">
              <label htmlFor="end_date">End Date: </label>
              <input
                type="date"
                name="end_date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {isSuperAdmin && (
              <div className="text-input checkbox-input">
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

            <div className="text-input checkbox-input">
              <input
                type="checkbox"
                name="notifyDonors"
                id="notifyDonors"
                checked={notifyDonors}
                onChange={(e) => setNotifyDonors(e.target.checked)}
              />
              <label htmlFor="notifyDonors">Notify Donors?</label>
            </div>

            <input
              className="submit-btn green-btn"
              type="submit"
              value="Submit"
            />
            <button
              type="button"
              className="yellow-btn"
              onClick={() => { handleCancelButton() }} >
              Cancel
            </button>
          </div>

          <div id="image-side">
            <UploadFile
              accept="image/*"
              showName={true}
              onFileSelect={handleFileSelect}
              className="new-funding-image"
              defaultImage={imagePreview}
            />
          </div>
        </section>
      </form>
    </>
  );
};

export default CreateFunding;

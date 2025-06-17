import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './createFunding.scss';
import UploadFile from '../../../components/Page_Furniture/UploadFile';
import { updateFundingProposal } from '../../../API_Handler/donations_funding_proposals_handler';

const CreateFunding: React.FC = () => {
  const Navigate = useNavigate();
  const location = useLocation();
  const fundingData = location.state;
  console.log(fundingData);

  const id = fundingData?.proposalId || null;
  console.log('Funding IDID:', id);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState(fundingData?.title || '');
  const [description, setDescription] = useState(fundingData?.description || '');
  const [budgetRequired, setBudgetRequired] = useState(fundingData?.target || 0);
  const [notifyDonors, setNotifyDonors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(fundingData?.image || null);

  React.useEffect(() => {
    if (fundingData?.image) {
      setImagePreview(fundingData.image);
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
    
    console.log('ID for update:', id);
    if (!id || id === 'null' || id === 'undefined') {
      alert('Invalid ID for update');
      return;
    }
  
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('budgetRequired', budgetRequired.toString());
    formData.append('status', 'Active');
    
    // Only append image if a new file was selected
    if (selectedFile) {
      formData.append('image', selectedFile);
    }
  
    try {
      const result = await updateFundingProposal(id, formData);
      console.log('Updated Proposal:', result);
      alert('Proposal updated successfully!');
      Navigate(-1);
    } catch (error: any) {
      console.error('Error details:', error);
      
      // More detailed error handling
      if (error.response?.status === 500) {
        alert('Server error occurred. Please try again.');
      } else if (error.response?.status === 404) {
        alert('Proposal not found.');
      } else {
        alert('Failed to update proposal.');
      }
    }
  };
  return (
    <>
      <h1 className="public-feed-title">Update Funding Proposal</h1>
      <form onSubmit={handleUpdate}>
        <section id='create-funding' className='create-funding'>
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

            <input className="submit-btn green-btn" type="submit" value="Submit" />
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

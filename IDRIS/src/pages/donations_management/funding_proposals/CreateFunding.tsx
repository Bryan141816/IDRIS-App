import React, { useState, useRef  } from 'react';
import { useNavigate } from 'react-router-dom';
import './createFunding.scss';
import UploadFile from '../../../components/Page_Furniture/UploadFile';

const CreateFunding: React.FC = () => {
  const Navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetRequired, setBudgetRequired] = useState('');
  const [notifyDonors, setNotifyDonors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      if (file) dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('budgetRequired', budgetRequired.toString());
    formData.append('status', 'pending'); // or whatever default status
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    try {
      const response = await fetch('http://localhost:8000/funding_proposals/proposals/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create proposal');
      }

      const result = await response.json();
      console.log('Created Proposal:', result);
      alert('Proposal created successfully!');
      Navigate(-1);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create proposal.');
    }
  };

  return (
    <>
      <h1 className="public-feed-title">Create Funding Proposal</h1>
      <form onSubmit={handleSubmit}>
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
                onChange={(e) => setBudgetRequired(e.target.value)}
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
            />
          </div>
        </section>
      </form>
    </>
  );
};

export default CreateFunding;

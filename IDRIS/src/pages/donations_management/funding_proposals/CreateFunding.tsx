import React from 'react';
import './createFunding.scss';
import { useState, useRef } from 'react';
import UploadFile from '../../../components/Page_Furniture/UploadFile';

const CreateFunding: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);

    if (fileInputRef.current) {
      // Manually create a FileList-like object and assign it
      const dataTransfer = new DataTransfer();
      if (file) dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  };
  return (
    <>
      <h1 className="public-feed-title">Create Funding Proposal</h1>
      <section id='create-funding' className='create-funding'>
        <div id="description-container">
          <div className="text-input">
            <label htmlFor="">Project Title: </label>
            <input type="text" name='title' placeholder='Title here' />
          </div>

          <div className="description-input">
            <label htmlFor="">Description:</label>
            <textarea name="description" id="" cols={30} rows={10} placeholder='Description here'></textarea>
          </div>

          <div className="text-input amount-input">
            <label htmlFor="">Target Amount:</label>
            <input type="number" name='targetAmount' placeholder='Amount Here' />
          </div>

          <div className="text-input checkbox-input">
            <input type='checkbox' name='notifyDonors' id='notifyDonors' />
            <label htmlFor="">Notify Donors?</label>
          </div>

          <input className='submit-btn green-btn' type="submit" value={"Submit"} />
        </div>

        <div id="image-side">
          <UploadFile
            accept="image/*"
            showName={true}
            onFileSelect={handleFileSelect}
            className='new-funding-image'
          />
        </div>
      </section>
    </>
  );
};

export default CreateFunding;

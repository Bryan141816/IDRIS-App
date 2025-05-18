import { useState, useRef } from "react";
import SearchBar from "../../../components/Page_Furniture/Search";
import FilterBar from "../../../components/Page_Furniture/Filter";
import UploadFile from "../../../components/Page_Furniture/UploadFile";
import { PlusCircle, Gift } from "../../../components/Page_Furniture/Icons";
import './ListOfRAFIDonors.scss';
import { DonorTable, TableResponse } from "./TableComponent";
import { useUserContext } from "../../../UserContext";
import Profile1 from '../../donations_management/test_images/profile1.png';
import Profile2 from '../../donations_management/test_images/profile2.png';
import Profile3 from '../../donations_management/test_images/profile3.png';

import { Modal } from "../../../components/Page_Furniture/Modals";

const tableData: TableResponse = {
  table_head: [
    { text: "Rank", width: "10%" },
    { text: "Avatar", width: "15%" },
    { text: "Name", width: "25%" },
    { text: "Total Donation", width: "25%" },
    { text: "Date Joined", width: "25%" },
  ],
  table_datas: [
    {
      data: [
        { type: "Text", text: "1", font_weight: 600 },
        { type: "Image", text: Profile1, font_weight: 0, width: "40px" },
        { type: "Text", text: "Alice Johnson", font_weight: 500 },
        { type: "Text", text: "$1,200", font_weight: 500 },
        { type: "Date", text: "2023-01-15", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "2", font_weight: 600 },
        { type: "Image", text: Profile2, font_weight: 0, width: "40px" },
        { type: "Text", text: "Bob Smith", font_weight: 500 },
        { type: "Text", text: "$950", font_weight: 500 },
        { type: "Date", text: "2022-11-03", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "3", font_weight: 600 },
        { type: "Image", text: Profile3, font_weight: 0, width: "40px" },
        { type: "Text", text: "Clara Lee", font_weight: 500 },
        { type: "Text", text: "$870", font_weight: 500 },
        { type: "Date", text: "2021-09-28", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "4", font_weight: 600 },
        { type: "Image", text: Profile1, font_weight: 0, width: "40px" },
        { type: "Text", text: "Daniel Cruz", font_weight: 500 },
        { type: "Text", text: "$800", font_weight: 500 },
        { type: "Date", text: "2022-06-20", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "5", font_weight: 600 },
        { type: "Image", text: Profile2, font_weight: 0, width: "40px" },
        { type: "Text", text: "Emma Watson", font_weight: 500 },
        { type: "Text", text: "$750", font_weight: 500 },
        { type: "Date", text: "2023-04-12", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "6", font_weight: 600 },
        { type: "Image", text: Profile3, font_weight: 0, width: "40px" },
        { type: "Text", text: "Frank Miller", font_weight: 500 },
        { type: "Text", text: "$690", font_weight: 500 },
        { type: "Date", text: "2021-12-30", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "7", font_weight: 600 },
        { type: "Image", text: Profile1, font_weight: 0, width: "40px" },
        { type: "Text", text: "Grace Park", font_weight: 500 },
        { type: "Text", text: "$640", font_weight: 500 },
        { type: "Date", text: "2023-02-05", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "8", font_weight: 600 },
        { type: "Image", text: Profile2, font_weight: 0, width: "40px" },
        { type: "Text", text: "Henry Cavill", font_weight: 500 },
        { type: "Text", text: "$600", font_weight: 500 },
        { type: "Date", text: "2022-10-19", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "9", font_weight: 600 },
        { type: "Image", text: Profile3, font_weight: 0, width: "40px" },
        { type: "Text", text: "Isla Fisher", font_weight: 500 },
        { type: "Text", text: "$580", font_weight: 500 },
        { type: "Date", text: "2022-03-11", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "10", font_weight: 600 },
        { type: "Image", text: Profile1, font_weight: 0, width: "40px" },
        { type: "Text", text: "James Blake", font_weight: 500 },
        { type: "Text", text: "$550", font_weight: 500 },
        { type: "Date", text: "2021-07-09", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "11", font_weight: 600 },
        { type: "Image", text: Profile1, font_weight: 0, width: "40px" },
        { type: "Text", text: "Grace Park", font_weight: 500 },
        { type: "Text", text: "$640", font_weight: 500 },
        { type: "Date", text: "2023-02-05", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "12", font_weight: 600 },
        { type: "Image", text: Profile2, font_weight: 0, width: "40px" },
        { type: "Text", text: "Henry Cavill", font_weight: 500 },
        { type: "Text", text: "$600", font_weight: 500 },
        { type: "Date", text: "2022-10-19", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "13", font_weight: 600 },
        { type: "Image", text: Profile3, font_weight: 0, width: "40px" },
        { type: "Text", text: "Isla Fisher", font_weight: 500 },
        { type: "Text", text: "$580", font_weight: 500 },
        { type: "Date", text: "2022-03-11", font_weight: 400 },
      ],
    },
    {
      data: [
        { type: "Text", text: "14", font_weight: 600 },
        { type: "Image", text: Profile1, font_weight: 0, width: "40px" },
        { type: "Text", text: "James Blake", font_weight: 500 },
        { type: "Text", text: "$550", font_weight: 500 },
        { type: "Date", text: "2021-07-09", font_weight: 400 },
      ],
    },
  ]
};

const ListOfRAFIDonors = () => {
  const { userType } = useUserContext(); // Define UserType - User or Admin

  const filterItems = ["Ascending", "Descending"];
  const [filtered, setSelectedFilter] = useState<string>("");

  const [searched, searchState] = useState(""); // Search bar for Rafi Donors
  const [addDonorSearch, setAddDonorSearch] = useState(""); // Search bar for Add New Donor Modal
  const [newDonorProfile, setNewDonorProfile] = useState<string>(Profile1); // New Donor Profile Image (accepts image directories/links)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeModal, setActiveModal] = useState<string | null>(null); // Active Modal State

  const toggleModal = (navId: string) => {
    setActiveModal(prev => (prev === navId ? null : navId));
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const setNewDonorProfileImage = (image: string) => { // Set New Donor Profile Image
    if (image === null) {
      setNewDonorProfile(Profile1);
      return "";
    }
    setNewDonorProfile(image);
  };

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
    <div id="donors">
      <h3>LIST OF RAFI DONORS</h3>

      <div id="settings-container">
        <SearchBar placeholder="Search Donor" value={searched} onChange={searchState} />
        <FilterBar items={filterItems} value={filtered} onChange={setSelectedFilter} />

        <button // Add Donor Button
          type="button"
          className={"settings-button" + (userType === "admin" ? "" : " hidden")}
          onClick={() => toggleModal("new-donor")}
        >
          Add Donor
          <PlusCircle width={24} height={24} className="add_donor" />
        </button>

        <button // Gift Donor Button
          type="button"
          className={"settings-button" + (userType === "admin" ? "" : " hidden")}
          onClick={() => toggleModal("gift-donor")}
        >
          Gift Donor
          <Gift width={24} height={24} />
        </button>
      </div>

      {/* Table for Donors */}
      <DonorTable tableData={tableData} />

      {/* Add New Donor Modal */}
      <Modal isOpen={activeModal === "new-donor"} onClose={closeModal}>
        <h3 className="modal-title">Add New Donor</h3>
        <SearchBar placeholder="Search Donor" value={addDonorSearch} onChange={setAddDonorSearch} />
        <div id="donor-profile-container">
          <img src={newDonorProfile} alt="userProfile" id="new-donor-profile" />
          <p id="new-donor-text">User Profile</p>
        </div>
        <form action="" id="new-donor-form-contianer">
          <div className="text-entry">
            <input type="text" id="donor-name" className="entry" placeholder=" " />
            <label htmlFor="donor-name" className="entry-label">Donor Name</label>
          </div>

          <div className="text-entry">
            <input type="text" id="total-donation" className="entry" placeholder=" " />

            <label htmlFor="total-donation" className="entry-label">Total Donation</label>
          </div>

          <div className="text-entry">
            <input type="date" id="date-joined" className="entry no-icon" placeholder=" " />
            <label htmlFor="date-joined" className="entry-label">Date Joined</label>
          </div>
          <button type="button" className="green-modal-button" onClick={() => setActiveModal("donor-saved")}>Add Donor</button>
        </form>

      </Modal>


      <Modal isOpen={activeModal === "gift-donor"} onClose={closeModal}>
        <h3 className="modal-title">Gift Donor</h3>
        <SearchBar placeholder="Search Donor" value={addDonorSearch} onChange={setAddDonorSearch} />
        <p className="modal-instruction">Gift a donor with thank you message, greeting, special information, or updates in a file format.</p>

        <div id="gift-donor-profile-container">
          <img src={newDonorProfile} alt="userProfile" id="gift-donor-profile" />
          <p id="gift-donor-text">User Profile</p>
          <p id="gift-donor-email">sample-email@gmail.com</p>
        </div>

        <form id="gift-donor-form">
          {/* Hidden input controlled from FileUploader */}
          <input
            type="file"
            name="giftFile"
            accept="application/pdf"
            ref={fileInputRef}
            className="hidden"
          />

          <UploadFile
            accept="application/pdf"
            showName={true}
            onFileSelect={handleFileSelect}
          />

          {/* <div id="modal-button-container"> */}
          {/* <button type="button" className="modal-button" onClick={closeModal}>Cancel</button> */}
          <button type="button" className="green-modal-button" onClick={() => setActiveModal("gift-sent")}>Send Gift</button>
          {/* </div> */}
        </form>
      </Modal>

      <Modal isOpen={activeModal === "donor-saved"} onClose={closeModal}>
        <h3 className="modal-title">Successfully added donor.</h3>
        <div className="modal-button-container">
          <button type="button" className="yellow-modal-button" onClick={() => setActiveModal("new-donor")}>Add more</button>
          <button type="button" className="green-modal-button" onClick={closeModal}>Close</button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === "gift-sent"} onClose={closeModal}>
        <h3 className="modal-title">Gift Sent Successfully.</h3>
        <div className="modal-button-container">
          <button type="button" className="yellow-modal-button" onClick={() => setActiveModal("gift-donor")}>Send more</button>
          <button type="button" className="green-modal-button" onClick={closeModal}>Close</button>
        </div>
      </Modal>
    </div>
  );
};

export default ListOfRAFIDonors;
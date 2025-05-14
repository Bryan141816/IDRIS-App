import { useState } from "react";
import SearchBar from "../../../components/Public/Search";
import FilterBar from "../../../components/Public/Filter";
import { PlusCircle, Gift } from "../../../components/Icons";
import './ListOfRAFIDonors.scss';
import { DonorTable, TableResponse } from "./TableComponent";
import { useUserContext } from "../../../UserContext";
import Profile1 from '../../donations_management/test_images/profile1.png';
import Profile2 from '../../donations_management/test_images/profile2.png';
import Profile3 from '../../donations_management/test_images/profile3.png';

import { Modal } from "./Modals";

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
  const filterItems = ["Ascending", "Descending"];
  const [searched, searchState] = useState("");
  const [filtered, setSelectedFilter] = useState<string>("");
  const {userType} = useUserContext();

  const [isModalOpen, setShowModal] = useState(false);
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <div id="donors">
      <h3>LIST OF RAFI DONORS</h3>

      <div id="settings-container">
        <SearchBar placeholder="Search Donor" value={searched} onChange={searchState} />
        <FilterBar items={filterItems} value={filtered} onChange={setSelectedFilter} />

        <button type="button" className={"settings-button" + (userType === "admin" ? "" : " hidden")} onClick={openModal}>
          Add Donor
          <PlusCircle width={24} height={24} className="add_donor" />
        </button>

        <button type="button" className={"settings-button" + (userType === "admin" ? "" : " hidden")}>
          Gift Donor
          <Gift width={24} height={24} />
        </button>
      </div>

      <DonorTable tableData={tableData} />

      <Modal isOpen={isModalOpen} onClose={closeModal}>
        <h2>Hello from Modal</h2>
        <p>This is the modal content</p>
      </Modal>
    </div>
  );
}
export default ListOfRAFIDonors
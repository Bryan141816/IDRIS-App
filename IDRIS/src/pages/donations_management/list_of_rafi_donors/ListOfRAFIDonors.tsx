import { useState, useRef, useEffect, useMemo } from "react";
import SearchBar from "../../../components/Page_Furniture/Search";
import FilterBar from "../../../components/Page_Furniture/Filter";
import UploadFile from "../../../components/Page_Furniture/UploadFile";
import { PlusCircle, Gift } from "../../../components/Page_Furniture/Icons";
import "./ListOfRAFIDonors.scss";
import { DonorTable, TableResponse } from "./TableComponent";
import { useUserContext } from "../../../UserContext";
import { useUserRoleContext } from "../../../UserRoleContext";
import { getDonorsList } from "../../../API_Handler/donations_donors_handler";
import Profile1 from "../../donations_management/test_images/profile1.png";
import Profile2 from "../../donations_management/test_images/profile2.png";
import Profile3 from "../../donations_management/test_images/profile3.png";
import { Modal } from "../../../components/Page_Furniture/Modals";

import {
  createNewDonor,
  searchDonorUsers,
} from "../../../API_Handler/donations_donors_handler";

interface DonorData {
  donorId: number;
  donor_name: string;
  organization_name: string;
  total_donation: number;
  date_joined?: Date | string;
}

interface DonorsApiResponse {
  donors: DonorData[];
  total: number;
  skip: number;
  limit: number;
}

interface SearchedDonors {
  id: number;
  donor_name: string;
  email?: string;
}

interface SearchedDonorsAPIResponse {
  donors: SearchedDonors[];
  search: string;
}

const ListOfRAFIDonors = () => {
  // User view Options
  const { userType } = useUserContext();
  const { userRoles } = useUserRoleContext();
  const donorSearchRef = useRef<HTMLDivElement>(null); // For Donor Search at Add New Donor Modal
  const donorGiftRef = useRef<HTMLDivElement>(null); // Gift Donor Modal

  // Preset Variables
  const dateToday = new Date().toISOString().split("T")[0];
  const [dateJoined, setDateJoined] = useState<string>(dateToday);

  // Donors Lists
  const [donors, setDonors] = useState<DonorData[]>([]);

  // Filter Options - filter, sort list of rafi donors
  const donorPerPage = 25;
  const [page, setPage] = useState<number>(1);
  const [maxPage, setMaxPage] = useState<number>(1);
  const sortingItems = ["Ascending", "Descending"];
  const [sorting, setSelectedSorting] = useState<string>("");
  const [searched, searchState] = useState("");

  // Funding Proposals Page Buttons - Previous & Next
  type DirectType = "prev" | "next";
  const handleTablePageControl = (direct: DirectType) => {
    setPage((prevPage) => {
      if (direct === "prev") {
        return Math.max(prevPage - 1, 1); // Prevent going below page 1
      } else {
        return Math.min(prevPage + 1, maxPage); // Prevent going above max page
      }
    });
  };

  // ------------- MODAL THINGS ----------------
  // Set wich modal is currently shown
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // File upload control
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get List of Donors
  useEffect(() => {
    async function fetchDonors() {
      try {
        const response = await getDonorsList(
          searched,
          page,
          donorPerPage
        );
        console.log(response.donor_name);
        setMaxPage(response.max_page);

        if (Array.isArray(response)) {
          setDonors(response);
        } else if (
          response &&
          typeof response === "object" &&
          "donors" in response
        ) {
          setDonors((response as DonorsApiResponse).donors || []);
        } else {
          setDonors([]);
        }
      } catch (error) {
        console.error("Error fetching donors:", error);
        setDonors([]);
      }
    }

    fetchDonors();
  }, [searched, page]);

  // Create filtered and sorted donors based on the filter selection
  const filteredDonors = useMemo(() => {
    let sortedDonors = [...donors];

    if (sorting === "Ascending") {
      // Sort by name ascending
      sortedDonors.sort((a, b) => {
        const nameA = a.organization_name || a.donor_name;
        const nameB = b.organization_name || b.donor_name;
        return nameA.localeCompare(nameB);
      });
    } else if (sorting === "Descending") {
      // Sort by name descending
      sortedDonors.sort((a, b) => {
        const nameA = a.organization_name || a.donor_name;
        const nameB = b.organization_name || b.donor_name;
        return nameB.localeCompare(nameA);
      });
    }

    return sortedDonors;
  }, [donors, sorting]);

  const tableData: TableResponse = {
    table_head: [
      { text: "Rank", width: "10%" },
      { text: "Avatar", width: "15%" },
      { text: "Name", width: "25%" },
      { text: "Total Donation", width: "25%" },
      { text: "Date Joined", width: "25%" },
    ],
    table_datas: filteredDonors.map((donor, index) => ({
      data: [
        {
          type: "Text",
          text: (index + 1).toString(),
          font_weight: 600,
        },
        {
          type: "Image",
          text:
            index % 3 === 0 ? Profile1 : index % 3 === 1 ? Profile2 : Profile3,
          font_weight: 400,
          width: "40px",
        },
        {
          type: "Text",
          text:
            donor.organization_name === null
              ? donor.donor_name
              : donor.organization_name,
          font_weight: 500,
        },
        {
          type: "Text",
          text: "Php" + donor.total_donation, // (Math.random() * 100000).toFixed(2),
          font_weight: 400,
        },
        {
          type: "Date",
          text: donor.date_joined
            ? new Date(donor.date_joined).toLocaleDateString()
            : "N/A",
          font_weight: 400,
        },
      ],
    })),
  };

  const toggleModal = (navId: string) => {
    setActiveModal((prev) => (prev === navId ? null : navId));
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // -==========>  Modal: Add New Donor things
  const [newDonorProfile, setNewDonorProfile] = useState<string>(Profile1); // Donor profile image
  const [addDonorSearch, setAddDonorSearch] = useState(""); // text of search bar
  const [newDonorSearchedItems, setNewDonorSearchedItems] = useState<SearchedDonors[] | null>(null); // List items under search bar

  const handleAddDonorSearch = async () => {
    try {
      const response = await searchDonorUsers(addDonorSearch); // Assuming this is allowed
      if (Array.isArray(response)) {
        setNewDonorSearchedItems(response);
      } else if (
        response &&
        typeof response === "object" &&
        "donors" in response
      ) {
        const filtered = (response as SearchedDonorsAPIResponse).donors.filter(
          (donor) =>
            donor.donor_name.toLowerCase().includes(addDonorSearch.toLowerCase()),
        );
        setNewDonorSearchedItems(
          filtered.map((donor) => ({
            id: donor.id,
            donor_name: donor.donor_name,
            email: donor.email || undefined,
          })),
        );
      } else {
        setNewDonorSearchedItems([]);
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
      setNewDonorSearchedItems([]);
    }
  };

  useEffect(() => {
    if (addDonorSearch.trim() !== "") {
      handleAddDonorSearch();
    } else {
      setNewDonorSearchedItems(null); // or [] if you prefer
    }
  }, [addDonorSearch]);

  useEffect(() => {
    // set searched item to null when outside of search bar is clicked
    const handleClickOutside = (event: MouseEvent) => {
      if (
        donorSearchRef.current &&
        !donorSearchRef.current.contains(event.target as Node)
      ) {
        setNewDonorSearchedItems(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  // Selected New Donor Variable
  const [newUserId, setNewUserId] = useState<number | null>(null);
  const [newDonorName, setNewDonorName] = useState<string>("sample@gmail.com");
  const [isOrganization, setIsOrganization] = useState<boolean>(false);

  // Assign Profile of selected new Donor
  const setSelectedNewDonorProfile = (donor: SearchedDonors) => {
    setNewUserId(donor.id);
    setNewDonorName(donor.donor_name);
    setNewDonorSearchedItems(null)
  };

  const setOrganizationDonorType = (is_organization: boolean) => {
    setIsOrganization(is_organization);
    setActiveModal("new-donor-form-create");
  };

  const handleNewDonorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserId === null) {
      alert("Please select a user");
      return;
    }

    const donor_type = isOrganization ? "Organization" : "Individual";
    const dateJoinedInput = (
      document.getElementById("date-joined") as HTMLInputElement
    ).value;
    const formData = new FormData();

    formData.append("user_id", newUserId.toString()); // You must set this

    if (isOrganization) {
      const orgName = (
        document.getElementById("organization-name") as HTMLInputElement
      ).value;
      formData.append("organization_name", orgName);
    }

    formData.append("donor_type", donor_type);
    formData.append("date_joined", dateJoinedInput);
    try {
      const result = await createNewDonor(formData);
      alert("Donor created successfully!");
      setActiveModal("donor-saved");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create donor.");
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      if (file) dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    }
  };

  // ==============> GIFT DONOR 
  const [giftDonorSearchName, setGiftDonorSearchName] = useState<string>("");
  const [giftDonorSearchedNames, setGiftDonorSearchedNames] = useState<SearchedDonors[] | null>(null);
  const [giftDonorName, setGiftDonorName] = useState("User Profile");
  const [giftDonorEmail, setGiftDonorEmail] = useState<string>("sample-email@gmail.com");

  const handleGiftDonorSearch = async () => {
    try {
      const response = await searchDonorUsers(giftDonorSearchName); // Assuming this is allowed
      console.log(response);
      if (Array.isArray(response)) {
        setGiftDonorSearchedNames(response);
      } else if (
        response &&
        typeof response === "object" &&
        "donors" in response
      ) {
        const filtered = (response as SearchedDonorsAPIResponse).donors.filter(
          (donor) =>
            donor.donor_name.toLowerCase().includes(giftDonorSearchName.toLowerCase()),
        );
        setGiftDonorSearchedNames(
          filtered.map((donor) => ({
            id: donor.id,
            donor_name: donor.donor_name,
            email: donor.email || undefined,
          })),
        );
      } else {
        setGiftDonorSearchedNames([]);
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
      setGiftDonorSearchedNames([]);
    }
  };

  useEffect(() => {
    if (giftDonorSearchName.trim() !== "") {
      handleGiftDonorSearch();
    } else {
      setGiftDonorSearchedNames(null); // or [] if you prefer
    }
  }, [giftDonorSearchName]);

  useEffect(() => {
    // set searched item to null when outside of search bar is clicked
    const handleClickOutside = (event: MouseEvent) => {
      if (
        donorGiftRef.current &&
        !donorGiftRef.current.contains(event.target as Node)
      ) {
        setGiftDonorSearchedNames(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  });

  // Assign Profile of Selected Donor
  const setSelectedGiftDonor = (donor: SearchedDonors) => {
    setGiftDonorName(donor.donor_name);
    setGiftDonorEmail(donor.email || "No email provided");
    setGiftDonorSearchedNames(null);
  };

  return (
    <div id="donors">
      <h3 className="public-feed-title">LIST OF RAFI DONORS</h3>

      <div id="settings-container">
        <SearchBar
          placeholder="Search Donor"
          classname="search-bar"
          value={searched}
          onChange={searchState}
        />
        <FilterBar
          items={sortingItems}
          value={sorting}
          onChange={setSelectedSorting}
        />

        {userRoles.includes("finance admin") && (
          <>
            <button
              type="button"
              className={
                "settings-button" + (userType === "admin" ? "" : " hidden")
              }
              onClick={() => toggleModal("new-donor-type-selection")}
            >
              Add Donor
              <PlusCircle width={24} height={24} className="add_donor" />
            </button>
            <button
              type="button"
              className={
                "settings-button" + (userType === "admin" ? "" : " hidden")
              }
              onClick={() => toggleModal("gift-donor")}
            >
              Gift Donor
              <Gift width={24} height={24} />
            </button>
          </>
        )}
      </div>

      <div id="table-page-control" className="page-contorol">
        <button
          className="prev-page"
          onClick={() => handleTablePageControl("prev")}
        >
          Previous
        </button>
        <p>
          Page: {page}/{""}
          {maxPage}{""}
        </p>
        <button
          className="next-page"
          onClick={() => handleTablePageControl("next")}
        >
          Next
        </button>
      </div>

      <DonorTable tableData={tableData} />

      <div id="table-page-control" className="page-contorol">
        <button
          className="prev-page"
          onClick={() => handleTablePageControl("prev")}
        >
          Previous
        </button>
        <p>
          Page: {page}/{""}
          {maxPage}{""}
        </p>
        <button
          className="next-page"
          onClick={() => handleTablePageControl("next")}
        >
          Next
        </button>
      </div>

      <Modal
        isOpen={activeModal === "new-donor-type-selection"}
        onClose={closeModal}
      >
        <h3 className="modal-title">Select Type of New Donor</h3>
        <div className="modal-buttons-container">
          <button
            type="button"
            className={
              "settings-button" + (userType === "admin" ? "" : " hidden")
            }
            onClick={() => setOrganizationDonorType(false)}
          >
            Individual
          </button>
          <button
            type="button"
            className={
              "settings-button" + (userType === "admin" ? "" : " hidden")
            }
            onClick={() => setOrganizationDonorType(true)}
          >
            Organization
          </button>

        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "new-donor-form-create"}
        onClose={closeModal}
      >
        <h3 className="modal-title">Add New Donor</h3>
        <div id="modal-common-container">
          <div className="search-container" ref={donorSearchRef}>
            <SearchBar
              placeholder="Search Donor"
              value={addDonorSearch}
              onChange={setAddDonorSearch}
              onSearch={() => handleAddDonorSearch()}
            />
            {newDonorSearchedItems != null && (
              <ul className="searched-list">
                {newDonorSearchedItems === null ? (
                  <li>Loading or no results yet...</li>
                ) : newDonorSearchedItems.length === 0 ? (
                  <li>No donors found.</li>
                ) : (
                  newDonorSearchedItems.map((donor, index) => (
                    <li
                      key={index}
                      onClick={() => setSelectedNewDonorProfile(donor)}
                    >
                      {donor.donor_name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <div id="donor-profile-container">
            <img src={newDonorProfile} alt="userProfile" id="new-donor-profile" />
            <p id="new-donor-text">{newDonorName}</p>
          </div>
          <form id="new-donor-form-contianer" onSubmit={handleNewDonorSubmit}>
            {isOrganization == true && (
              <div className="text-entry">
                <input
                  type="text"
                  id="organization-name"
                  className="entry"
                  placeholder=" "
                />
                <label htmlFor="organization-name" className="entry-label">
                  Organization Name
                </label>
              </div>
            )}
            <div className="text-entry">
              <input
                type="date"
                id="date-joined"
                className="entry no-icon"
                placeholder=" "
                value={dateJoined}
                onChange={(e) => setDateJoined(e.target.value)}
              />
              <label htmlFor="date-joined" className="entry-label">
                Date Joined
              </label>
            </div>
            <button type="submit" className="green-modal-button">
              Add Donor
            </button>
          </form>
        </div>

      </Modal>

      <Modal isOpen={activeModal === "gift-donor"} onClose={closeModal}>
        <h3 className="modal-title">Gift Donor</h3>
        <p className="modal-instruction">
          Gift a donor with thank you message, greeting, special information, or
          updates in a file format.
        </p>
        <div id="modal-common-container">
          <div className="search-container" ref={donorGiftRef}>
            <SearchBar
              placeholder="Search Donor"
              value={giftDonorSearchName}
              onChange={setGiftDonorSearchName}
              onSearch={() => handleGiftDonorSearch()}
            />  
            {giftDonorSearchedNames != null && (
              <ul className="searched-list">
                {giftDonorSearchedNames === null ? (
                  <li>Loading or no results yet...</li>
                ) : giftDonorSearchedNames.length === 0 ? (
                  <li>No donors found.</li>
                ) : (
                  giftDonorSearchedNames.map((donor, index) => (
                    <li
                      key={index}
                      onClick={() => setSelectedGiftDonor(donor)}
                    >
                      {donor.donor_name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <div id="gift-donor-profile-container">
            <img
              src={newDonorProfile}
              alt="userProfile"
              id="gift-donor-profile"
            />
            <p id="gift-donor-text">{giftDonorName}</p>
            <p id="gift-donor-email">{giftDonorEmail}</p>
          </div>
          <form id="gift-donor-form">
            <input
              type="file"
              name="giftFile"
              accept="application/pdf"
              ref={fileInputRef}
              className="hidden"
            />
            <div id="gift-dimension-control">
              <UploadFile
                accept="application/pdf"
                showName={true}
                onFileSelect={handleFileSelect}
                className="gift-content"
              />
            </div>
            <button
              type="button"
              className="green-modal-button"
              onClick={() => setActiveModal("gift-sent")}
            >
              Send Gift
            </button>
          </form>
        </div>
      </Modal>

      <Modal isOpen={activeModal === "donor-saved"} onClose={closeModal}>
        <h3 className="modal-title">Successfully added donor.</h3>
        <div className="modal-button-container">
          <button
            type="button"
            className="yellow-modal-button"
            onClick={() => setActiveModal("new-donor-type-selection")}
          >
            Add more
          </button>
          <button
            type="button"
            className="green-modal-button"
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </Modal>

      <Modal isOpen={activeModal === "gift-sent"} onClose={closeModal}>
        <h3 className="modal-title">Gift Sent Successfully.</h3>
        <div className="modal-button-container">
          <button
            type="button"
            className="yellow-modal-button"
            onClick={() => setActiveModal("gift-donor")}
          >
            Send more
          </button>
          <button
            type="button"
            className="green-modal-button"
            onClick={closeModal}
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ListOfRAFIDonors;
